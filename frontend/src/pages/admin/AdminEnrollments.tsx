import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, Dispatch, FormEvent, SetStateAction } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { domainService } from '../../services/api/domainService';
import type {
  Course,
  CourseFilters,
  Enrollment,
  EnrollmentFilters,
  EnrollmentInput,
  Lecturer,
  PagedResponse,
  Student,
  StudentFilters,
} from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/ui/Pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { getErrorMessage } from '../../utils/error';
import { formatDate } from '../../utils/format';

const DEFAULT_FORM: EnrollmentInput = {
  studentId: 0,
  courseId: 0,
  semester: '',
  academicYear: '',
  lecturerId: undefined,
};

const queryKey = 'enrollments';

export function AdminEnrollments() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<EnrollmentFilters>({ pageNumber: 1, itemsPerPage: 10 });
  const [formState, setFormState] = useState<EnrollmentInput>(DEFAULT_FORM);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!feedback) {
      return;
    }
    const timeout = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const enrollmentsQuery = useQuery<PagedResponse<Enrollment>>({
    queryKey: [queryKey, filters],
    queryFn: async () => {
      const { data } = await domainService.enrollments.list(filters);
      return data;
    },
    placeholderData: (previousData: PagedResponse<Enrollment> | undefined) => previousData,
  });

  const studentsQuery = useQuery<PagedResponse<Student>>({
    queryKey: ['enrollment-students'],
    queryFn: async () => {
      const { data } = await domainService.students.list({ itemsPerPage: 200 } as StudentFilters);
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const coursesQuery = useQuery<PagedResponse<Course>>({
    queryKey: ['enrollment-courses'],
    queryFn: async () => {
      const { data } = await domainService.courses.list({ itemsPerPage: 200 } as CourseFilters);
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const lecturersQuery = useQuery<PagedResponse<Lecturer>>({
    queryKey: ['enrollment-lecturers'],
    queryFn: async () => {
      const { data } = await domainService.lecturers.list({ itemsPerPage: 200 });
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const enrollments = useMemo(() => enrollmentsQuery.data?.data ?? [], [enrollmentsQuery.data]);
  const page = enrollmentsQuery.data?.page;
  const students = studentsQuery.data?.data ?? [];
  const courses = coursesQuery.data?.data ?? [];
  const lecturers = lecturersQuery.data?.data ?? [];

  const handleFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
  };

  const invalidateEnrollments = () => {
    queryClient.invalidateQueries({ queryKey: [queryKey] }).catch((error) => {
      console.error('Failed to invalidate enrollments cache', error);
    });
  };

  const createEnrollment = useMutation({
    mutationFn: async (payload: EnrollmentInput) => {
      const { data } = await domainService.enrollments.create(normalizePayload(payload));
      return data;
    },
    onSuccess: (response) => {
      handleFeedback('success', response?.response.message ?? 'Enrollment created successfully');
      setIsCreateOpen(false);
      setFormState(DEFAULT_FORM);
      invalidateEnrollments();
    },
    onError: (error) => {
      handleFeedback('error', getErrorMessage(error, 'Failed to create enrollment'));
    },
  });

  const deactivateEnrollment = useMutation({
    mutationFn: async (id: number) => {
      const { data } = await domainService.enrollments.deactivate(id);
      return data;
    },
    onSuccess: (response) => {
      handleFeedback('success', response?.response.message ?? 'Enrollment withdrawn');
      invalidateEnrollments();
    },
    onError: (error) => {
      handleFeedback('error', getErrorMessage(error, 'Failed to deactivate enrollment'));
    },
  });

  const handleOpenCreate = () => {
    setFormState(DEFAULT_FORM);
    setIsCreateOpen(true);
  };

  const handleSubmitCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createEnrollment.mutate(formState);
  };

  const handlePageChange = (pageNumber: number) => {
    setFilters((prev) => ({ ...prev, pageNumber }));
  };

  const isLoading = enrollmentsQuery.isLoading || enrollmentsQuery.isFetching;
  const hasError = enrollmentsQuery.isError;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Enrollments</h1>
          <p className="text-sm text-gray-500">Track student enrolments, semesters, and associated lecturers.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => enrollmentsQuery.refetch()} disabled={isLoading}>
            Refresh
          </Button>
          <Button onClick={handleOpenCreate}>Add Enrollment</Button>
        </div>
      </header>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <form
          className="grid gap-4 md:grid-cols-5"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const studentId = form.get('studentId') as string;
            const courseId = form.get('courseId') as string;
            const lecturerId = form.get('lecturerId') as string;
            const semester = (form.get('semester') as string) || undefined;
            const academicYear = (form.get('academicYear') as string) || undefined;

            setFilters((prev) => ({
              ...prev,
              pageNumber: 1,
              studentId: studentId ? Number(studentId) : undefined,
              courseId: courseId ? Number(courseId) : undefined,
              lecturerId: lecturerId ? Number(lecturerId) : undefined,
              semester,
              academicYear,
            }));
          }}
        >
          <select
            name="studentId"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            defaultValue=""
          >
            <option value="">All students</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.studentId} • {student.username}
              </option>
            ))}
          </select>
          <select
            name="courseId"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            defaultValue=""
          >
            <option value="">All courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.courseCode} • {course.courseName}
              </option>
            ))}
          </select>
          <select
            name="lecturerId"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            defaultValue=""
          >
            <option value="">All lecturers</option>
            {lecturers.map((lecturer) => (
              <option key={lecturer.id} value={lecturer.id}>
                {lecturer.username}
              </option>
            ))}
          </select>
          <Input name="semester" placeholder="Semester" />
          <Input name="academicYear" placeholder="Academic year" />
          <div className="flex items-center gap-2 md:col-span-5">
            <Button type="submit" className="w-full md:w-auto">
              Apply filters
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full md:w-auto"
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
            title="Failed to load enrollments"
            description="Please refresh the page or adjust your filters."
            actionLabel="Try again"
            onAction={() => enrollmentsQuery.refetch()}
          />
        ) : isLoading ? (
          <Spinner label="Fetching enrollments..." />
        ) : enrollments.length === 0 ? (
          <EmptyState
            title="No enrollments found"
            description="Try adjusting your filters or add a new enrollment."
            actionLabel="Add enrollment"
            onAction={handleOpenCreate}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Lecturer</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((enrollment: Enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{enrollment.studentNumber}</span>
                        <span className="text-xs text-gray-500">{enrollment.studentName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{enrollment.courseCode}</span>
                        <span className="text-xs text-gray-500">{enrollment.courseName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{enrollment.semester}</TableCell>
                    <TableCell>{enrollment.academicYear}</TableCell>
                    <TableCell>{enrollment.lecturerName ?? '—'}</TableCell>
                    <TableCell>{formatDate(enrollment.createdDate)}</TableCell>
                    <TableCell>
                      <Badge variant={enrollment.isActive ? 'success' : 'warning'}>
                        {enrollment.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deactivateEnrollment.mutate(enrollment.id)}
                        disabled={deactivateEnrollment.isPending}
                      >
                        Withdraw
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
        title="Add Enrollment"
        description="Enroll a student into a course for a specific semester."
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button form="create-enrollment-form" type="submit" disabled={createEnrollment.isPending}>
              {createEnrollment.isPending ? 'Creating...' : 'Create enrollment'}
            </Button>
          </>
        }
      >
        <EnrollmentForm
          formState={formState}
          setFormState={setFormState}
          students={students}
          courses={courses}
          lecturers={lecturers}
        />
        <form id="create-enrollment-form" onSubmit={handleSubmitCreate} className="hidden" />
      </Modal>
    </div>
  );
}

interface EnrollmentFormProps {
  formState: EnrollmentInput;
  setFormState: Dispatch<SetStateAction<EnrollmentInput>>;
  students: Student[];
  courses: Course[];
  lecturers: Lecturer[];
}

function EnrollmentForm({ formState, setFormState, students, courses, lecturers }: EnrollmentFormProps) {
  const handleChange = (field: keyof EnrollmentInput) => (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const rawValue = event.target.value;
    const isNumberField = event.target.type === 'number' || event.target.tagName === 'SELECT';
    const value = isNumberField ? (rawValue ? Number(rawValue) : undefined) : rawValue;

    setFormState((prev) => ({
      ...prev,
      [field]: value as never,
    }));
  };

  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700" htmlFor="enrollment-student">
          Student
        </label>
        <select
          id="enrollment-student"
          value={formState.studentId || ''}
          onChange={handleChange('studentId')}
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <option value="">Select student</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.studentId} • {student.username}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700" htmlFor="enrollment-course">
          Course
        </label>
        <select
          id="enrollment-course"
          value={formState.courseId || ''}
          onChange={handleChange('courseId')}
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <option value="">Select course</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.courseCode} • {course.courseName}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700" htmlFor="enrollment-semester">
          Semester
        </label>
        <Input
          id="enrollment-semester"
          value={formState.semester}
          onChange={handleChange('semester')}
          required
          placeholder="e.g. Fall 2024"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700" htmlFor="enrollment-academicYear">
          Academic Year
        </label>
        <Input
          id="enrollment-academicYear"
          value={formState.academicYear}
          onChange={handleChange('academicYear')}
          required
          placeholder="e.g. 2024/2025"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700" htmlFor="enrollment-lecturer">
          Lecturer (optional)
        </label>
        <select
          id="enrollment-lecturer"
          value={formState.lecturerId ?? ''}
          onChange={handleChange('lecturerId')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <option value="">Unassigned</option>
          {lecturers.map((lecturer) => (
            <option key={lecturer.id} value={lecturer.id}>
              {lecturer.username}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function normalizePayload(payload: EnrollmentInput): EnrollmentInput {
  return {
    ...payload,
    studentId: Number(payload.studentId),
    courseId: Number(payload.courseId),
    lecturerId: payload.lecturerId ? Number(payload.lecturerId) : undefined,
    semester: payload.semester,
    academicYear: payload.academicYear,
  };
}
