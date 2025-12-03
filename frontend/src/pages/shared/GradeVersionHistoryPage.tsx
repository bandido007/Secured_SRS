import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { domainService } from '../../services/api/domainService';
import type { GradeVersionHistory, GradeVersion } from '../../types';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, History } from 'lucide-react';

export function GradeVersionHistoryPage() {
  const { gradeId } = useParams<{ gradeId: string }>();
  const navigate = useNavigate();
  const [selectedVersion, setSelectedVersion] = useState<GradeVersion | null>(null);

  const historyQuery = useQuery({
    queryKey: ['grade-version-history', gradeId],
    queryFn: async () => {
      const { data } = await domainService.courseResults.versionHistory(Number(gradeId));
      return data.data as GradeVersionHistory;
    },
    enabled: Boolean(gradeId),
  });

  const history = historyQuery.data;

  if (historyQuery.isLoading) {
    return <Spinner label="Loading version history..." />;
  }

  if (historyQuery.isError || !history) {
    return (
      <EmptyState
        title="Failed to load version history"
        description="Could not retrieve grade history. Please try again."
        actionLabel="Go Back"
        onAction={() => navigate(-1)}
      />
    );
  }

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'CREATE':
        return 'bg-blue-100 text-blue-700';
      case 'UPDATE':
        return 'bg-amber-100 text-amber-700';
      case 'VERIFY':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Grade Version History</h1>
            <p className="text-sm text-gray-500">
              Complete audit trail with blockchain verification
            </p>
          </div>
        </div>
        <Badge variant={history.currentVersion.verification.status === 'VERIFIED' ? 'success' : 'warning'}>
          {history.currentVersion.verification.status}
        </Badge>
      </div>

      {/* Grade Metadata Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="text-xs font-medium text-gray-500">Student</div>
            <div className="mt-1 font-semibold">{history.metadata.studentNumber}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500">Course</div>
            <div className="mt-1 font-semibold">{history.metadata.courseCode}</div>
            <div className="text-xs text-gray-500">{history.metadata.courseName}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500">Status</div>
            <div className="mt-1">
              <Badge
                variant={
                  history.metadata.currentStatus === 'OFFICIAL'
                    ? 'success'
                    : history.metadata.currentStatus === 'PENDING'
                      ? 'secondary'
                      : 'warning'
                }
              >
                {history.metadata.currentStatus}
              </Badge>
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500">Total Updates</div>
            <div className="mt-1 font-semibold text-lg">{history.metadata.totalUpdates}</div>
          </div>
        </div>
      </div>

      {/* Blockchain Verification Status */}
      <div
        className={`rounded-xl border p-4 ${
          history.currentVersion.verification.hashesMatch
            ? 'border-green-200 bg-green-50'
            : 'border-red-200 bg-red-50'
        }`}
      >
        <div className="flex items-start gap-3">
          {history.currentVersion.verification.hashesMatch ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
          <div className="flex-1">
            <div className="font-semibold">
              {history.currentVersion.verification.hashesMatch
                ? 'Blockchain Integrity Verified'
                : 'Blockchain Mismatch Detected'}
            </div>
            <div className="mt-1 text-sm">
              {history.currentVersion.verification.hashesMatch ? (
                <p className="text-green-700">
                  Database and blockchain records match perfectly. No tampering detected.
                </p>
              ) : (
                <p className="text-red-700">
                  Database and blockchain hashes don't match. This may indicate tampering or sync issues.
                </p>
              )}
            </div>
            <div className="mt-2 grid gap-1 text-xs font-mono">
              <div className="text-gray-600">
                DB Hash: <span className="text-gray-900">{history.currentVersion.verification.databaseHash}</span>
              </div>
              <div className="text-gray-600">
                BC Hash: <span className="text-gray-900">{history.currentVersion.verification.blockchainHash}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Version Timeline */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Version Timeline</h2>
            <Badge variant="secondary">{history.totalVersions} versions</Badge>
          </div>
        </div>

        <div className="p-4">
          <div className="space-y-4">
            {history.versionHistory.map((version, index) => (
              <div
                key={version.transactionId}
                className={`relative rounded-lg border p-4 transition-all ${
                  selectedVersion?.transactionId === version.transactionId
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {/* Timeline connector */}
                {index < history.versionHistory.length - 1 && (
                  <div className="absolute left-8 top-16 h-full w-0.5 bg-gray-200" />
                )}

                <div className="flex gap-4">
                  {/* Version number badge */}
                  <div className="relative flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border-2 border-gray-200 font-bold text-gray-900">
                      v{version.versionNumber}
                    </div>
                  </div>

                  {/* Version details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getTransactionTypeColor(version.transactionType)}`}>
                            {version.transactionType}
                          </span>
                          <span className="text-sm text-gray-500">{new Date(version.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                          By: <span className="font-medium">{version.performedBy.username}</span>
                          {version.performedBy.lecturerId && (
                            <span className="text-gray-400"> ({version.performedBy.lecturerId})</span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setSelectedVersion(selectedVersion?.transactionId === version.transactionId ? null : version)
                        }
                      >
                        {selectedVersion?.transactionId === version.transactionId ? 'Hide Details' : 'View Details'}
                      </Button>
                    </div>

                    {/* Transaction IDs */}
                    <div className="mt-2 space-y-1 text-xs font-mono">
                      <div className="text-gray-600">
                        TX: <span className="text-gray-900">{version.transactionId}</span>
                      </div>
                      <div className="text-gray-600">
                        Hash: <span className="text-gray-900">{version.blockchainHash.substring(0, 32)}...</span>
                      </div>
                      {version.previousHash && (
                        <div className="text-gray-600">
                          Prev: <span className="text-gray-900">{version.previousHash.substring(0, 32)}...</span>
                        </div>
                      )}
                    </div>

                    {/* Expanded details */}
                    {selectedVersion?.transactionId === version.transactionId && version.metadata && (
                      <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <div className="text-sm font-semibold text-gray-900 mb-3">Changes Made:</div>
                        
                        {version.metadata.updateReason && (
                          <div className="mb-3 rounded bg-amber-100 p-2 text-sm">
                            <div className="font-medium text-amber-900">Reason:</div>
                            <div className="text-amber-700">{version.metadata.updateReason}</div>
                          </div>
                        )}

                        {version.metadata.changes && version.metadata.changes.length > 0 ? (
                          <div className="space-y-2">
                            {version.metadata.changes.map((change, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm">
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                <span className="font-medium text-gray-900">{change.field}:</span>
                                <span className="text-red-600">{String(change.from)}</span>
                                <span className="text-gray-400">→</span>
                                <span className="text-green-600">{String(change.to)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">No detailed changes available</div>
                        )}

                        {/* Old vs New Values Table */}
                        {version.metadata.oldValues && version.metadata.newValues && (
                          <div className="mt-4">
                            <div className="text-sm font-semibold text-gray-900 mb-2">Complete Comparison:</div>
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-sm">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">Field</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">Old Value</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">New Value</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  <tr>
                                    <td className="px-3 py-2 font-medium">Grade Type</td>
                                    <td className="px-3 py-2">{version.metadata.oldValues.gradeType}</td>
                                    <td className="px-3 py-2">{version.metadata.newValues.gradeType}</td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-medium">Numeric Grade</td>
                                    <td className="px-3 py-2">{version.metadata.oldValues.numericGrade ?? '—'}</td>
                                    <td className="px-3 py-2">{version.metadata.newValues.numericGrade ?? '—'}</td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-medium">Coursework</td>
                                    <td className="px-3 py-2">{version.metadata.oldValues.courseWorkGrade ?? '—'}</td>
                                    <td className="px-3 py-2">{version.metadata.newValues.courseWorkGrade ?? '—'}</td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-medium">Exam</td>
                                    <td className="px-3 py-2">{version.metadata.oldValues.examGrade ?? '—'}</td>
                                    <td className="px-3 py-2">{version.metadata.newValues.examGrade ?? '—'}</td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-medium">Status</td>
                                    <td className="px-3 py-2">{version.metadata.oldValues.status}</td>
                                    <td className="px-3 py-2">{version.metadata.newValues.status}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
