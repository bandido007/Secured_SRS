import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { domainService } from '../../services/api/domainService';
import type {
	Course,
	CourseFilters,
	CourseResult,
	CourseResultFilters,
	Lecturer,
	LecturerFilters,
	PagedResponse,
	Student,
	StudentFilters,
} from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/ui/Pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { getErrorMessage } from '../../utils/error';
import { formatDateTime } from '../../utils/format';
import { Modal } from '../../components/ui/Modal';

const queryKey = 'admin-course-results';

const STATUS_OPTIONS = [
	{ label: 'All statuses', value: '' },
	{ label: 'Pending', value: 'PENDING' },
	{ label: 'Official', value: 'OFFICIAL' },
	{ label: 'Disputed', value: 'DISPUTED' },
];

const STATUS_DESCRIPTIONS: Record<string, string> = {
	PENDING: 'Awaiting verification from administrators or blockchain.',
	OFFICIAL: 'Verified on blockchain and visible to students.',
	DISPUTED: 'Flagged for review due to discrepancies.',
};

const GRADE_TYPE_OPTIONS = [
	{ label: 'All grade types', value: '' },
	{ label: 'Numeric', value: 'NUMERIC' },
	{ label: 'Letter', value: 'LETTER' },
	{ label: 'Pass/Fail', value: 'PASS_FAIL' },
];

