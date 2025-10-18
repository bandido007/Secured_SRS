import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { domainService } from '../../services/api/domainService';
import { useCurrentStudent } from '../../hooks/useCurrentProfiles';
import type { CourseResult, CourseResultFilters, PagedResponse } from '../../types';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { formatDateTime } from '../../utils/format';

const QUERY_KEY = 'student-grades';

export function StudentGrades() {
  const [filters, setFilters] = useState<CourseResultFilters>({ pageNumber: 1, itemsPerPage: 10 });
  const { student, query: studentQuery } = useCurrentStudent();

  const gradesQuery = useQuery<PagedResponse<CourseResult>>({
    queryKey: [QUERY_KEY, student?.id, filters],
    enabled: Boolean(student?.id),
    queryFn: async () => {
      if (!student?.id) {
        return { data: [], response: { id: 0, status: true, message: 'No student', code: 200 } } as PagedResponse<CourseResult>;
      }
      const { data } = await domainService.students.grades(student.id, filters);
      return data;
    },
    placeholderData: (previous) => previous,
  });

  const grades = useMemo(() => gradesQuery.data?.data ?? [], [gradesQuery.data]);
  const pagination = gradesQuery.data?.page;

  const handleFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const semester = (formData.get('semester') as string) || undefined;
    const academicYear = (formData.get('academicYear') as string) || undefined;
    const status = (formData.get('status') as string) || undefined;

    setFilters((prev) => ({
      ...prev,
      pageNumber: 1,
      semester,
      academicYear,
      status: status ? (status as CourseResultFilters['status']) : undefined,
    }));
  };

  const resetFilters = (form: HTMLFormElement | null) => {
    form?.reset();
    setFilters({ pageNumber: 1, itemsPerPage: filters.itemsPerPage });
  };

  if (studentQuery.isLoading) {
    return <Spinner label="Loading your grades..." />;
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
        <h1 className="text-2xl font-semibold text-gray-900">My Grades</h1>
        <p className="text-sm text-gray-500">Track the status of your course results.</p>
      </header>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <form className="grid gap-4 md:grid-cols-4" onSubmit={handleFilters}>
          <Input name="semester" placeholder="Semester" />
          <Input name="academicYear" placeholder="Academic year" />
          <select
            name="status"
            defaultValue=""
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="OFFICIAL">Official</option>
            <option value="DISPUTED">Disputed</option>
          </select>
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
        {gradesQuery.isError ? (
          <EmptyState
            title="Failed to load grades"
            description="Try refreshing the page."
            actionLabel="Try again"
            onAction={() => gradesQuery.refetch()}
          />
        ) : gradesQuery.isFetching ? (
          <Spinner label="Loading grades..." />
        ) : grades.length === 0 ? (
          <EmptyState
            title="No grades yet"
            description="Once lecturers submit grades they will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Verified</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grades.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">{result.courseCode}</span>
                        <span className="text-xs text-gray-500">{result.courseName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{result.semester}</span>
                        <span className="text-xs text-gray-500">{result.academicYear}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {result.gradeType === 'NUMERIC'
                        ? result.numericGrade ?? '—'
                        : result.gradeType === 'LETTER'
                        ? result.letterGrade ?? '—'
                        : result.status === 'OFFICIAL'
                        ? 'Pass'
                        : 'Pending'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          result.status === 'OFFICIAL'
                            ? 'success'
                            : result.status === 'PENDING'
                            ? 'secondary'
                            : 'warning'
                        }
                      >
                        {result.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(result.submittedAt)}</TableCell>
                    <TableCell>
                      {result.isVerified ? (
                        <span className="text-sm text-green-600">{formatDateTime(result.verifiedAt)}</span>
                      ) : (
                        <span className="text-sm text-gray-500">Awaiting</span>
                      )}
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
            isLoading={gradesQuery.isFetching}
          />
        </div>
      </section>
    </div>
  );
}
