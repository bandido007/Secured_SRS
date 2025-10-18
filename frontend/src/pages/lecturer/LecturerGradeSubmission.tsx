import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { domainService } from '../../services/api/domainService';
import { useCurrentLecturer } from '../../hooks/useCurrentProfiles';
import type {
  CourseResult,
  CourseResultFilters,
  CourseResultInput,
  Enrollment,
  EnrollmentFilters,
  PagedResponse,
} from '../../types';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { getErrorMessage } from '../../utils/error';
import { formatDateTime } from '../../utils/format';

const ENROLLMENTS_QUERY_KEY = 'lecturer-enrollments';
const RESULTS_QUERY_KEY = 'lecturer-results';

const GRADE_TYPE_OPTIONS: CourseResultInput['gradeType'][] = ['NUMERIC', 'LETTER', 'PASS_FAIL'];

interface GradeFormState {
  gradeType: CourseResultInput['gradeType'];
  numericGrade: string;
  letterGrade: string;
  courseWorkGrade: string;
  examGrade: string;
  remarks: string;
  comments: string;
}

const DEFAULT_GRADE_FORM: GradeFormState = {
  gradeType: 'NUMERIC',
  numericGrade: '',
  letterGrade: '',
  courseWorkGrade: '',
  examGrade: '',
  remarks: '',
  comments: '',
};