export function AdminGrades() {
	const queryClient = useQueryClient();
	const [filters, setFilters] = useState<CourseResultFilters>({ pageNumber: 1, itemsPerPage: 10 });
	const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

	useEffect(() => {
		if (!feedback) {
			return;
		}
		const timeout = setTimeout(() => setFeedback(null), 4000);
		return () => clearTimeout(timeout);
	}, [feedback]);

	const courseResultsQuery = useQuery<PagedResponse<CourseResult>>({
		queryKey: [queryKey, filters],
		queryFn: async () => {
			const { data } = await domainService.courseResults.list(filters);
			return data;
		},
		placeholderData: (previous) => previous,
	});

	const studentsQuery = useQuery<PagedResponse<Student>>({
		queryKey: ['course-results-students'],
		queryFn: async () => {
			const { data } = await domainService.students.list({ itemsPerPage: 200 } as StudentFilters);
			return data;
		},
		staleTime: 1000 * 60 * 5,
	});

	const coursesQuery = useQuery<PagedResponse<Course>>({
		queryKey: ['course-results-courses'],
		queryFn: async () => {
			const { data } = await domainService.courses.list({ itemsPerPage: 200 } as CourseFilters);
			return data;
		},
		staleTime: 1000 * 60 * 5,
	});

	const lecturersQuery = useQuery<PagedResponse<Lecturer>>({
		queryKey: ['course-results-lecturers'],
		queryFn: async () => {
			const { data } = await domainService.lecturers.list({ itemsPerPage: 200 } as LecturerFilters);
			return data;
		},
		staleTime: 1000 * 60 * 5,
	});

	const courseResults = useMemo(() => courseResultsQuery.data?.data ?? [], [courseResultsQuery.data]);
	const pagination = courseResultsQuery.data?.page;
	const students = studentsQuery.data?.data ?? [];
	const courses = coursesQuery.data?.data ?? [];
	const lecturers = lecturersQuery.data?.data ?? [];
	const [selectedResult, setSelectedResult] = useState<CourseResult | null>(null);

	const [isModalOpen, setIsModalOpen] = useState(false);
	const openModal = (result: CourseResult) => {
		setSelectedResult(result);
		setIsModalOpen(true);
	};
	const closeModal = () => {
		setSelectedResult(null);
		setIsModalOpen(false);
	};

	const handleVerifyConfirm = () => {
		if (!selectedResult) return;
		verifyGrade.mutate(selectedResult.id);
		closeModal();
	};

	const verifyGrade = useMutation({
		mutationFn: async (gradeId: number) => {
			const { data } = await domainService.courseResults.verify(gradeId);
			return data;
		},
		onSuccess: (data) => {
			setFeedback({ type: 'success', message: data?.response.message ?? 'Grade verified successfully' });
			queryClient.invalidateQueries({ queryKey: [queryKey] }).catch((error) => {
				console.error('Failed to refresh course results', error);
			});
		},
		onError: (error) => {
			setFeedback({ type: 'error', message: getErrorMessage(error, 'Failed to verify grade') });
		},
	});

	const handleFilters = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		const studentId = formData.get('studentId') as string;
		const courseId = formData.get('courseId') as string;
		const lecturerId = formData.get('lecturerId') as string;
		const status = formData.get('status') as string;
		const gradeType = formData.get('gradeType') as string;
		const searchTerm = formData.get('searchTerm') as string;

		setFilters((prev) => ({
			...prev,
			pageNumber: 1,
			studentId: studentId ? Number(studentId) : undefined,
			courseId: courseId ? Number(courseId) : undefined,
			submittedById: lecturerId ? Number(lecturerId) : undefined,
			status: status ? (status as CourseResultFilters['status']) : undefined,
			gradeType: gradeType ? (gradeType as CourseResultFilters['gradeType']) : undefined,
			searchTerm: searchTerm || undefined,
		}));
	};

	const resetFilters = (form: HTMLFormElement | null) => {
		setFilters({ pageNumber: 1, itemsPerPage: filters.itemsPerPage });
		form?.reset();
	};

	const isLoading = courseResultsQuery.isLoading || courseResultsQuery.isFetching;

	return (
		<div className="space-y-6">
			<header className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold text-gray-900">Grades</h1>
					<p className="text-sm text-gray-500">Monitor course result submissions and verification status.</p>
				</div>
				<Button variant="outline" onClick={() => courseResultsQuery.refetch()} disabled={isLoading}>
					Refresh
				</Button>
			</header>

			<section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
				<form className="grid gap-4 md:grid-cols-6" onSubmit={handleFilters}>
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
					<select
						name="status"
						className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
						defaultValue=""
					>
						{STATUS_OPTIONS.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
					<select
						name="gradeType"
						className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
						defaultValue=""
					>
						{GRADE_TYPE_OPTIONS.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
					<Input name="searchTerm" placeholder="Search student or course" />
					<div className="flex items-center gap-2 md:col-span-6">
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
					className={`rounded-md border px-4 py-3 text-sm ${feedback.type === 'success'
						? 'border-green-200 bg-green-50 text-green-700'
						: 'border-red-200 bg-red-50 text-red-700'
						}`}
				>
					{feedback.message}
				</div>
			) : null}

			<section className="rounded-xl border border-gray-200 bg-white shadow-sm">
				{courseResultsQuery.isError ? (
					<EmptyState
						title="Failed to load grades"
						description="Please try refreshing the page or changing your filters."
						actionLabel="Try again"
						onAction={() => courseResultsQuery.refetch()}
					/>
				) : isLoading ? (
					<Spinner label="Fetching grades..." />
				) : courseResults.length === 0 ? (
					<EmptyState
						title="No grades found"
						description="Adjust your filters or ask lecturers to submit results."
					/>
				) : (
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Student</TableHead>
									<TableHead>Course</TableHead>
									<TableHead>Semester</TableHead>
									<TableHead>Grade</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Submitted</TableHead>
									<TableHead>Lecturer</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{courseResults.map((result) => (
									<TableRow key={result.id}>
										<TableCell>
											<div className="flex flex-col">
												<span className="font-medium text-gray-900">{result.studentNumber}</span>
												<span className="text-xs text-gray-500">{result.studentName}</span>
											</div>
										</TableCell>
										<TableCell>
											<div className="flex flex-col">
												<span className="font-medium text-gray-900">{result.courseCode}</span>
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
											{result.gradeType === 'NUMERIC' ? (
												<span className="font-semibold">{result.numericGrade ?? '—'}</span>
											) : result.gradeType === 'LETTER' ? (
												<span className="font-semibold">{result.letterGrade ?? '—'}</span>
											) : (
												<Badge
													variant={result.status === 'OFFICIAL' ? 'success' : 'secondary'}
													title="Pass/Fail grade type uses blockchain verification status for context"
													aria-label={`Pass/Fail grade: ${result.status === 'OFFICIAL' ? 'Pass' : result.status}`}
												>
													{result.status === 'OFFICIAL' ? 'Pass' : result.status}
												</Badge>
											)}
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
												title={STATUS_DESCRIPTIONS[result.status] ?? 'Grade status information'}
												aria-label={`Grade status: ${result.status}`}
											>
												{result.status}
											</Badge>
										</TableCell>
										<TableCell>
											<div className="flex flex-col">
												<span>{formatDateTime(result.submittedAt)}</span>
												{result.verifiedAt ? (
													<span className="text-xs text-gray-500">Verified {formatDateTime(result.verifiedAt)}</span>
												) : null}
											</div>
										</TableCell>
										<TableCell>{result.lecturerName}</TableCell>
										<TableCell className="flex justify-end gap-2">
											<Button
												size="sm"
												variant="outline"
												onClick={() => openModal(result)}
												disabled={verifyGrade.isPending || result.isVerified}
											>
												{result.isVerified ? 'Verified' : 'Verify'}
											</Button>

											{/* <Button
												variant="outline"
												size="sm"
												onClick={() => verifyGrade.mutate(result.id)}
												disabled={verifyGrade.isPending || result.isVerified}
											>
												{result.isVerified ? 'Verified' : 'Verify'}
											</Button> */}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}

				<div className="px-4">
					<Pagination page={pagination} onPageChange={(pageNumber) => setFilters((prev) => ({ ...prev, pageNumber }))} isLoading={isLoading} />
				</div>
				{selectedResult && (
					<Modal
						isOpen={isModalOpen}
						title="Verify Grade Submission"
						onClose={closeModal}
					>
						<div className="overflow-x-auto rounded-lg border border-gray-200">
							<table className="min-w-full border-collapse text-sm">
								<thead>
									<tr className="bg-gray-50 text-left text-gray-700">
										<th className="px-4 py-2 font-semibold">Field</th>
										<th className="px-4 py-2 font-semibold">Database</th>
										<th className="px-4 py-2 font-semibold">Blockchain</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200 text-gray-700">
									{[
										{ label: 'Student Name', db: selectedResult.studentName, chain: selectedResult.blockchainData?.studentName },
										{ label: 'Student Number', db: selectedResult.studentNumber, chain: selectedResult.studentNumber },
										{ label: 'Course', db: selectedResult.courseName , chain: selectedResult.courseName },
										// { label: 'Status', db: selectedResult.status, chain: selectedResult.status },
										// { label: 'Blockchain Hash', db: selectedResult.blockchainHash ?? '—', chain: selectedResult.blockchainHash ?? '—' },
										{ label: 'Submitted At', db: formatDateTime(selectedResult.submittedAt), chain: selectedResult.submittedAt ? formatDateTime(selectedResult.submittedAt) : '—' },
									].map((item) => {
										const isDifferent = item.db !== item.chain;
										return (
											<tr
												key={item.label}
												className={isDifferent ? 'border-l-4 border-red-500 bg-red-50' : ''}
											>
												<td className="px-4 py-2 font-medium text-gray-900">{item.label}</td>
												<td className="px-4 py-2">{item.db}</td>
												<td className="px-4 py-2">{item.chain ?? '—'}</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>

						<div className="mt-6 flex justify-end gap-3">
							<Button variant="outline" onClick={closeModal}>
								Cancel
							</Button>
							<Button onClick={handleVerifyConfirm} disabled={verifyGrade.isPending}>
								{verifyGrade.isPending ? 'Verifying...' : 'Accept from Blockchain'}
							</Button>
							<Button onClick={handleVerifyConfirm} disabled={verifyGrade.isPending}>
								{verifyGrade.isPending ? 'Verifying...' : 'Accept from Database'}
							</Button>
						</div>

					</Modal>
				)}
			</section>
		</div>
	);
}
