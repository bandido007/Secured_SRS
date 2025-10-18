import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { domainService } from '../../services/api/domainService';
import { useCurrentStudent } from '../../hooks/useCurrentProfiles';
import type {
  AcademicTranscript,
  PagedResponse,
  TranscriptFilters,
  TranscriptInput,
} from '../../types';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { getErrorMessage } from '../../utils/error';
import { formatDateTime } from '../../utils/format';

const QUERY_KEY = 'student-transcripts';

export function StudentTranscripts() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<TranscriptFilters>({ pageNumber: 1, itemsPerPage: 10 });
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [formState, setFormState] = useState<Omit<TranscriptInput, 'studentId'>>({
    academicYear: '',
    semester: '',
    isOfficial: true,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { student, query: studentQuery } = useCurrentStudent();

  useEffect(() => {
    if (!feedback) {
      return;
    }
    const timeout = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const transcriptsQuery = useQuery<PagedResponse<AcademicTranscript>>({
    queryKey: [QUERY_KEY, student?.id, filters],
    enabled: Boolean(student?.id),
    queryFn: async () => {
      if (!student?.id) {
        return { data: [], response: { id: 0, status: true, message: 'No student', code: 200 } } as PagedResponse<AcademicTranscript>;
      }
      const { data } = await domainService.students.transcripts(student.id, filters);
      return data;
    },
    placeholderData: (previous) => previous,
  });

  const transcripts = useMemo(() => transcriptsQuery.data?.data ?? [], [transcriptsQuery.data]);
  const pagination = transcriptsQuery.data?.page;

  const generateTranscript = useMutation({
    mutationFn: async () => {
      if (!student?.id) {
        throw new Error('Unable to identify student.');
      }
      const payload: TranscriptInput = {
        studentId: student.id,
        academicYear: formState.academicYear || undefined,
        semester: formState.semester || undefined,
        isOfficial: formState.isOfficial,
      };
      const { data } = await domainService.transcripts.generate(payload);
      return data;
    },
    onSuccess: (data) => {
      setFeedback({ type: 'success', message: data?.response.message ?? 'Transcript request submitted' });
      setIsModalOpen(false);
      setFormState({ academicYear: '', semester: '', isOfficial: true });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }).catch((error) => {
        console.error('Failed to refresh transcript list', error);
      });
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: getErrorMessage(error, 'Failed to request transcript') });
    },
  });

  const handleFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const academicYear = (formData.get('academicYear') as string) || undefined;
    const semester = (formData.get('semester') as string) || undefined;
    const isOfficialRaw = (formData.get('isOfficial') as string) || undefined;

    setFilters((prev) => ({
      ...prev,
      pageNumber: 1,
      academicYear,
      semester,
      isOfficial: isOfficialRaw === 'all' ? undefined : isOfficialRaw === 'true',
    }));
  };

  const resetFilters = (form: HTMLFormElement | null) => {
    form?.reset();
    setFilters({ pageNumber: 1, itemsPerPage: filters.itemsPerPage });
  };

  if (studentQuery.isLoading) {
    return <Spinner label="Loading your transcripts..." />;
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
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-gray-900">My Transcripts</h1>
          <p className="text-sm text-gray-500">Access blockchain-backed academic history snapshots.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} disabled={generateTranscript.isPending}>
          Request transcript
        </Button>
      </header>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <form className="grid gap-4 md:grid-cols-4" onSubmit={handleFilters}>
          <Input name="academicYear" placeholder="Academic year" />
          <Input name="semester" placeholder="Semester" />
          <select
            name="isOfficial"
            defaultValue="all"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <option value="all">All types</option>
            <option value="true">Official</option>
            <option value="false">Draft</option>
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
        {transcriptsQuery.isError ? (
          <EmptyState
            title="Failed to load transcripts"
            description="Try refreshing the page."
            actionLabel="Try again"
            onAction={() => transcriptsQuery.refetch()}
          />
        ) : transcriptsQuery.isFetching ? (
          <Spinner label="Loading transcripts..." />
        ) : transcripts.length === 0 ? (
          <EmptyState
            title="No transcripts yet"
            description="Request a transcript to generate a new copy of your academic record."
            actionLabel="Request transcript"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>GPA</TableHead>
                  <TableHead>Total Credits</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead>Blockchain Hash</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transcripts.map((transcript) => (
                  <TableRow key={transcript.id}>
                    <TableCell>{transcript.academicYear ?? '—'}</TableCell>
                    <TableCell>{transcript.semester ?? '—'}</TableCell>
                    <TableCell>{transcript.gpa ?? '—'}</TableCell>
                    <TableCell>{transcript.totalCredits ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={transcript.isOfficial ? 'success' : 'secondary'}>
                        {transcript.isOfficial ? 'Official' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(transcript.generatedAt)}</TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={transcript.blockchainRootHash}>
                        {transcript.blockchainRootHash}
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
            isLoading={transcriptsQuery.isFetching}
          />
        </div>
      </section>

      <Modal
        title="Request transcript"
        description="Generate a new transcript snapshot for your current academic progress."
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => generateTranscript.mutate()} disabled={generateTranscript.isPending}>
              {generateTranscript.isPending ? 'Submitting...' : 'Request' }
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700" htmlFor="student-transcript-academicYear">
              Academic year (optional)
            </label>
            <Input
              id="student-transcript-academicYear"
              value={formState.academicYear ?? ''}
              onChange={(event) => setFormState((prev) => ({ ...prev, academicYear: event.target.value }))}
              placeholder="e.g. 2024/2025"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700" htmlFor="student-transcript-semester">
              Semester (optional)
            </label>
            <Input
              id="student-transcript-semester"
              value={formState.semester ?? ''}
              onChange={(event) => setFormState((prev) => ({ ...prev, semester: event.target.value }))}
              placeholder="e.g. Fall"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700" htmlFor="student-transcript-type">
              Transcript type
            </label>
            <select
              id="student-transcript-type"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              value={formState.isOfficial ? 'official' : 'draft'}
              onChange={(event) => setFormState((prev) => ({ ...prev, isOfficial: event.target.value === 'official' }))}
            >
              <option value="official">Official transcript</option>
              <option value="draft">Draft transcript</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