export function LecturerGradeSubmission() {
  const queryClient = useQueryClient();
  const [enrollmentFilters, setEnrollmentFilters] = useState<EnrollmentFilters>({ pageNumber: 1, itemsPerPage: 10 });
  const [resultFilters, setResultFilters] = useState<CourseResultFilters>({ pageNumber: 1, itemsPerPage: 10 });
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [gradeForm, setGradeForm] = useState<GradeFormState>(DEFAULT_GRADE_FORM);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);

  const { lecturer, query: lecturerQuery } = useCurrentLecturer();

  const enrollmentsQuery = useQuery<PagedResponse<Enrollment>>({
    queryKey: [ENROLLMENTS_QUERY_KEY, lecturer?.id, enrollmentFilters],
    enabled: Boolean(lecturer?.id),
    queryFn: async () => {
      const { data } = await domainService.enrollments.list({
        ...enrollmentFilters,
        lecturerId: lecturer?.id ?? undefined,
      });
      return data;
    },
    placeholderData: (previous) => previous,
  });

  const courseResultsQuery = useQuery<PagedResponse<CourseResult>>({
    queryKey: [RESULTS_QUERY_KEY, lecturer?.id, resultFilters],
    enabled: Boolean(lecturer?.id),
    queryFn: async () => {
      const { data } = await domainService.courseResults.list({
        ...resultFilters,
        submittedById: lecturer?.id ?? undefined,
      });
      return data;
    },
    placeholderData: (previous) => previous,
  });

  const enrollments = useMemo(() => enrollmentsQuery.data?.data ?? [], [enrollmentsQuery.data]);
  const results = useMemo(() => courseResultsQuery.data?.data ?? [], [courseResultsQuery.data]);

  useEffect(() => {
    if (!feedback) {
      return;
    }
    const timeout = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const resetFormState = () => {
    setGradeForm(DEFAULT_GRADE_FORM);
    setSelectedEnrollment(null);
  };

  const submitGrade = useMutation({
    mutationFn: async () => {
      if (!selectedEnrollment) {
        throw new Error('Select an enrollment to submit a grade.');
      }

      const payload: CourseResultInput = {
        enrollmentId: selectedEnrollment.id,
        gradeType: gradeForm.gradeType,
        numericGrade:
          gradeForm.gradeType === 'NUMERIC' && gradeForm.numericGrade
            ? Number(gradeForm.numericGrade)
            : undefined,
        letterGrade: gradeForm.gradeType === 'LETTER' ? gradeForm.letterGrade || undefined : undefined,
        courseWorkGrade: gradeForm.courseWorkGrade ? Number(gradeForm.courseWorkGrade) : undefined,
        examGrade: gradeForm.examGrade ? Number(gradeForm.examGrade) : undefined,
        remarks: gradeForm.remarks || undefined,
        comments: gradeForm.comments || undefined,
      };

      const { data } = await domainService.courseResults.submit(payload);
      return data;
    },
    onSuccess: (data) => {
      setFeedback({ type: 'success', message: data?.response.message ?? 'Grade submitted successfully' });
      setIsModalOpen(false);
      resetFormState();
      queryClient.invalidateQueries({ queryKey: [RESULTS_QUERY_KEY] }).catch((error) => {
        console.error('Failed to refresh lecturer results', error);
      });
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: getErrorMessage(error, 'Failed to submit grade') });
    },
  });

  const openGradeModal = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setGradeForm(DEFAULT_GRADE_FORM);
    setIsModalOpen(true);
  };

  const handleEnrollmentFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const semester = (formData.get('semester') as string) || undefined;
    const academicYear = (formData.get('academicYear') as string) || undefined;

    setEnrollmentFilters((prev) => ({
      ...prev,
      pageNumber: 1,
      semester,
      academicYear,
    }));
  };

  const handleResultFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const status = (formData.get('status') as string) || undefined;

    setResultFilters((prev) => ({
      ...prev,
      pageNumber: 1,
      status: status ? (status as CourseResultFilters['status']) : undefined,
    }));
  };

  const resetEnrollmentFilters = (form: HTMLFormElement | null) => {
    form?.reset();
    setEnrollmentFilters({ pageNumber: 1, itemsPerPage: enrollmentFilters.itemsPerPage });
  };

  const resetResultFilters = (form: HTMLFormElement | null) => {
    form?.reset();
    setResultFilters({ pageNumber: 1, itemsPerPage: resultFilters.itemsPerPage });
  };

  if (lecturerQuery.isLoading) {
    return <Spinner label="Loading lecturer information..." />;
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
        <h1 className="text-2xl font-semibold text-gray-900">Grade Management</h1>
        <p className="text-sm text-gray-500">Submit course results and track verification progress.</p>
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

      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Active Enrollments</h2>
          <Button variant="outline" onClick={() => enrollmentsQuery.refetch()} disabled={enrollmentsQuery.isFetching}>
            Refresh
          </Button>
        </div>
        <form className="grid gap-4 md:grid-cols-3" onSubmit={handleEnrollmentFilters}>
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
              onClick={(event) => resetEnrollmentFilters(event.currentTarget.form)}
            >
              Reset
            </Button>
          </div>
        </form>
        <div className="rounded-lg border border-gray-100">
          {enrollmentsQuery.isError ? (
            <EmptyState
              title="Failed to load enrollments"
              description="Try refreshing the page."
              actionLabel="Try again"
              onAction={() => enrollmentsQuery.refetch()}
            />
          ) : enrollmentsQuery.isFetching ? (
            <Spinner label="Loading enrollments..." />
          ) : enrollments.length === 0 ? (
            <EmptyState
              title="No enrollments"
              description="You currently have no students assigned to your courses."
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
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">{enrollment.studentNumber}</span>
                          <span className="text-xs text-gray-500">{enrollment.studentName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">{enrollment.courseCode}</span>
                          <span className="text-xs text-gray-500">{enrollment.courseName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{enrollment.semester}</TableCell>
                      <TableCell>{enrollment.academicYear}</TableCell>
                      <TableCell className="flex justify-end">
                        <Button size="sm" onClick={() => openGradeModal(enrollment)}>
                          Record grade
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
        <Pagination
          page={enrollmentsQuery.data?.page}
          onPageChange={(pageNumber) => setEnrollmentFilters((prev) => ({ ...prev, pageNumber }))}
          isLoading={enrollmentsQuery.isFetching}
        />
      </section>

      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Submitted Grades</h2>
          <Button variant="outline" onClick={() => courseResultsQuery.refetch()} disabled={courseResultsQuery.isFetching}>
            Refresh
          </Button>
        </div>
        <form className="grid gap-4 md:grid-cols-3" onSubmit={handleResultFilters}>
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
          <div className="flex items-center gap-2 md:col-span-2">
            <Button type="submit" className="w-full md:w-auto">
              Apply filters
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full md:w-auto"
              onClick={(event) => resetResultFilters(event.currentTarget.form)}
            >
              Reset
            </Button>
          </div>
        </form>
        <div className="rounded-lg border border-gray-100">
          {courseResultsQuery.isError ? (
            <EmptyState
              title="Failed to load submitted grades"
              description="Try refreshing the page."
              actionLabel="Try again"
              onAction={() => courseResultsQuery.refetch()}
            />
          ) : courseResultsQuery.isFetching ? (
            <Spinner label="Loading submitted grades..." />
          ) : results.length === 0 ? (
            <EmptyState
              title="No grades submitted"
              description="Grades you submit will appear here."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
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
                        {result.gradeType === 'NUMERIC'
                          ? result.numericGrade ?? '—'
                          : result.gradeType === 'LETTER'
                          ? result.letterGrade ?? '—'
                          : 'Pass/Fail'}
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
        <Pagination
          page={courseResultsQuery.data?.page}
          onPageChange={(pageNumber) => setResultFilters((prev) => ({ ...prev, pageNumber }))}
          isLoading={courseResultsQuery.isFetching}
        />
      </section>

      <Modal
        title="Submit grade"
        description={selectedEnrollment ? `Record results for ${selectedEnrollment.courseCode}` : 'Select an enrollment to submit a grade.'}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetFormState();
        }}
        footer={
          <>
            <Button variant="outline" onClick={() => {
              setIsModalOpen(false);
              resetFormState();
            }}>
              Cancel
            </Button>
            <Button onClick={() => submitGrade.mutate()} disabled={submitGrade.isPending || !selectedEnrollment}>
              {submitGrade.isPending ? 'Submitting...' : 'Submit grade'}
            </Button>
          </>
        }
      >
        {!selectedEnrollment ? (
          <EmptyState
            title="No enrollment selected"
            description="Choose a student from the table to submit their grade."
          />
        ) : (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="grade-type">
                Grade type
              </label>
              <select
                id="grade-type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                value={gradeForm.gradeType}
                onChange={(event) => {
                  const nextType = event.target.value as CourseResultInput['gradeType'];
                  setGradeForm((prev) => ({
                    ...prev,
                    gradeType: nextType,
                    numericGrade: nextType === 'NUMERIC' ? prev.numericGrade : '',
                    letterGrade: nextType === 'LETTER' ? prev.letterGrade : '',
                  }));
                }}
              >
                {GRADE_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            {gradeForm.gradeType === 'NUMERIC' ? (
              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700" htmlFor="numeric-grade">
                  Numeric grade
                </label>
                <Input
                  id="numeric-grade"
                  type="number"
                  min="0"
                  max="100"
                  value={gradeForm.numericGrade}
                  onChange={(event) => setGradeForm((prev) => ({ ...prev, numericGrade: event.target.value }))}
                  required
                />
              </div>
            ) : null}
            {gradeForm.gradeType === 'LETTER' ? (
              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700" htmlFor="letter-grade">
                  Letter grade
                </label>
                <Input
                  id="letter-grade"
                  value={gradeForm.letterGrade}
                  onChange={(event) => setGradeForm((prev) => ({ ...prev, letterGrade: event.target.value }))}
                  required
                />
              </div>
            ) : null}
            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="coursework-grade">
                Coursework grade (optional)
              </label>
              <Input
                id="coursework-grade"
                type="number"
                min="0"
                max="100"
                value={gradeForm.courseWorkGrade}
                onChange={(event) => setGradeForm((prev) => ({ ...prev, courseWorkGrade: event.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="exam-grade">
                Exam grade (optional)
              </label>
              <Input
                id="exam-grade"
                type="number"
                min="0"
                max="100"
                value={gradeForm.examGrade}
                onChange={(event) => setGradeForm((prev) => ({ ...prev, examGrade: event.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="remarks">
                Remarks (optional)
              </label>
              <textarea
                id="remarks"
                className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                value={gradeForm.remarks}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  setGradeForm((prev) => ({ ...prev, remarks: event.target.value }))
                }
                placeholder="Provide context for this grade"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="comments">
                Comments (optional)
              </label>
              <textarea
                id="comments"
                className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                value={gradeForm.comments}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  setGradeForm((prev) => ({ ...prev, comments: event.target.value }))
                }
                placeholder="Comments visible to administrators"
                rows={3}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
