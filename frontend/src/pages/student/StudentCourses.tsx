import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { domainService } from '../../services/api/domainService';
import { useCurrentStudent } from '../../hooks/useCurrentProfiles';
import type { Enrollment, EnrollmentFilters, PagedResponse } from '../../types';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { formatDate } from '../../utils/format';

const QUERY_KEY = 'student-courses';

export function StudentCourses() {
  const [filters, setFilters] = useState<EnrollmentFilters>({ pageNumber: 1, itemsPerPage: 10 });
  const { student, query: studentQuery } = useCurrentStudent();

  const enrollmentsQuery = useQuery<PagedResponse<Enrollment>>({
    queryKey: [QUERY_KEY, student?.id, filters],
    enabled: Boolean(student?.id),
    queryFn: async () => {
      const { data } = await domainService.enrollments.list({
        ...filters,
        studentId: student?.id ?? undefined,
      });
      return data;
    },
    placeholderData: (previous) => previous,
  });

  const enrollments = useMemo(() => enrollmentsQuery.data?.data ?? [], [enrollmentsQuery.data]);
  const pagination = enrollmentsQuery.data?.page;

  const handleFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const semester = (formData.get('semester') as string) || undefined;
    const academicYear = (formData.get('academicYear') as string) || undefined;

    setFilters((prev) => ({
      ...prev,
      pageNumber: 1,
      semester,
      academicYear,
    }));
  };

  const resetFilters = (form: HTMLFormElement | null) => {
    form?.reset();
    setFilters({ pageNumber: 1, itemsPerPage: filters.itemsPerPage });
  };

  if (studentQuery.isLoading) {
    return <Spinner label="Loading your enrollments..." />;
  }

  if (studentQuery.isError) {
    return (
      <EmptyState
        title="Unable to load student profile"
        description="We couldn\'t resolve your student record. Please try again later."
      />
    );
  }

  if (!student) {
    return (
      <EmptyState
        title="No student profile found"
        description="Contact support to ensure your account is linked to a student record."
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-gray-900">My Courses</h1>
        <p className="text-sm text-gray-500">View the courses you are currently enrolled in.</p>
      </header>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <form className="grid gap-4 md:grid-cols-3" onSubmit={handleFilters}>
          <Input name="semester" placeholder="Semester" />
          <Input name="academicYear" placeholder="Academic year" />
          <div className="flex items-center gap-2">
            <Button type="submit" className="w-full md:w-auto">
              Apply filters
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full md:w-auto"
              onClick={(event) => resetFilters(event.currentTarget.form)}
            >
              Reset
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {enrollmentsQuery.isError ? (
          <EmptyState
            title="Failed to load courses"
            description="Try refreshing the page."
            actionLabel="Try again"
            onAction={() => enrollmentsQuery.refetch()}
          />
        ) : enrollmentsQuery.isFetching ? (
          <Spinner label="Loading courses..." />
        ) : enrollments.length === 0 ? (
          <EmptyState
            title="No active enrollments"
            description="You are not enrolled in any courses right now."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Lecturer</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">{enrollment.courseCode}</span>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="px-4">
          <Pagination
            page={pagination}
            onPageChange={(pageNumber) => setFilters((prev) => ({ ...prev, pageNumber }))}
            isLoading={enrollmentsQuery.isFetching}
          />
        </div>
      </section>
    </div>
  );
}
