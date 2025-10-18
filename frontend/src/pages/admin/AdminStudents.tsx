import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, Dispatch, FormEvent, SetStateAction } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { domainService } from '../../services/api/domainService';
import type { PagedResponse, Student, StudentFilters, StudentInput } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/ui/Pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { formatDate } from '../../utils/format';
import { getErrorMessage } from '../../utils/error';

const DEFAULT_FORM: StudentInput = {
  userId: 0,
  studentId: '',
  program: '',
  yearOfStudy: 1,
  enrollmentDate: new Date().toISOString().split('T')[0],
  enrollmentStatus: 'ACTIVE',
  phoneNumber: '',
  dateOfBirth: '',
};

const queryKey = 'students';

export function AdminStudents() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<StudentFilters>({ pageNumber: 1, itemsPerPage: 10 });
  const [formState, setFormState] = useState<StudentInput>(DEFAULT_FORM);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!feedback) {
      return;
    }
    const timeout = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const studentsQuery = useQuery<PagedResponse<Student>>({
    queryKey: [queryKey, filters],
    queryFn: async () => {
      const { data } = await domainService.students.list(filters);
      return data;
    },
    placeholderData: (previousData: PagedResponse<Student> | undefined) => previousData,
  });

  const students = useMemo(() => studentsQuery.data?.data ?? [], [studentsQuery.data]);
  const page = studentsQuery.data?.page;

  const handleFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
  };

  const invalidateStudents = () => {
    queryClient.invalidateQueries({ queryKey: [queryKey] }).catch((error) => {
      console.error('Failed to invalidate students cache', error);
    });
  };

  const updateStudent = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: StudentInput }) => {
      const { data } = await domainService.students.update(id, normalizePayload(payload));
      return data;
    },
    onSuccess: (response) => {
      handleFeedback('success', response?.response.message ?? 'Student updated successfully');
      setIsEditOpen(false);
      setSelectedStudent(null);
      invalidateStudents();
    },
    onError: (error) => {
      handleFeedback('error', getErrorMessage(error, 'Failed to update student'));
    },
  });

  const deactivateStudent = useMutation({
    mutationFn: async (id: number) => {
      const { data } = await domainService.students.deactivate(id);
      return data;
    },
    onSuccess: (response) => {
      handleFeedback('success', response?.response.message ?? 'Student deactivated');
      invalidateStudents();
    },
    onError: (error) => {
      handleFeedback('error', getErrorMessage(error, 'Failed to deactivate student'));
    },
  });

  const handleOpenEdit = (student: Student) => {
    setSelectedStudent(student);
    setFormState(mapStudentToForm(student));
    setIsEditOpen(true);
  };

  const handleSubmitEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedStudent) {
      return;
    }
    updateStudent.mutate({ id: selectedStudent.id, payload: formState });
  };

  const handlePageChange = (pageNumber: number) => {
    setFilters((prev) => ({ ...prev, pageNumber }));
  };

  const isLoading = studentsQuery.isLoading || studentsQuery.isFetching;
  const hasError = studentsQuery.isError;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Students</h1>
          <p className="text-sm text-gray-500">Manage student records, enrollment status, and linked accounts.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => studentsQuery.refetch()} disabled={isLoading}>
            Refresh
          </Button>
        </div>
      </header>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <form
          className="grid gap-4 md:grid-cols-4"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const program = (form.get('program') as string) || undefined;
            const year = form.get('yearOfStudy') as string;
            const status = (form.get('enrollmentStatus') as string) || undefined;

            setFilters((prev) => ({
              ...prev,
              pageNumber: 1,
              program,
              yearOfStudy: year ? Number(year) : undefined,
              enrollmentStatus: status && status !== 'ALL' ? status : undefined,
            }));
          }}
        >
          <Input name="program" placeholder="Filter by program" />
          <Input name="yearOfStudy" placeholder="Year of study" type="number" min={1} />
          <select
            name="enrollmentStatus"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            defaultValue="ALL"
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="WITHDRAWN">Withdrawn</option>
            <option value="GRADUATED">Graduated</option>
          </select>
          <div className="flex items-center gap-2">
            <Button type="submit" className="w-full">
              Apply filters
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={(event) => {
                setFilters({ pageNumber: 1, itemsPerPage: filters.itemsPerPage });
                event.currentTarget.form?.reset();
              }}
            >
              Reset
            </Button>
          </div>
        </form>
      </section>

      {feedback ? (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {hasError ? (
          <EmptyState
            title="Failed to load students"
            description="Please refresh the page or adjust your filters."
            actionLabel="Try again"
            onAction={() => studentsQuery.refetch()}
          />
        ) : isLoading ? (
          <Spinner label="Fetching students..." />
        ) : students.length === 0 ? (
          <EmptyState
            title="No students found"
            description="Try adjusting your filters. If you need a new student, please use the Provision users page."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student: Student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.studentId}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{student.username}</span>
                        <span className="text-xs text-gray-500">{student.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>{student.program}</TableCell>
                    <TableCell>{student.yearOfStudy}</TableCell>
                    <TableCell>
                      <Badge variant={student.enrollmentStatus === 'ACTIVE' ? 'success' : 'warning'}>
                        {student.enrollmentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(student.enrollmentDate)}</TableCell>
                    <TableCell>{student.phoneNumber ?? '—'}</TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenEdit(student)}>
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deactivateStudent.mutate(student.id)}
                        disabled={deactivateStudent.isPending}
                      >
                        Deactivate
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="px-4">
          <Pagination page={page} onPageChange={handlePageChange} isLoading={isLoading} />
        </div>
      </section>

      <Modal
        title="Edit Student"
        description="Update student academic details and contact information."
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedStudent(null);
        }}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditOpen(false);
                setSelectedStudent(null);
              }}
            >
              Cancel
            </Button>
            <Button form="edit-student-form" type="submit" disabled={updateStudent.isPending}>
              {updateStudent.isPending ? 'Saving...' : 'Save changes'}
            </Button>
          </>
        }
      >
        <StudentForm formState={formState} setFormState={setFormState} isEditing />
        <form id="edit-student-form" onSubmit={handleSubmitEdit} className="hidden" />
      </Modal>
    </div>
  );
}

