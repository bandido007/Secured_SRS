import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { domainService } from '../../services/api/domainService';
import type {
  AcademicTranscript,
  PagedResponse,
  Student,
  StudentFilters,
  TranscriptFilters,
  TranscriptInput,
} from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/ui/Pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { getErrorMessage } from '../../utils/error';
import { formatDateTime } from '../../utils/format';

const queryKey = 'admin-transcripts';

export function AdminTranscripts() {
  const queryClient = useQueryClient();
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [filters, setFilters] = useState<TranscriptFilters>({ pageNumber: 1, itemsPerPage: 10 });
  const [formState, setFormState] = useState<Omit<TranscriptInput, 'studentId'>>({
    academicYear: '',
    semester: '',
    isOfficial: true,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!feedback) {
      return;
    }
    const timeout = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const studentsQuery = useQuery<PagedResponse<Student>>({
    queryKey: ['admin-transcripts-students'],
    queryFn: async () => {
      const { data } = await domainService.students.list({ itemsPerPage: 200 } as StudentFilters);
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const transcriptsQuery = useQuery<PagedResponse<AcademicTranscript>>({
    queryKey: [queryKey, selectedStudentId, filters],
    enabled: Boolean(selectedStudentId),
    queryFn: async () => {
      if (!selectedStudentId) {
        return { data: [], response: { id: 0, code: 200, message: 'No student', status: true } } as PagedResponse<AcademicTranscript>;
      }
      const { data } = await domainService.students.transcripts(selectedStudentId, filters);
      return data;
    },
    placeholderData: (previous) => previous,
  });

  const transcripts = useMemo(() => transcriptsQuery.data?.data ?? [], [transcriptsQuery.data]);
  const pagination = transcriptsQuery.data?.page;
  const students = studentsQuery.data?.data ?? [];

  const generateTranscript = useMutation({
    mutationFn: async () => {
      if (!selectedStudentId) {
        throw new Error('Please choose a student before generating a transcript.');
      }
      const payload: TranscriptInput = {
        studentId: selectedStudentId,
        academicYear: formState.academicYear || undefined,
        semester: formState.semester || undefined,
        isOfficial: formState.isOfficial,
      };
      const { data } = await domainService.transcripts.generate(payload);
      return data;
    },
    onSuccess: (data) => {
      setIsModalOpen(false);
      setFormState({ academicYear: '', semester: '', isOfficial: true });
      setFeedback({ type: 'success', message: data?.response.message ?? 'Transcript generated successfully' });
      queryClient.invalidateQueries({ queryKey: [queryKey] }).catch((error) => {
        console.error('Failed to refresh transcripts list', error);
      });
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: getErrorMessage(error, 'Failed to generate transcript') });
    },
  });

  const handleFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const academicYear = (formData.get('academicYear') as string) || undefined;
    const semester = (formData.get('semester') as string) || undefined;
    const isOfficial = formData.get('isOfficial');

    setFilters((prev) => ({
      ...prev,
      pageNumber: 1,
      academicYear,
      semester,
      isOfficial: isOfficial === 'all' ? undefined : isOfficial === 'true',
    }));
  };

  const resetFilters = (form: HTMLFormElement | null) => {
    setFilters({ pageNumber: 1, itemsPerPage: filters.itemsPerPage });
    form?.reset();
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Transcripts</h1>
          <p className="text-sm text-gray-500">Generate and review blockchain-backed academic transcripts.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => transcriptsQuery.refetch()} disabled={transcriptsQuery.isFetching}>
            Refresh
          </Button>
          <Button onClick={() => setIsModalOpen(true)} disabled={!selectedStudentId}>
            Generate Transcript
          </Button>
        </div>
      </header>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="transcript-student">
              Select student
            </label>
            <select
              id="transcript-student"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              value={selectedStudentId ?? ''}
              onChange={(event) => {
                const value = event.target.value;
                const nextStudentId = value ? Number(value) : null;
                setSelectedStudentId(nextStudentId);
                setFilters({ pageNumber: 1, itemsPerPage: filters.itemsPerPage });
              }}
            >
              <option value="">Choose a student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.studentId} • {student.username}
                </option>
              ))}
            </select>
          </div>
          <form className="grid gap-4 md:col-span-2 md:grid-cols-3" onSubmit={handleFilters}>
            <Input name="academicYear" placeholder="Academic year" />
            <Input name="semester" placeholder="Semester" />
            <select
              name="isOfficial"
              defaultValue="all"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <option value="all">All types</option>
              <option value="true">Official</option>
              <option value="false">Unofficial</option>
            </select>
            <div className="flex items-center gap-2 md:col-span-3">
              <Button type="submit" className="w-full md:w-auto" disabled={!selectedStudentId}>
                Apply filters
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full md:w-auto"
                onClick={(event) => resetFilters(event.currentTarget.form)}
                disabled={!selectedStudentId}
              >
                Reset
              </Button>
            </div>
          </form>
        </div>
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
        {!selectedStudentId ? (
          <EmptyState
            title="Select a student"
            description="Choose a student to view their transcript history."
          />
        ) : transcriptsQuery.isError ? (
          <EmptyState
            title="Failed to load transcripts"
            description="Please try refreshing the page."
            actionLabel="Try again"
            onAction={() => transcriptsQuery.refetch()}
          />
        ) : transcriptsQuery.isFetching ? (
          <Spinner label="Loading transcripts..." />
        ) : transcripts.length === 0 ? (
          <EmptyState
            title="No transcripts found"
            description="Generate a new transcript to populate this list."
            actionLabel="Generate transcript"
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
                  <TableHead>Official</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead>Blockchain Root</TableHead>
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
        title="Generate Transcript"
        description="Create a new transcript snapshot with optional academic filters."
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => generateTranscript.mutate()} disabled={generateTranscript.isPending || !selectedStudentId}>
              {generateTranscript.isPending ? 'Generating...' : 'Generate'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700" htmlFor="transcript-academicYear">
              Academic year (optional)
            </label>
            <Input
              id="transcript-academicYear"
              value={formState.academicYear ?? ''}
              onChange={(event) => setFormState((prev) => ({ ...prev, academicYear: event.target.value }))}
              placeholder="e.g. 2024/2025"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700" htmlFor="transcript-semester">
              Semester (optional)
            </label>
            <Input
              id="transcript-semester"
              value={formState.semester ?? ''}
              onChange={(event) => setFormState((prev) => ({ ...prev, semester: event.target.value }))}
              placeholder="e.g. Fall"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700" htmlFor="transcript-official">
              Transcript type
            </label>
            <select
              id="transcript-official"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              value={formState.isOfficial ? 'official' : 'draft'}
              onChange={(event) => setFormState((prev) => ({ ...prev, isOfficial: event.target.value === 'official' }))}
            >
              <option value="official">Official transcript</option>
              <option value="draft">Unofficial transcript</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
