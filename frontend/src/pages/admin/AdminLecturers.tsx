import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, Dispatch, FormEvent, SetStateAction } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { domainService } from '../../services/api/domainService';
import type { Lecturer, LecturerFilters, LecturerInput, PagedResponse } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/ui/Pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { getErrorMessage } from '../../utils/error';

const DEFAULT_FORM: LecturerInput = {
  userId: 0,
  lecturerId: '',
  department: '',
  specialization: '',
};

const queryKey = 'lecturers';

export function AdminLecturers() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<LecturerFilters>({ pageNumber: 1, itemsPerPage: 10 });
  const [formState, setFormState] = useState<LecturerInput>(DEFAULT_FORM);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedLecturer, setSelectedLecturer] = useState<Lecturer | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!feedback) {
      return;
    }
    const timeout = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const lecturersQuery = useQuery<PagedResponse<Lecturer>>({
    queryKey: [queryKey, filters],
    queryFn: async () => {
      const { data } = await domainService.lecturers.list(filters);
      return data;
    },
    placeholderData: (previousData: PagedResponse<Lecturer> | undefined) => previousData,
  });

  const lecturers = useMemo(() => lecturersQuery.data?.data ?? [], [lecturersQuery.data]);
  const page = lecturersQuery.data?.page;

  const handleFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
  };

  const invalidateLecturers = () => {
    queryClient.invalidateQueries({ queryKey: [queryKey] }).catch((error) => {
      console.error('Failed to invalidate lecturers cache', error);
    });
  };

  const updateLecturer = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: LecturerInput }) => {
      const { data } = await domainService.lecturers.update(id, normalizePayload(payload));
      return data;
    },
    onSuccess: (response) => {
      handleFeedback('success', response?.response.message ?? 'Lecturer updated successfully');
      setIsEditOpen(false);
      setSelectedLecturer(null);
      invalidateLecturers();
    },
    onError: (error) => {
      handleFeedback('error', getErrorMessage(error, 'Failed to update lecturer'));
    },
  });

  const deactivateLecturer = useMutation({
    mutationFn: async (id: number) => {
      const { data } = await domainService.lecturers.deactivate(id);
      return data;
    },
    onSuccess: (response) => {
      handleFeedback('success', response?.response.message ?? 'Lecturer deactivated');
      invalidateLecturers();
    },
    onError: (error) => {
      handleFeedback('error', getErrorMessage(error, 'Failed to deactivate lecturer'));
    },
  });

  const handleOpenEdit = (lecturer: Lecturer) => {
    setSelectedLecturer(lecturer);
    setFormState(mapLecturerToForm(lecturer));
    setIsEditOpen(true);
  };

  const handleSubmitEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedLecturer) {
      return;
    }
    updateLecturer.mutate({ id: selectedLecturer.id, payload: formState });
  };

  const handlePageChange = (pageNumber: number) => {
    setFilters((prev) => ({ ...prev, pageNumber }));
  };

  const isLoading = lecturersQuery.isLoading || lecturersQuery.isFetching;
  const hasError = lecturersQuery.isError;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Lecturers</h1>
          <p className="text-sm text-gray-500">Maintain lecturer profiles, departmental assignments, and specializations.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => lecturersQuery.refetch()} disabled={isLoading}>
            Refresh
          </Button>
        </div>
      </header>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <form
          className="grid gap-4 md:grid-cols-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const department = (form.get('department') as string) || undefined;
            const specialization = (form.get('specialization') as string) || undefined;

            setFilters((prev) => ({
              ...prev,
              pageNumber: 1,
              department,
              specialization,
            }));
          }}
        >
          <Input name="department" placeholder="Filter by department" />
          <Input name="specialization" placeholder="Filter by specialization" />
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
            title="Failed to load lecturers"
            description="Please refresh the page or adjust your filters."
            actionLabel="Try again"
            onAction={() => lecturersQuery.refetch()}
          />
        ) : isLoading ? (
          <Spinner label="Fetching lecturers..." />
        ) : lecturers.length === 0 ? (
          <EmptyState
            title="No lecturers found"
            description="Try adjusting your filters. To register new lecturers, use the Provision users page."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lecturer ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lecturers.map((lecturer: Lecturer) => (
                  <TableRow key={lecturer.id}>
                    <TableCell className="font-medium">{lecturer.lecturerId}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{lecturer.username}</span>
                        <span className="text-xs text-gray-500">{lecturer.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>{lecturer.department}</TableCell>
                    <TableCell>{lecturer.specialization ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={lecturer.isActive ? 'success' : 'warning'}>
                        {lecturer.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenEdit(lecturer)}>
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deactivateLecturer.mutate(lecturer.id)}
                        disabled={deactivateLecturer.isPending}
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
        title="Edit Lecturer"
        description="Update lecturer department or specialization details."
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedLecturer(null);
        }}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditOpen(false);
                setSelectedLecturer(null);
              }}
            >
              Cancel
            </Button>
            <Button form="edit-lecturer-form" type="submit" disabled={updateLecturer.isPending}>
              {updateLecturer.isPending ? 'Saving...' : 'Save changes'}
            </Button>
          </>
        }
      >
        <LecturerForm formState={formState} setFormState={setFormState} isEditing />
        <form id="edit-lecturer-form" onSubmit={handleSubmitEdit} className="hidden" />
      </Modal>
    </div>
  );
}

interface LecturerFormProps {
  formState: LecturerInput;
  setFormState: Dispatch<SetStateAction<LecturerInput>>;
  isEditing?: boolean;
}

function LecturerForm({ formState, setFormState, isEditing = false }: LecturerFormProps) {
  const handleChange = (field: keyof LecturerInput) => (event: ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;
    const value = event.target.type === 'number' ? (rawValue ? Number(rawValue) : undefined) : rawValue;
    setFormState((prev) => ({
      ...prev,
      [field]: value as never,
    }));
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700" htmlFor="lecturer-userId">
          User ID
        </label>
        <Input
          id="lecturer-userId"
          type="number"
          min={1}
          value={formState.userId || ''}
          onChange={handleChange('userId')}
          required={!isEditing}
          disabled={isEditing}
          placeholder="Associated user ID"
        />
        <p className="text-xs text-gray-500">Provide the linked Django user ID for this lecturer.</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700" htmlFor="lecturer-lecturerId">
          Lecturer ID
        </label>
        <Input
          id="lecturer-lecturerId"
          value={formState.lecturerId}
          onChange={handleChange('lecturerId')}
          required
          disabled={isEditing}
          placeholder="e.g. LECT-2024-001"
        />
      </div>

      <div className="space-y-2 md:col-span-1">
        <label className="text-sm font-medium text-gray-700" htmlFor="lecturer-department">
          Department
        </label>
        <Input
          id="lecturer-department"
          value={formState.department}
          onChange={handleChange('department')}
          required
          placeholder="e.g. Computer Science"
        />
      </div>

      <div className="space-y-2 md:col-span-1">
        <label className="text-sm font-medium text-gray-700" htmlFor="lecturer-specialization">
          Specialization
        </label>
        <Input
          id="lecturer-specialization"
          value={formState.specialization ?? ''}
          onChange={handleChange('specialization')}
          placeholder="Optional"
        />
      </div>
    </div>
  );
}

function mapLecturerToForm(lecturer: Lecturer): LecturerInput {
  return {
    userId: lecturer.userId,
    lecturerId: lecturer.lecturerId,
    department: lecturer.department,
    specialization: lecturer.specialization ?? '',
  };
}

function normalizePayload(payload: LecturerInput): LecturerInput {
  return {
    ...payload,
    specialization: payload.specialization || undefined,
  };
}
