import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Shield, AlertTriangle, TrendingUp, TrendingDown, FileText, User, Calendar, Hash, AlertCircle, CheckCircle, Clock } from 'lucide-react';

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

// Define local interfaces to fix type errors
interface GradeVersionHistory2 {
  gradeId: number;
  currentVersion: {
    verification: {
      status: 'VERIFIED' | 'MISMATCH' | string;
    };
  };
  versionHistory: Array<{
    versionNumber: number;
    transactionType: string;
    timestamp: string;
    transactionId?: string;
    blockchainHash?: string;
    performedBy?: { username: string };
    changes?: { updateReason?: string };
    comments?: string;
  }>;
}

interface GradeVersionHistory {
  gradeId: number;
  currentVersion: {
    verification: {
      status: 'VERIFIED' | 'MISMATCH' | string;
    };
  };
  versionHistory: Array<{
    action: string;
    versionNumber: number;
    transactionType: string;
    timestamp: string;
    transactionId?: string;
    blockchainHash?: string;
    performedBy?: { username: string };
    changes?: { updateReason?: string };
    comments?: string;
    snapshot: {
      studentName?: string;
      studentNumber?: string;
      courseCode?: string;
      courseName?: string;
      numericGrade?: string;
      courseWorkGrade?: string;
      examGrade?: string;
      status?: string;
      remarks?: string;
      lecturerName?: string;
      submittedAt: string;
      blockchainHash: string;
    };
    previousSnapshot?: {
      numericGrade?: string;
      courseWorkGrade?: string;
      examGrade?: string;
      status?: string;
      remarks?: string;
    };
  }>;
}


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

function normalize(value: string | number | null | undefined) {
  if (value == null) return '';
  return String(value).trim().toLowerCase().replace(/\s+/g, ' ');
}

/* -------------------------------------------------------------------------- */
/* INNOVATIVE AUDIT TRAIL MODAL COMPONENT                  */
/* -------------------------------------------------------------------------- */

