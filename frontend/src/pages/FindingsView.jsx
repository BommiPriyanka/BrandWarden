import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  ArrowRight, 
  RotateCcw, 
  Send, 
  AlertCircle, 
  CheckCircle, 
  Filter, 
  Layers, 
  History,
  FileText,
  UserCheck
} from '../components/icons';
import { api } from '../api';
import { useRole } from '../context/RoleContext';
import TransparencyPanel from '../components/TransparencyPanel';
import FindingCard from '../components/FindingCard';
import ClauseModal from '../components/ClauseModal';

export default function FindingsView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useRole();

  const [submission, setSubmission] = useState(null);
  const [findings, setFindings] = useState([]);
  const [transparency, setTransparency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedClauseCode, setSelectedClauseCode] = useState(null);
  const [activeFindingId, setActiveFindingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // all, open, resolved
  const [error, setError] = useState(null);

  const loadData = async (subId) => {
    try {
      const [subData, findingsData] = await Promise.all([
        api.get(`/api/submissions/${subId}`),
        api.get(`/api/findings/submission/${subId}`),
      ]);
      setSubmission(subData);
      setFindings(findingsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(id);
  }, [id]);

  const handleReanalyze = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const result = await api.post(`/api/analysis/${id}`);
      setFindings(result.findings);
      setTransparency(result.transparency);
      // reload submission to catch version updates
      const updatedSub = await api.get(`/api/submissions/${id}`);
      setSubmission(updatedSub);
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAcceptFinding = async (findingId, editedText) => {
    const updated = await api.post(`/api/findings/${findingId}/accept`, {
      edited_text: editedText,
    });
    setFindings((prev) => prev.map((f) => (f.id === findingId ? updated : f)));
    // If edited, reload submission for latest text & version
    if (editedText) {
      const updatedSub = await api.get(`/api/submissions/${id}`);
      setSubmission(updatedSub);
    }
  };

  const handleDismissFinding = async (findingId, reason) => {
    const updated = await api.post(`/api/findings/${findingId}/dismiss`, { reason });
    setFindings((prev) => prev.map((f) => (f.id === findingId ? updated : f)));
  };

  const handleSubmitForReview = async () => {
    try {
      await api.post(`/api/review/${id}/status`, { status: 'in_review' });
      navigate(`/submissions/${id}/review`);
    } catch (err) {
      alert(`Could not submit for review: ${err.message}`);
    }
  };

  // Filtered findings
  const filteredFindings = useMemo(() => {
    if (statusFilter === 'open') return findings.filter((f) => f.status === 'open');
    if (statusFilter === 'resolved') return findings.filter((f) => f.status !== 'open');
    return findings;
  }, [findings, statusFilter]);

  const openFindingsCount = findings.filter((f) => f.status === 'open').length;
  const highSeverityOpenCount = findings.filter(
    (f) => f.status === 'open' && f.severity === 'high'
  ).length;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-500">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading draft and evidence-gate findings...
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-slate-900">Submission not found</h2>
        <Link to="/" className="text-xs text-emerald-600 hover:underline mt-2 inline-block">
          Return to home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Breadcrumb & Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {submission.title}
            </h1>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-150 text-slate-700 border border-slate-200">
              v{submission.version}
            </span>
            <span className="text-xs uppercase font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {submission.status.replace('_', ' ')}
            </span>
          </div>
          <div className="text-xs text-slate-500">
            Intended Message: <strong className="text-slate-700">{submission.intended_message}</strong>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleReanalyze}
            disabled={analyzing}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
            <span>Re-run Pipeline</span>
          </button>

          <Link
            to={`/submissions/${id}/review`}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <span>Review Workflow</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {(role === 'creator' || role === 'manager' || role === 'admin') && submission.status === 'draft' && (
            <button
              onClick={handleSubmitForReview}
              className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit for Review</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-800">
          {error}
        </div>
      )}

      {/* Transparency Panel */}
      <TransparencyPanel transparency={transparency || {
        total_candidates: findings.length,
        discarded_by_evidence_gate: 0,
        shown_findings: findings.length,
        checks_run: ['rule_engine', 'claim_check'],
        ai_used: false,
        ai_status: 'ai_unavailable'
      }} />

      {/* Main Split View: Left Content & Spans, Right Findings Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane: Content Text with Visual Spans */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4 sticky top-20">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                Draft Content (v{submission.version})
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {submission.content_text.split(/\s+/).length} words
            </span>
          </div>

          {/* Interactive highlighted text */}
          <div className="text-sm font-serif leading-relaxed text-slate-800 p-4 bg-slate-50/50 rounded-lg border border-slate-100 whitespace-pre-wrap">
            {submission.content_text}
          </div>

          <div className="text-[11px] text-slate-500 bg-emerald-50/60 p-3 rounded-lg border border-emerald-100/80">
            <div className="font-semibold text-emerald-900 mb-0.5">Evidence-Verified Copy</div>
            Accepting an edit replaces the text in your draft and increments the version counter automatically.
          </div>
        </div>

        {/* Right Pane: Finding Cards */}
        <div className="lg:col-span-7 space-y-4">
          {/* Filter Bar */}
          <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-slate-200">
            <div className="flex items-center space-x-1.5 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <span className="font-medium">Filter:</span>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                  statusFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                All ({findings.length})
              </button>
              <button
                onClick={() => setStatusFilter('open')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                  statusFilter === 'open'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Open ({openFindingsCount})
              </button>
              <button
                onClick={() => setStatusFilter('resolved')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                  statusFilter === 'resolved'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Resolved ({findings.length - openFindingsCount})
              </button>
            </div>

            {highSeverityOpenCount > 0 && (
              <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                {highSeverityOpenCount} blocking review
              </span>
            )}
          </div>

          {/* Cards List */}
          {filteredFindings.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              No findings match current filter.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFindings.map((finding) => (
                <FindingCard
                  key={finding.id}
                  finding={finding}
                  isActive={activeFindingId === finding.id}
                  onHighlight={() => setActiveFindingId(finding.id)}
                  onOpenClause={(code) => setSelectedClauseCode(code)}
                  onAccept={handleAcceptFinding}
                  onDismiss={handleDismissFinding}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Clause Modal */}
      {selectedClauseCode && (
        <ClauseModal
          code={selectedClauseCode}
          onClose={() => setSelectedClauseCode(null)}
        />
      )}
    </div>
  );
}
