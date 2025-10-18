import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, Dispatch, FormEvent, SetStateAction } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { domainService } from '../../services/api/domainService';
import type {
  Course,
  CourseFilters,
  CourseInput,
  Lecturer,
  LecturerFilters,
  PagedResponse,
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

const DEFAULT_FORM: CourseInput = {
  courseCode: '',
  courseName: '',
  credits: 3,
  department: '',
  assignedLecturerId: undefined,
  description: '',
};

const queryKey = 'courses';

export function AdminCourses() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<CourseFilters>({ pageNumber: 1, itemsPerPage: 10 });
  const [formState, setFormState] = useState<CourseInput>(DEFAULT_FORM);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!feedback) {
      return;
    }
    const timeout = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const coursesQuery = useQuery<PagedResponse<Course>>({
    queryKey: [queryKey, filters],
    queryFn: async () => {
      const { data } = await domainService.courses.list(filters);
      return data;
    },
    placeholderData: (previousData: PagedResponse<Course> | undefined) => previousData,
  });

  const lecturersQuery = useQuery<PagedResponse<Lecturer>>({
    queryKey: ['course-lecturers'],
    queryFn: async () => {
      const { data } = await domainService.lecturers.list({ itemsPerPage: 100 } as LecturerFilters);
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const lecturers = lecturersQuery.data?.data ?? [];
  const courses = useMemo(() => coursesQuery.data?.data ?? [], [coursesQuery.data]);
  const page = coursesQuery.data?.page;

  const handleFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
  };

  const invalidateCourses = () => {
    queryClient.invalidateQueries({ queryKey: [queryKey] }).catch((error) => {
      console.error('Failed to invalidate courses cache', error);
    });
  };

  const createCourse = useMutation({
    mutationFn: async (payload: CourseInput) => {
      const { data } = await domainService.courses.create(normalizePayload(payload));
      return data;
    },
    onSuccess: (response) => {
      handleFeedback('success', response?.response.message ?? 'Course created successfully');
      setIsCreateOpen(false);
      setFormState(DEFAULT_FORM);
      invalidateCourses();
    },
    onError: (error) => {
      handleFeedback('error', getErrorMessage(error, 'Failed to create course'));
    },
  });

  const updateCourse = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: CourseInput }) => {
      const { data } = await domainService.courses.update(id, normalizePayload(payload));
      return data;
    },
    onSuccess: (response) => {
      handleFeedback('success', response?.response.message ?? 'Course updated successfully');
      setIsEditOpen(false);
      setSelectedCourse(null);
      invalidateCourses();
    },
    onError: (error) => {
      handleFeedback('error', getErrorMessage(error, 'Failed to update course'));
    },
  });

  const deactivateCourse = useMutation({
    mutationFn: async (id: number) => {
      const { data } = await domainService.courses.deactivate(id);
      return data;
    },
    onSuccess: (response) => {
      handleFeedback('success', response?.response.message ?? 'Course deactivated');
      invalidateCourses();
    },
    onError: (error) => {
      handleFeedback('error', getErrorMessage(error, 'Failed to deactivate course'));
    },
  });

  const handleOpenCreate = () => {
    setFormState(DEFAULT_FORM);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (course: Course) => {
    setSelectedCourse(course);
    setFormState(mapCourseToForm(course));
    setIsEditOpen(true);
  };

  const handleSubmitCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createCourse.mutate(formState);
  };

  const handleSubmitEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCourse) {
      return;
    }
    updateCourse.mutate({ id: selectedCourse.id, payload: formState });
  };

  const handlePageChange = (pageNumber: number) => {
    setFilters((prev) => ({ ...prev, pageNumber }));
  };

  const isLoading = coursesQuery.isLoading || coursesQuery.isFetching;
  const hasError = coursesQuery.isError;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Courses</h1>
          <p className="text-sm text-gray-500">Manage course catalog, lecturers assigned, and credit allocations.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => coursesQuery.refetch()} disabled={isLoading}>
            Refresh
          </Button>
          <Button onClick={handleOpenCreate}>Add Course</Button>
        </div>
      </header>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <form
          className="grid gap-4 md:grid-cols-4"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const department = (form.get('department') as string) || undefined;
            const minCredits = form.get('minCredits') as string;
            const maxCredits = form.get('maxCredits') as string;
            const lecturerId = form.get('assignedLecturerId') as string;

            setFilters((prev) => ({
              ...prev,
              pageNumber: 1,
              department,
              minCredits: minCredits ? Number(minCredits) : undefined,
              maxCredits: maxCredits ? Number(maxCredits) : undefined,
              assignedLecturerId: lecturerId ? Number(lecturerId) : undefined,
            }));
          }}
        >
          <Input name="department" placeholder="Filter by department" />
          <Input name="minCredits" type="number" min={0} step={0.5} placeholder="Min credits" />
          <Input name="maxCredits" type="number" min={0} step={0.5} placeholder="Max credits" />
          <select
            name="assignedLecturerId"
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
          <div className="flex items-center gap-2 md:col-span-4">
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
            title="Failed to load courses"
            description="Please refresh the page or adjust your filters."
            actionLabel="Try again"
            onAction={() => coursesQuery.refetch()}
          />
        ) : isLoading ? (
          <Spinner label="Fetching courses..." />
        ) : courses.length === 0 ? (
          <EmptyState
            title="No courses found"
            description="Try adjusting your filters or add a new course."
            actionLabel="Add course"
            onAction={handleOpenCreate}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course Code</TableHead>
                  <TableHead>Course Name</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Lecturer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course: Course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.courseCode}</TableCell>
                    <TableCell>{course.courseName}</TableCell>
                    <TableCell>{course.credits}</TableCell>
                    <TableCell>{course.department}</TableCell>
                    <TableCell>{course.lecturerName ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={course.isActive ? 'success' : 'warning'}>
                        {course.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenEdit(course)}>
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deactivateCourse.mutate(course.id)}
                        disabled={deactivateCourse.isPending}
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
        title="Add Course"
        description="Create a new course and optionally assign a lecturer."
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button form="create-course-form" type="submit" disabled={createCourse.isPending}>
              {createCourse.isPending ? 'Creating...' : 'Create course'}
            </Button>
          </>
        }
      >
        <CourseForm formState={formState} setFormState={setFormState} lecturers={lecturers} />
        <form id="create-course-form" onSubmit={handleSubmitCreate} className="hidden" />
      </Modal>

      <Modal
        title="Edit Course"
        description="Update course details and lecturer assignment."
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedCourse(null);
        }}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditOpen(false);
                setSelectedCourse(null);
              }}
            >
              Cancel
            </Button>
            <Button form="edit-course-form" type="submit" disabled={updateCourse.isPending}>
              {updateCourse.isPending ? 'Saving...' : 'Save changes'}
            </Button>
          </>
        }
      >
        <CourseForm formState={formState} setFormState={setFormState} lecturers={lecturers} isEditing />
        <form id="edit-course-form" onSubmit={handleSubmitEdit} className="hidden" />
      </Modal>
    </div>
  );
}

