import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { domainService } from '../../services/api/domainService';
import { useCurrentLecturer } from '../../hooks/useCurrentProfiles';
import type { Course, CourseFilters, PagedResponse } from '../../types';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const QUERY_KEY = 'lecturer-courses';

export function LecturerCourses() {
  const [filters, setFilters] = useState<CourseFilters>({ pageNumber: 1, itemsPerPage: 10 });
  const { lecturer, query: lecturerQuery } = useCurrentLecturer();

  const coursesQuery = useQuery<PagedResponse<Course>>({
    queryKey: [QUERY_KEY, lecturer?.id, filters],
    enabled: Boolean(lecturer?.id),
    queryFn: async () => {
      const { data } = await domainService.courses.list({
        ...filters,
        assignedLecturerId: lecturer?.id ?? undefined,
      });
      return data;
    },
    placeholderData: (previous) => previous,
  });

  const courses = useMemo(() => coursesQuery.data?.data ?? [], [coursesQuery.data]);
  const pagination = coursesQuery.data?.page;

  const handleFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const department = (formData.get('department') as string) || undefined;
    const searchTerm = (formData.get('searchTerm') as string) || undefined;

    setFilters((prev) => ({
      ...prev,
      pageNumber: 1,
      department,
      searchTerm,
    }));
  };

  const resetFilters = (form: HTMLFormElement | null) => {
    form?.reset();
    setFilters({ pageNumber: 1, itemsPerPage: filters.itemsPerPage });
  };

  if (lecturerQuery.isLoading) {
    return <Spinner label="Loading your courses..." />;
  }

  if (lecturerQuery.isError) {
    return (
      <EmptyState
        title="Unable to load lecturer profile"
        description="We couldn\'t resolve your lecturer record. Please try again later."
      />
    );
  }

  if (!lecturer) {
    return (
      <EmptyState
        title="No lecturer profile found"
        description="Contact an administrator to associate your account with a lecturer record."
      />
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">My Courses</h1>
        <p className="text-sm text-gray-500">Review the courses you are assigned to teach.</p>
      </header>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <form className="grid gap-4 md:grid-cols-3" onSubmit={handleFilters}>
          <Input name="department" placeholder="Department" />
          <Input name="searchTerm" placeholder="Search by code or name" />
          <div className="flex items-center gap-2 md:col-span-1">
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
        {coursesQuery.isError ? (
          <EmptyState
            title="Failed to load courses"
            description="Try refreshing the page or adjusting your filters."
            actionLabel="Try again"
            onAction={() => coursesQuery.refetch()}
          />
        ) : coursesQuery.isFetching ? (
          <Spinner label="Loading courses..." />
        ) : courses.length === 0 ? (
          <EmptyState
            title="No courses assigned"
            description="You are not currently assigned to any courses."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course Code</TableHead>
                  <TableHead>Course Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>{course.courseCode}</TableCell>
                    <TableCell>{course.courseName}</TableCell>
                    <TableCell>{course.department}</TableCell>
                    <TableCell>{course.credits}</TableCell>
                    <TableCell>
                      <div className="max-w-md truncate" title={course.description ?? undefined}>
                        {course.description ?? '—'}
                      </div>
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
            isLoading={coursesQuery.isFetching}
          />
        </div>
      </section>
    </div>
  );
}