interface StudentFormProps {
  formState: StudentInput;
  setFormState: Dispatch<SetStateAction<StudentInput>>;
  isEditing?: boolean;
}

function StudentForm({ formState, setFormState, isEditing = false }: StudentFormProps) {
  const handleChange = (field: keyof StudentInput) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const rawValue = event.target.value;
    const isNumberField = event.target.type === 'number';
    const value = isNumberField ? (rawValue ? Number(rawValue) : undefined) : rawValue;

    setFormState((prev) => ({
      ...prev,
      [field]: value as never,
    }));
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700" htmlFor="userId">
          User ID
        </label>
        <Input
          id="userId"
          type="number"
          min={1}
          value={formState.userId || ''}
          onChange={handleChange('userId')}
          required={!isEditing}
          disabled={isEditing}
          placeholder="Associated user ID"
        />
        <p className="text-xs text-gray-500">
          Provide the Django user ID to link this student to an existing account.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700" htmlFor="studentId">
          Student ID
        </label>
        <Input
          id="studentId"
          value={formState.studentId}
          onChange={handleChange('studentId')}
          required
          placeholder="e.g. STU2024-001"
          disabled={isEditing}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700" htmlFor="program">
          Program
        </label>
        <Input
          id="program"
          value={formState.program}
          onChange={handleChange('program')}
          required
          placeholder="e.g. Computer Science"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700" htmlFor="yearOfStudy">
          Year of Study
        </label>
        <Input
          id="yearOfStudy"
          type="number"
          min={1}
          value={formState.yearOfStudy ?? ''}
          onChange={handleChange('yearOfStudy')}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700" htmlFor="enrollmentStatus">
          Enrollment Status
        </label>
        <select
          id="enrollmentStatus"
          value={formState.enrollmentStatus ?? 'ACTIVE'}
          onChange={handleChange('enrollmentStatus')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <option value="ACTIVE">Active</option>
          <option value="WITHDRAWN">Withdrawn</option>
          <option value="GRADUATED">Graduated</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700" htmlFor="enrollmentDate">
          Enrollment Date
        </label>
        <Input
          id="enrollmentDate"
          type="date"
          value={formState.enrollmentDate}
          onChange={handleChange('enrollmentDate')}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700" htmlFor="dateOfBirth">
          Date of Birth
        </label>
        <Input
          id="dateOfBirth"
          type="date"
          value={formState.dateOfBirth ?? ''}
          onChange={handleChange('dateOfBirth')}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700" htmlFor="phoneNumber">
          Phone Number
        </label>
        <Input
          id="phoneNumber"
          value={formState.phoneNumber ?? ''}
          onChange={handleChange('phoneNumber')}
          placeholder="Optional"
        />
      </div>
    </div>
  );
}

function mapStudentToForm(student: Student): StudentInput {
  return {
    userId: student.userId,
    studentId: student.studentId,
    program: student.program,
    yearOfStudy: student.yearOfStudy,
    enrollmentDate: student.enrollmentDate?.slice(0, 10),
    enrollmentStatus: student.enrollmentStatus ?? 'ACTIVE',
    phoneNumber: student.phoneNumber ?? '',
    dateOfBirth: student.dateOfBirth ? student.dateOfBirth.slice(0, 10) : '',
  };
}

function normalizePayload(payload: StudentInput): StudentInput {
  return {
    ...payload,
    phoneNumber: payload.phoneNumber ? String(payload.phoneNumber) : undefined,
    dateOfBirth: payload.dateOfBirth || undefined,
    enrollmentStatus: payload.enrollmentStatus ?? 'ACTIVE',
  };
}