interface CourseFormProps {
  formState: CourseInput;
  setFormState: Dispatch<SetStateAction<CourseInput>>;
  lecturers: Lecturer[];
  isEditing?: boolean;
}

function CourseForm({ formState, setFormState, lecturers, isEditing = false }: CourseFormProps) {
  const handleChange = (field: keyof CourseInput) => (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
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
        <label className="text-sm font-medium text-gray-700" htmlFor="course-code">
          Course Code
        </label>
        <Input
          id="course-code"
          value={formState.courseCode}
          onChange={handleChange('courseCode')}
          required
          disabled={isEditing}
          placeholder="e.g. CS101"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700" htmlFor="course-name">
          Course Name
        </label>
        <Input
          id="course-name"
          value={formState.courseName}
          onChange={handleChange('courseName')}
          required
          placeholder="e.g. Introduction to Programming"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700" htmlFor="course-credits">
          Credits
        </label>
        <Input
          id="course-credits"
          type="number"
          min={0}
          step={0.5}
          value={formState.credits ?? ''}
          onChange={handleChange('credits')}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700" htmlFor="course-department">
          Department
        </label>
        <Input
          id="course-department"
          value={formState.department}
          onChange={handleChange('department')}
          required
          placeholder="e.g. School of Computing"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700" htmlFor="course-lecturer">
          Assigned Lecturer
        </label>
        <select
          id="course-lecturer"
          value={formState.assignedLecturerId ?? ''}
          onChange={handleChange('assignedLecturerId')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <option value="">Unassigned</option>
          {lecturers.map((lecturer) => (
            <option key={lecturer.id} value={lecturer.id}>
              {lecturer.username} ({lecturer.department})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2 md:col-span-2">
        <label className="text-sm font-medium text-gray-700" htmlFor="course-description">
          Description
        </label>
        <textarea
          id="course-description"
          value={formState.description ?? ''}
          onChange={handleChange('description')}
          rows={4}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          placeholder="Optional course description"
        />
      </div>
    </div>
  );
}

function mapCourseToForm(course: Course): CourseInput {
  return {
    courseCode: course.courseCode,
    courseName: course.courseName,
    credits: Number(course.credits),
    department: course.department,
    assignedLecturerId: course.assignedLecturerId ?? undefined,
    description: course.description ?? '',
  };
}

function normalizePayload(payload: CourseInput): CourseInput {
  return {
    ...payload,
    credits: Number(payload.credits),
    assignedLecturerId:
      payload.assignedLecturerId && payload.assignedLecturerId > 0
        ? Number(payload.assignedLecturerId)
        : undefined,
    description: payload.description || undefined,
  };
}
