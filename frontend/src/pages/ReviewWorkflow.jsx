import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  MessageSquare, 
  History, 
  Send, 
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  GitCommit,
  UserCheck
} from '../components/icons';
import { api } from '../api';
import { useRole } from '../context/RoleContext';
import DiffViewer from '../components/DiffViewer';
import AuditLogView from '../components/AuditLogView';

export default function ReviewWorkflow() {
  const { id } = useParams();
  const { role } = useRole();

  const [submission, setSubmission] = useState(null);
  const [findings, setFindings] = useState([]);
  const [comments, setComments] = useState([]);
  const [versions, setVersions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Workflow modals & inputs
  const [newComment, setNewComment] = useState('');
  const [requestChangesComment, setRequestChangesComment] = useState('');
  const [showChangesModal, setShowChangesModal] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  
  // Version diff selector
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      const [subData, findData, commData, verData, auditData] = await Promise.all([
        api.get(`/api/submissions/${id}`),
        api.get(`/api/findings/submission/${id}`),
        api.get(`/api/review/${id}/comments`),
        api.get(`/api/review/${id}/versions`),
        api.get(`/api/review/${id}/audit`),
      ]);
      setSubmission(subData);
      setFindings(findData);
      setComments(commData);
      setVersions(verData);
      setAuditLogs(auditData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const highSeverityOpen = findings.filter(
    (f) => f.status === 'open' && f.severity === 'high'
  );

  const handleApprove = async () => {
    // If high severity findings are open, trigger override modal
    if (highSeverityOpen.length > 0 && !overrideReason.trim()) {
      setShowOverrideModal(true);
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      await api.post(`/api/review/${id}/status`, {
        status: 'approved',
        override_reason: overrideReason.trim() || undefined,
      });
      setShowOverrideModal(false);
      setOverrideReason('');
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!requestChangesComment.trim()) {
      setError('A comment explaining the requested changes is required.');
      return;
    }
    setActionLoading(true);
    setError(null);
    try {
      await api.post(`/api/review/${id}/status`, {
        status: 'needs_changes',
        comment: requestChangesComment.trim(),
      });
      setShowChangesModal(false);
      setRequestChangesComment('');
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm('Are you sure you want to reject this draft?')) return;
    setActionLoading(true);
    setError(null);
    try {
      await api.post(`/api/review/${id}/status`, { status: 'rejected' });
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setActionLoading(true);
    try {
      await api.post(`/api/review/${id}/comments`, { text: newComment.trim() });
      setNewComment('');
      const updatedComments = await api.get(`/api/review/${id}/comments`);
      setComments(updatedComments);
      const updatedAudit = await api.get(`/api/review/${id}/audit`);
      setAuditLogs(updatedAudit);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-500">
        Loading review workflow and audit data...
      </div>
    );
  }

  const canReview = role === 'reviewer' || role === 'manager' || role === 'admin';
  const isPendingReview = submission?.status === 'in_review';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <Link
            to={`/submissions/${id}/findings`}
            className="inline-flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800 transition-colors mb-1"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Back to Findings & Evidence Gate</span>
          </Link>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {submission.title}
            </h1>
            <span className="text-xs uppercase font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-white">
              {submission.status.replace('_', ' ')}
            </span>
            <span className="text-xs font-mono text-slate-500">
              Current: Version {submission.version}
            </span>
          </div>
        </div>

        {/* Review Action Buttons */}
        {canReview && isPendingReview && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowChangesModal(true)}
              disabled={actionLoading}
              className="flex items-center space-x-1 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Request Changes</span>
            </button>

            <button
              onClick={handleReject}
              disabled={actionLoading}
              className="flex items-center space-x-1 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg border border-rose-200 transition-colors cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Reject</span>
            </button>

            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="flex items-center space-x-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Approve Publication</span>
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-800">
          {error}
        </div>
      )}

      {/* Review Gate Notice */}
      {highSeverityOpen.length > 0 && isPendingReview && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start space-x-3 text-xs text-rose-800">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">
              Governance Gate: {highSeverityOpen.length} unresolved high-severity finding(s) block standard approval.
            </span>
            <p className="text-rose-700">
              Reviewers or Managers attempting to approve must record an explicit <strong>Approval Override Reason</strong>, 
              which will be permanently recorded in the immutable audit log.
            </p>
          </div>
        </div>
      )}

      {/* Main Review Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Col: Version Diff & Content History */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <GitCommit className="w-4 h-4 text-slate-500" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  Version History & Text Diff
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                {versions.length} recorded version(s)
              </span>
            </div>

            {/* Version Selectors */}
            {versions.length > 1 ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-xs text-slate-600">
                  <span>Comparing:</span>
                  <select
                    value={selectedVersionIndex}
                    onChange={(e) => setSelectedVersionIndex(Number(e.target.value))}
                    className="p-1 border border-slate-300 rounded text-xs bg-white"
                  >
                    {versions.slice(0, -1).map((v, i) => (
                      <option key={v.id} value={i}>
                        Version {v.version} ({v.created_by_role})
                      </option>
                    ))}
                  </select>
                  <span>against</span>
                  <strong className="font-mono">Current Version {submission.version}</strong>
                </div>

                <DiffViewer
                  oldText={versions[selectedVersionIndex]?.content_text || ''}
                  newText={submission.content_text}
                  oldLabel={`v${versions[selectedVersionIndex]?.version}`}
                  newLabel={`v${submission.version}`}
                />
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600 leading-relaxed font-serif">
                "{submission.content_text}"
              </div>
            )}
          </div>

          {/* Audit Log */}
          <AuditLogView logs={auditLogs} />
        </div>

        {/* Right Col: Editorial Comments & Review Log */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <MessageSquare className="w-4 h-4 text-slate-500" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                Editorial Comments ({comments.length})
              </h3>
            </div>

            {/* Comments List */}
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {comments.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No editorial comments posted yet.
                </div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="font-bold text-slate-800 capitalize">
                        {c.author_role}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(c.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-700 font-sans">{c.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Form */}
            {canReview && (
              <form onSubmit={handleAddComment} className="pt-2 border-t border-slate-100 space-y-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={`Add a comment as ${role}...`}
                  rows={2}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 focus:outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={actionLoading || !newComment.trim()}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>Post Comment</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Override Reason Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 p-6 space-y-4">
            <div className="flex items-center space-x-2 text-amber-600">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900">High-Severity Approval Override</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              There are still <strong className="text-rose-600">{highSeverityOpen.length} unresolved high-severity finding(s)</strong>. 
              To proceed with publication approval, you must record a mandatory justification for the audit trail:
            </p>
            <textarea
              required
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="e.g. Legal counsel explicitly permitted the superlative claim on 10/24; shipping policy exception granted..."
              rows={3}
              className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowOverrideModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading || overrideReason.trim().length < 5}
                onClick={handleApprove}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors"
              >
                {actionLoading ? 'Recording...' : 'Confirm & Approve Override'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Changes Modal */}
      {showChangesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 p-6 space-y-4">
            <div className="flex items-center space-x-2 text-slate-900">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-base">Request Changes</h3>
            </div>
            <p className="text-xs text-slate-600">
              A detailed comment explaining what changes the creator needs to make is required:
            </p>
            <textarea
              required
              value={requestChangesComment}
              onChange={(e) => setRequestChangesComment(e.target.value)}
              placeholder="Specify the adjustments needed before publication..."
              rows={3}
              className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 focus:outline-none"
            />
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowChangesModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading || requestChangesComment.trim().length < 3}
                onClick={handleRequestChanges}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-lg transition-colors"
              >
                {actionLoading ? 'Submitting...' : 'Submit Change Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