function GradeVerificationModal({
  result,
  isOpen,
  onClose
}: {
  result: CourseResult | null,
  isOpen: boolean,
  onClose: () => void
}) {
  const [openAccordionId, setOpenAccordionId] = useState<number | null>(null);

  const historyQuery = useQuery({
    queryKey: ['grade-history', result?.id],
    enabled: !!result && isOpen,
    queryFn: async () => {
      // Explicitly unwrap both the Axios Response AND the API Response wrapper
      const axiosResponse = await domainService.courseResults.versionHistory(result!.id);
      return axiosResponse.data.data;
    },
  });

  const historyData = historyQuery.data as unknown as GradeVersionHistory | undefined;
  const official = historyData?.versionHistory?.find(
    v => v.snapshot?.status === 'OFFICIAL'
  );

  const toggleAccordion = (index: number) => {
    setOpenAccordionId(openAccordionId === index ? null : index);
  };

  const calculateChanges = (current?: any, previous?: any) => {
    if (!previous || !current) return null;

    const changes: Array<{
      field: string;
      oldValue: any;
      newValue: any;
      isDelta: boolean;
    }> = [];

    // Define all fields to check for changes
    const fields = ['numericGrade', 'courseWorkGrade', 'examGrade', 'status', 'remarks', 'letterGrade'];

    fields.forEach(field => {
      const oldVal = previous[field];
      const newVal = current[field];

      // Only add to changes if values are actually different
      if (oldVal !== newVal && (oldVal !== undefined || newVal !== undefined)) {
        changes.push({
          field: field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
          oldValue: oldVal ?? 'N/A',
          newValue: newVal ?? 'N/A',
          isDelta: !isNaN(parseFloat(newVal)) && !isNaN(parseFloat(oldVal))
        });
      }
    });

    return changes.length > 0 ? changes : null;
  };



  const calculateGradeDelta = (newGrade: string, oldGrade: string) => {
    const delta = parseFloat(newGrade) - parseFloat(oldGrade);
    return delta;
  };


  const getStatusColor = (status?: string) => {
    const colors: Record<string, string> = {
      'INVALID': 'bg-red-100 text-red-800 ring-red-600/20',
      'PENDING': 'bg-yellow-100 text-yellow-800 ring-yellow-600/20',
      'OFFICIAL': 'bg-green-100 text-green-800 ring-green-600/20',
      'VERIFIED': 'bg-blue-100 text-blue-800 ring-blue-600/20'
    };
    return colors[status || ''] || 'bg-gray-100 text-gray-800 ring-gray-600/20';
  };


  const getImpactLevel = (changes: any) => {
    if (!changes || changes.length === 0) return { level: 'None', color: 'text-gray-500', icon: CheckCircle };

    const hasStatusChange = changes.some((c: any) => c.field.includes('Status'));
    const hasGradeChange = changes.some((c: any) => c.field.includes('Grade'));
    const changeCount = changes.length;

    if (hasStatusChange || changeCount >= 3) {
      return { level: 'High Impact', color: 'text-red-600', icon: AlertTriangle };
    } else if (hasGradeChange) {
      return { level: 'Medium Impact', color: 'text-amber-600', icon: AlertCircle };
    }
    return { level: 'Low Impact', color: 'text-blue-600', icon: CheckCircle };
  };




  if (!isOpen || !result) return null;

  return (
    <Modal
      isOpen={isOpen}
      title="Grade Integrity & Audit Trail"
      onClose={onClose}
    // Removed maxWidth prop to fix TS error
    >
      {historyQuery.isLoading ? (
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          {/* Removed size prop to fix TS error */}
          <Spinner label="Tracing blockchain history..." />
        </div>
      ) : historyQuery.isError ? (
        <EmptyState title="Verification Unavailable" description="Could not fetch blockchain history at this time." />
      ) : (
        <div className="space-y-6">

          {/* --- SECTION 1: VISUAL INTEGRITY STATUS --- */}
          <div className={`rounded-xl border p-5 transition-colors ${result?.status === 'VALID'
            ? 'border-green-200 bg-green-50/50'
            : 'border-red-200 bg-red-50/50'
            }`}>
            <div className="flex items-start gap-4">
              <div className={`rounded-full p-2 flex-shrink-0 ${result?.status === 'VALID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                {official?.snapshot?.status == 'OFFICIAL' && result?.status == 'VALID'
                  ? <CheckCircle className="h-6 w-6" />
                  : <AlertTriangle className="h-6 w-6" />
                }
              </div>
              <div className="flex-1">
                <h3 className={`text-lg font-bold ${result?.status === 'VALID' ? 'text-green-900' : 'text-red-900'
                  }`}>
                  {official?.snapshot?.status == 'OFFICIAL' && result?.status == 'VALID'
                    ? 'Official & Verified'
                    : 'Integrity Mismatch Detected'}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {official?.snapshot?.status == 'OFFICIAL' && result?.status == 'VALID'
                    ? "The data in the database matches the immutable record on the blockchain. This grade is authentic."
                    : "The current database record differs from the last verified blockchain entry. This grade may have been tampered with."}
                </p>

                {/* Mini Snapshot Table */}
                <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                  <table className="min-w-full text-xs">
                    <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Data Point </th>
                        <th className="px-4 py-2 text-left font-medium">Database (Live)</th>
                        <th className="px-4 py-2 text-left font-medium">Blockchain (Immutable)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-gray-700">
                      {[
                        // { label: 'Student Name', db: result.studentName, chain: result.blockchainData?.studentName },
                        { label: 'Numeric Grade', db: result.numericGrade, chain: result.blockchainData?.numericGrade },
                        // { label: 'Course', db: result.courseName, chain: result.blockchainData?.courseName },
                        { label: 'CourseWork Grade', db: result.courseWorkGrade, chain: official?.snapshot?.courseWorkGrade },
                        { label: 'Exam Grade', db: result.examGrade ?? '—', chain: official?.snapshot?.examGrade ?? '—' },
                        { label: 'Grade Type', db: result.gradeType, chain: result.blockchainData?.gradeType },
                        // { label: 'Submitted At', db: formatDateTime(result.submittedAt), chain: official?.snapshot?.submittedAt ? formatDateTime(official?.timestamp) : '—' },
                      ].map((item) => {
                        const isDifferent = normalize(item.db) !== normalize(item.chain);
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
              </div>
            </div>
          </div>

          {/* --- SECTION 2: INTERACTIVE TIMELINE --- */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Clock className="h-5 w-5 text-gray-500" />
              Audit Timeline
            </h3>

            <div className="relative space-y-4 pl-4 before:absolute before:bottom-0 before:left-[19px] before:top-2 before:w-0.5 before:bg-gray-200">
              {historyData?.versionHistory?.map((version, index) => {
                const isExpanded = openAccordionId === index;
                const isGenesis = index === 0;
                const changes = index > 0
                  ? calculateChanges(version.snapshot, historyData?.versionHistory[index - 1]?.snapshot)
                  : null;
                const impact = getImpactLevel(changes);
                const ImpactIcon = impact.icon;


                return (
                  <div key={index} className="relative pl-6">
                    {/* Timeline Dot */}
                    <div className={`absolute left-[11px] top-4 h-4 w-4 rounded-full border-2 border-white shadow-sm z-10 ${isGenesis ? 'bg-blue-600' : 'bg-amber-600'
                      }`}></div>

                    <div className={`rounded-lg border transition-all duration-200 ${isExpanded ? 'border-blue-200 shadow-md ring-1 ring-blue-100' : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}>
                      {/* Accordion Header */}
                      <button
                        onClick={() => toggleAccordion(index)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left"
                      >
                        <div className="flex flex-col flex-1">
                          <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${isGenesis
                              ? 'bg-blue-50 text-blue-700 ring-blue-600/20'
                              : 'bg-amber-50 text-amber-700 ring-amber-600/20'
                              }`}>
                              {version.action}
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              Version {index + 1}
                            </span>
                            {changes && ImpactIcon && (
                              <span className={`flex items-center gap-1 text-xs font-medium ${impact.color}`}>
                                <ImpactIcon className="h-3 w-3" />
                                {impact.level}
                              </span>
                            )}
                          </div>
                          <span className="mt-1 text-xs text-gray-500">
                            {formatDateTime(version.timestamp)} • Modified by <span className="font-medium text-gray-700">{version.snapshot?.lecturerName || 'System'}</span>
                          </span>
                        </div>
                        {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                      </button>

                      {/* Accordion Content */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-3 space-y-4">
                          {/* Current Grade Summary */}
                          <div className="rounded-lg bg-white p-4 border border-gray-200">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Grade Summary</h3>
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <p className="text-xs text-gray-500 uppercase">Final Grade</p>
                                <p className="text-2xl font-bold text-gray-900">{version.snapshot.numericGrade}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 uppercase">Coursework</p>
                                <p className="text-2xl font-bold text-gray-900">{version.snapshot.courseWorkGrade}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 uppercase">Exam</p>
                                <p className="text-2xl font-bold text-gray-900">{version.snapshot.examGrade}</p>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(version.snapshot.status)}`}>
                                {version.snapshot.status}
                              </span>
                            </div>
                          </div>

                          {/* Changes Analysis */}
                          {changes && changes.length > 0 && (
                            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                              <h3 className="text-sm font-semibold text-amber-900 mb-3 flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                Changes Made ({changes.length})
                              </h3>
                              <div className="space-y-2">
                                {changes.map((change, idx) => {
                                  // Skip if old and new values are the same
                                  if (change.oldValue === change.newValue) return null;

                                  const delta = change.isDelta ? calculateGradeDelta(change.newValue, change.oldValue) : null;
                                  return (
                                    <div key={idx} className="flex items-center justify-between bg-white rounded p-2 border border-amber-100">
                                      <div className="flex-1">
                                        <p className="text-xs font-medium text-gray-700">{change.field}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className="text-xs text-gray-500 line-through">{change.oldValue}</span>
                                          <span className="text-xs text-gray-400">→</span>
                                          <span className="text-xs font-semibold text-gray-900">{change.newValue}</span>
                                        </div>
                                      </div>
                                      {delta !== null && delta !== 0 && (
                                        <div className={`flex items-center gap-1 text-xs font-bold ${delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          {delta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                          {delta > 0 ? '+' : ''}{delta.toFixed(2)}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Blockchain Verification */}
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
                                <Hash className="h-3 w-3" />
                                Blockchain Hash
                              </p>
                              <p className="font-mono text-xs text-gray-600 break-all bg-white px-2 py-1 rounded border border-gray-200">
                                {version.snapshot.blockchainHash}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Submission Time
                              </p>
                              <p className="text-xs text-gray-600 bg-white px-2 py-1 rounded border border-gray-200">
                                {new Date(version.snapshot.submittedAt).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          {/* Remarks */}
                          {version.snapshot.remarks && (
                            <div className="flex gap-3 rounded-md bg-blue-50 p-3 text-sm text-blue-800 border border-blue-100">
                              <Shield className="h-5 w-5 flex-shrink-0 text-blue-600" />
                              <div>
                                <span className="font-semibold block text-blue-900">Remarks:</span>
                                {version.snapshot.remarks}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
        <Button variant="outline" onClick={onClose}>
          Close Audit
        </Button>
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* MAIN DASHBOARD COMPONENT                                                   */
/* -------------------------------------------------------------------------- */

export function LecturerGradeSubmission() {
  const queryClient = useQueryClient();
  const [enrollmentFilters, setEnrollmentFilters] = useState<EnrollmentFilters>({ pageNumber: 1, itemsPerPage: 10 });
  const [resultFilters, setResultFilters] = useState<CourseResultFilters>({ pageNumber: 1, itemsPerPage: 10 });
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal States
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Selection States
  const [gradeForm, setGradeForm] = useState<GradeFormState>(DEFAULT_GRADE_FORM);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [selectedResult, setSelectedResult] = useState<CourseResult | null>(null);
  const [resultToEdit, setResultToEdit] = useState<CourseResult | null>(null);

  const { lecturer, query: lecturerQuery } = useCurrentLecturer();

  // Queries
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

  // Lookup map: EnrollmentID -> Result
  const resultsByEnrollmentId = useMemo(() => {
    const map = new Map<number, CourseResult>();
    results.forEach((result) => {
      if (result.enrollmentId) {
        map.set(result.enrollmentId, result);
      }
    });
    return map;
  }, [results]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timeout);
  }, [feedback]);

  // Modal Handlers
  const openVerifyModal = (result: CourseResult) => {
    setSelectedResult(result);
    setIsVerifyModalOpen(true);
  };

  const openGradeModal = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setGradeForm(DEFAULT_GRADE_FORM);
    setIsGradeModalOpen(true);
  };

  const openEditModal = (result: CourseResult) => {
    setResultToEdit(result);
    setGradeForm({
      gradeType: result.gradeType,
      numericGrade: result.numericGrade?.toString() ?? '',
      letterGrade: result.letterGrade ?? '',
      courseWorkGrade: result.courseWorkGrade?.toString() ?? '',
      examGrade: result.examGrade?.toString() ?? '',
      remarks: result.remarks ?? '',
      comments: '',
    });
    setIsEditModalOpen(true);
  };

  const closeGradeModal = () => {
    setSelectedEnrollment(null);
    setIsGradeModalOpen(false);
  };

  const closeEditModal = () => {
    setResultToEdit(null);
    setIsEditModalOpen(false);
    setGradeForm(DEFAULT_GRADE_FORM);
  };

  const resetFormState = () => {
    setGradeForm(DEFAULT_GRADE_FORM);
    setSelectedEnrollment(null);
  };

  // Mutations
  const submitGrade = useMutation({
    mutationFn: async () => {
      if (!selectedEnrollment) throw new Error('Select an enrollment to submit a grade.');

      const payload: CourseResultInput = {
        enrollmentId: selectedEnrollment.id,
        gradeType: gradeForm.gradeType,
        numericGrade: gradeForm.gradeType === 'NUMERIC' && gradeForm.numericGrade ? Number(gradeForm.numericGrade) : undefined,
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
      if (data?.response?.id === 1) {
        setFeedback({ type: 'success', message: data?.response.message ?? 'Grade submitted successfully' });
        setIsGradeModalOpen(false);
        resetFormState();
        queryClient.invalidateQueries({ queryKey: [RESULTS_QUERY_KEY] });
      } else {
        setFeedback({ type: 'error', message: data?.response.message ?? 'Submission failed' });
      }
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: getErrorMessage(error, 'Failed to submit grade') });
    },
  });

  const updateGrade = useMutation({
    mutationFn: async () => {
      if (!resultToEdit) throw new Error('No grade selected for update.');

      const payload: CourseResultInput = {
        enrollmentId: resultToEdit.enrollmentId,
        gradeType: gradeForm.gradeType,
        numericGrade: gradeForm.gradeType === 'NUMERIC' && gradeForm.numericGrade ? Number(gradeForm.numericGrade) : undefined,
        letterGrade: gradeForm.gradeType === 'LETTER' ? gradeForm.letterGrade || undefined : undefined,
        courseWorkGrade: gradeForm.courseWorkGrade ? Number(gradeForm.courseWorkGrade) : undefined,
        examGrade: gradeForm.examGrade ? Number(gradeForm.examGrade) : undefined,
        remarks: gradeForm.remarks || undefined,
        comments: gradeForm.comments || undefined,
      };

      const { data } = await domainService.courseResults.update(resultToEdit.id, payload);
      return data;
    },
    onSuccess: (data) => {
      if (data?.response?.id === 1) {
        setFeedback({ type: 'success', message: data?.response.message ?? 'Grade updated successfully' });
        closeEditModal();
        queryClient.invalidateQueries({ queryKey: [RESULTS_QUERY_KEY] });
      } else {
        setFeedback({ type: 'error', message: data?.response.message ?? 'Update failed' });
      }
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: getErrorMessage(error, 'Failed to update grade') });
    },
  });

  // Filter Handlers
  const handleEnrollmentFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setEnrollmentFilters((prev) => ({
      ...prev,
      pageNumber: 1,
      semester: (formData.get('semester') as string) || undefined,
      academicYear: (formData.get('academicYear') as string) || undefined,
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

  if (lecturerQuery.isLoading) return <Spinner label="Loading lecturer information..." />;
  if (lecturerQuery.isError || !lecturer) return <EmptyState title="No lecturer profile found" description="Contact an administrator." />;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-gray-900">Grade Management</h1>
        <p className="text-sm text-gray-500">Submit course results, update records, and verify blockchain integrity.</p>
      </header>

      {feedback && (
        <div className={`rounded-md border px-4 py-3 text-sm ${feedback.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {feedback.message}
        </div>
      )}

      {/* ---------------- ACTIVE ENROLLMENTS TABLE ---------------- */}
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
            <Button type="submit" className="w-full md:w-auto">Apply filters</Button>
            <Button type="button" variant="outline" className="w-full md:w-auto" onClick={(e) => { e.currentTarget.form?.reset(); setEnrollmentFilters({ pageNumber: 1, itemsPerPage: 10 }); }}>Reset</Button>
          </div>
        </form>

        <div className="rounded-lg border border-gray-100">
          {enrollmentsQuery.isError ? (
            <EmptyState title="Failed to load enrollments" description="Try refreshing." actionLabel="Try again" onAction={() => enrollmentsQuery.refetch()} />
          ) : enrollmentsQuery.isFetching ? (
            <Spinner label="Loading enrollments..." />
          ) : enrollments.length === 0 ? (
            <EmptyState title="No enrollments" description="No students assigned." />
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
                  {enrollments.map((enrollment) => {
                    const existingResult = resultsByEnrollmentId.get(enrollment.id);
                    return (
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
                        <TableCell className="text-right">
                          <div className="flex justify-end items-center gap-3">
                            {existingResult ? (
                              <>
                                <div className="flex flex-col items-end mr-2">
                                  <span className="font-bold text-gray-900">
                                    {existingResult.gradeType === 'NUMERIC' ? existingResult.numericGrade :
                                      existingResult.gradeType === 'LETTER' ? existingResult.letterGrade : 'Pass/Fail'}
                                  </span>
                                  <Badge variant={existingResult.status === 'VALID' ? 'success' : existingResult.status === 'PENDING' ? 'secondary' : 'warning'} className="mt-0.5">
                                    {existingResult.status}
                                  </Badge>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-amber-500 text-amber-700 hover:bg-amber-50"
                                  onClick={() => openEditModal(existingResult)}
                                >
                                  Update
                                </Button>
                              </>
                            ) : (
                              <Button size="sm" onClick={() => openGradeModal(enrollment)}>Record grade</Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
        <Pagination page={enrollmentsQuery.data?.page} onPageChange={(p) => setEnrollmentFilters((prev) => ({ ...prev, pageNumber: p }))} isLoading={enrollmentsQuery.isFetching} />
      </section>

      {/* ---------------- SUBMITTED GRADES TABLE ---------------- */}
      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Submitted Grades History</h2>
          <Button variant="outline" onClick={() => courseResultsQuery.refetch()} disabled={courseResultsQuery.isFetching}>
            Refresh
          </Button>
        </div>

        <form className="grid gap-4 md:grid-cols-3" onSubmit={handleResultFilters}>
          <select name="status" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="OFFICIAL">Official</option>
            <option value="DISPUTED">Disputed</option>
          </select>
          <div className="flex items-center gap-2 md:col-span-2">
            <Button type="submit" className="w-full md:w-auto">Apply filters</Button>
            <Button type="button" variant="outline" className="w-full md:w-auto" onClick={(e) => { e.currentTarget.form?.reset(); setResultFilters({ pageNumber: 1, itemsPerPage: 10 }); }}>Reset</Button>
          </div>
        </form>

        <div className="rounded-lg border border-gray-100">
          {courseResultsQuery.isError ? (
            <EmptyState title="Error" description="Failed to load history." />
          ) : results.length === 0 ? (
            <EmptyState title="No grades submitted" description="Grades you submit will appear here." />
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
                        {result.gradeType === 'NUMERIC' ? result.numericGrade : result.gradeType === 'LETTER' ? result.letterGrade : 'Pass/Fail'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={result.status === 'VALID' ? 'success' : result.status === 'PENDING' ? 'secondary' : 'warning'}>
                          {result.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDateTime(result.submittedAt)}</TableCell>
                      <TableCell className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openVerifyModal(result)}>
                          Details & Audit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
        <Pagination page={courseResultsQuery.data?.page} onPageChange={(p) => setResultFilters((prev) => ({ ...prev, pageNumber: p }))} isLoading={courseResultsQuery.isFetching} />
      </section>

      {/* ---------------- MODALS ---------------- */}

      {/* 1. Innovative Audit Modal */}
      <GradeVerificationModal
        isOpen={isVerifyModalOpen}
        result={selectedResult}
        onClose={() => setIsVerifyModalOpen(false)}
      />

      {/* 2. Submit Grade Modal */}
      <Modal
        title="Submit grade"
        description={selectedEnrollment ? `Record results for ${selectedEnrollment.courseCode}` : 'Select an enrollment.'}
        isOpen={isGradeModalOpen}
        onClose={() => { setIsGradeModalOpen(false); resetFormState(); }}
        footer={
          <>
            <Button variant="outline" onClick={() => { setIsGradeModalOpen(false); resetFormState(); }}>Cancel</Button>
            <Button onClick={() => submitGrade.mutate()} disabled={submitGrade.isPending || !selectedEnrollment}>
              {submitGrade.isPending ? 'Submitting...' : 'Submit grade'}
            </Button>
          </>
        }
      >
        {selectedEnrollment && (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-700">Grade type</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={gradeForm.gradeType}
                onChange={(e) => setGradeForm(prev => ({ ...prev, gradeType: e.target.value as any }))}
              >
                {GRADE_TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            {gradeForm.gradeType === 'NUMERIC' && (
              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">Numeric grade</label>
                <Input type="number" min="0" max="100" value={gradeForm.numericGrade} onChange={(e) => setGradeForm(prev => ({ ...prev, numericGrade: e.target.value }))} required />
              </div>
            )}
            {gradeForm.gradeType === 'LETTER' && (
              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">Letter grade</label>
                <Input value={gradeForm.letterGrade} onChange={(e) => setGradeForm(prev => ({ ...prev, letterGrade: e.target.value }))} required />
              </div>
            )}
            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-700">Remarks</label>
              <textarea
                className="min-h-[100px] w-full rounded-md border border-input px-3 py-2 text-sm"
                value={gradeForm.remarks}
                onChange={(e) => setGradeForm(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Optional remarks"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* 3. Update Grade Modal */}
      <Modal
        title="Update grade"
        description={resultToEdit ? `Modify results for ${resultToEdit.studentName}` : ''}
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        footer={
          <>
            <Button variant="outline" onClick={closeEditModal}>Cancel</Button>
            <Button onClick={() => updateGrade.mutate()} disabled={updateGrade.isPending || !resultToEdit}>
              {updateGrade.isPending ? 'Updating...' : 'Update Grade'}
            </Button>
          </>
        }
      >
        {resultToEdit && (
          <div className="grid gap-4">
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
              <strong>Note:</strong> Updating this grade will reset its verification status to PENDING and create a new blockchain record.
            </div>
            {/* Same form fields as Submit, plus Comments */}
            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-700">Grade type</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={gradeForm.gradeType}
                onChange={(e) => setGradeForm(prev => ({ ...prev, gradeType: e.target.value as any }))}
              >
                {GRADE_TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            {gradeForm.gradeType === 'NUMERIC' && (
              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">Numeric grade</label>
                <Input type="number" min="0" max="100" value={gradeForm.numericGrade} onChange={(e) => setGradeForm(prev => ({ ...prev, numericGrade: e.target.value }))} required />
              </div>
            )}
            {gradeForm.gradeType === 'LETTER' && (
              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">Letter grade</label>
                <Input value={gradeForm.letterGrade} onChange={(e) => setGradeForm(prev => ({ ...prev, letterGrade: e.target.value }))} required />
              </div>
            )}
            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-700">Update Reason (Comments)</label>
              <textarea
                className="min-h-[100px] w-full rounded-md border border-input px-3 py-2 text-sm"
                value={gradeForm.comments}
                onChange={(e) => setGradeForm(prev => ({ ...prev, comments: e.target.value }))}
                placeholder="Reason for change..."
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}