import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { domainService } from '../../services/api/domainService';
import { useCurrentLecturer } from '../../hooks/useCurrentProfiles';
import type { CourseResult, CourseResultFilters, PagedResponse } from '../../types';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { getErrorMessage } from '../../utils/error';
import { formatDateTime } from '../../utils/format';

const QUERY_KEY = 'lecturer-verification-grades';

export function LecturerVerification() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<CourseResultFilters>({ pageNumber: 1, itemsPerPage: 10 });
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const { lecturer, query: lecturerQuery } = useCurrentLecturer();

  useEffect(() => {
    if (!feedback) {
      return;
    }
    const timeout = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const courseResultsQuery = useQuery<PagedResponse<CourseResult>>({
    queryKey: [QUERY_KEY, lecturer?.id, filters],
    enabled: Boolean(lecturer?.id),
    queryFn: async () => {
      const { data } = await domainService.courseResults.list({
        ...filters,
        submittedById: lecturer?.id ?? undefined,
      });
      return data;
    },
    placeholderData: (previous) => previous,
  });

  const results = useMemo(() => courseResultsQuery.data?.data ?? [], [courseResultsQuery.data]);
  const pagination = courseResultsQuery.data?.page;

  const verifyMutation = useMutation({
    mutationFn: async (gradeId: number) => {
      const { data } = await domainService.courseResults.verify(gradeId);
      return data;
    },
    onSuccess: (data) => {
      setFeedback({ type: 'success', message: data?.response.message ?? 'Grade verified successfully' });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }).catch((error) => {
        console.error('Failed to refresh verification list', error);
      });
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: getErrorMessage(error, 'Failed to verify grade') });
    },
  });

  const handleFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const status = (formData.get('status') as string) || undefined;
    const isVerifiedRaw = (formData.get('isVerified') as string) || undefined;

    setFilters((prev) => ({
      ...prev,
      pageNumber: 1,
      status: status ? (status as CourseResultFilters['status']) : undefined,
      isVerified:
        isVerifiedRaw === 'all' ? undefined : isVerifiedRaw === undefined ? prev.isVerified : isVerifiedRaw === 'true',
    }));
  };

  const resetFilters = (form: HTMLFormElement | null) => {
    form?.reset();
    setFilters({ pageNumber: 1, itemsPerPage: filters.itemsPerPage });
  };

  if (lecturerQuery.isLoading) {
    return <Spinner label="Loading verification queue..." />;
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
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-gray-900">Verification Queue</h1>
        <p className="text-sm text-gray-500">Confirm blockchain proofs and track the status of your submitted grades.</p>
      </header>

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

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <form className="grid gap-4 md:grid-cols-3" onSubmit={handleFilters}>
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
          <select
            name="isVerified"
            defaultValue="all"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <option value="all">All verification states</option>
            <option value="false">Awaiting verification</option>
            <option value="true">Verified</option>
          </select>
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
        {courseResultsQuery.isError ? (
          <EmptyState
            title="Failed to load verification queue"
            description="Try refreshing the page."
            actionLabel="Try again"
            onAction={() => courseResultsQuery.refetch()}
          />
        ) : courseResultsQuery.isFetching ? (
          <Spinner label="Checking grade proofs..." />
        ) : results.length === 0 ? (
          <EmptyState
            title="No grades to verify"
            description="Your submitted grades will appear here for verification."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Blockchain Hash</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">{result.studentNumber}</span>
                        <span className="text-xs text-gray-500">{result.studentName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">{result.courseCode}</span>
                        <span className="text-xs text-gray-500">{result.courseName}</span>
                      </div>
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
                    <TableCell>
                      <div className="max-w-xs truncate" title={result.blockchainHash ?? undefined}>
                        {result.blockchainHash ?? '—'}
                      </div>
                    </TableCell>
                    <TableCell>{formatDateTime(result.submittedAt)}</TableCell>
                    <TableCell>
                      {result.isVerified ? (
                        <span className="text-sm text-green-600">{formatDateTime(result.verifiedAt)}</span>
                      ) : (
                        <span className="text-sm text-gray-500">Awaiting</span>
                      )}
                    </TableCell>
                    <TableCell className="flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => verifyMutation.mutate(result.id)}
                        disabled={verifyMutation.isPending || result.isVerified}
                      >
                        {result.isVerified ? 'Verified' : 'Verify'}
                      </Button>
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
            isLoading={courseResultsQuery.isFetching}
          />
        </div>
      </section>
    </div>
  );
}
