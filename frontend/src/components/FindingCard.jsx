import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Check, 
  X, 
  Edit3, 
  ExternalLink, 
  AlertCircle, 
  Sparkles, 
  Cpu, 
  CheckCircle2, 
  XCircle,
  HelpCircle,
  Flame
} from './icons';
import { useRole } from '../context/RoleContext';

export default function FindingCard({ 
  finding, 
  onAccept, 
  onDismiss, 
  onOpenClause, 
  onHighlight, 
  isActive 
}) {
  const { role } = useRole();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [isDismissing, setIsDismissing] = useState(false);
  const [dismissReason, setDismissReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const canAction = role === 'creator' || role === 'manager' || role === 'admin';

  const severityColors = {
    high: 'bg-rose-100 text-rose-800 border-rose-200',
    medium: 'bg-amber-100 text-amber-800 border-amber-200',
    low: 'bg-sky-100 text-sky-800 border-sky-200',
  };

  const categoryLabels = {
    voice: 'Brand Voice',
    terminology: 'Approved Terminology',
    claim: 'Fact & Claim Policy',
    accessibility: 'Plain Language',
    tone: 'Tone & Messaging',
  };

  const handleStartEdit = () => {
    // Default edit text from suggestion or matched text
    setEditText(finding.matched_text || '');
    setIsEditing(true);
  };

  const handleConfirmEdit = async () => {
    if (!editText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await onAccept(finding.id, editText.trim());
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAccept = async () => {
    setLoading(true);
    setError(null);
    try {
      await onAccept(finding.id, null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDismiss = async () => {
    if (!dismissReason.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await onDismiss(finding.id, dismissReason.trim());
      setIsDismissing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isResolved = finding.status === 'accepted' || finding.status === 'dismissed';

  return (
    <div
      onMouseEnter={onHighlight}
      className={`rounded-xl border transition-all duration-200 overflow-hidden bg-white ${
        isActive 
          ? 'ring-2 ring-emerald-500 shadow-md border-emerald-300' 
          : 'border-slate-200 shadow-xs hover:border-slate-300'
      } ${isResolved ? 'opacity-70 bg-slate-50/70' : ''}`}
    >
      {/* Header bar */}
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Category */}
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {categoryLabels[finding.category] || finding.category}
          </span>

          {/* Severity badge */}
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${severityColors[finding.severity] || severityColors.medium}`}>
            {finding.severity.toUpperCase()}
          </span>

          {/* AI vs Rule badge */}
          {finding.is_ai_assisted ? (
            <span className="flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              <Sparkles className="w-3 h-3 mr-1 text-purple-500" />
              AI-assisted
            </span>
          ) : (
            <span className="flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              <Cpu className="w-3 h-3 mr-1 text-slate-500" />
              Rule-based
            </span>
          )}
        </div>

        {/* Confidence & Status */}
        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-slate-500 font-mono">
            {Math.round(finding.confidence * 100)}% conf.
          </span>

          {finding.status === 'accepted' && (
            <span className="flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Accepted
            </span>
          )}
          {finding.status === 'dismissed' && (
            <span className="flex items-center text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              <XCircle className="w-3.5 h-3.5 mr-1" />
              Dismissed
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-3.5">
        {error && (
          <div className="text-xs bg-red-50 text-red-700 p-2.5 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {/* Plain language reason */}
        <p className="text-sm text-slate-800 font-medium leading-relaxed">
          {finding.reason}
        </p>

        {/* Source quote with clause link */}
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/80 text-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Exact Source Quote</span>
            <button
              onClick={() => onOpenClause(finding.clause_code)}
              className="flex items-center space-x-1 font-mono font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
              title="Click to view full approved guideline clause"
            >
              <span>Clause {finding.clause_code}</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
          <p className="text-slate-700 italic font-serif">
            "{finding.source_quote}"
          </p>
        </div>

        {/* Suggestion engine output */}
        {finding.suggestion && (
          <div className="bg-emerald-50/50 rounded-lg p-3 border border-emerald-100 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-emerald-900 text-[11px] flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Suggested Fix (Never auto-applied)
              </span>

              {finding.suggestion_drift_flag && (
                <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded">
                  ⚠️ Possible meaning change
                </span>
              )}
            </div>
            <p className="text-slate-700 font-sans">
              {finding.suggestion}
            </p>
          </div>
        )}

        {/* Dismissed reason view */}
        {finding.status === 'dismissed' && finding.dismissed_reason && (
          <div className="bg-slate-100 rounded-lg p-2.5 text-xs text-slate-600 border border-slate-200">
            <span className="font-semibold text-slate-700 block mb-0.5">Dismissal Reason:</span>
            {finding.dismissed_reason}
          </div>
        )}

        {/* Edit Form */}
        {isEditing && (
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              Edit text in draft to replace "{finding.matched_text}":
            </label>
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              placeholder="Enter replacement phrasing..."
              className="w-full text-xs p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
            <div className="flex justify-end space-x-2 pt-1">
              <button
                onClick={() => setIsEditing(false)}
                className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                disabled={loading}
                onClick={handleConfirmEdit}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded transition-colors"
              >
                {loading ? 'Applying...' : 'Apply & Create Version'}
              </button>
            </div>
          </div>
        )}

        {/* Dismiss Form */}
        {isDismissing && (
          <div className="bg-rose-50/50 p-3 rounded-lg border border-rose-200 space-y-2">
            <label className="text-xs font-semibold text-rose-900 block">
              Reason for dismissing (required):
            </label>
            <textarea
              value={dismissReason}
              onChange={(e) => setDismissReason(e.target.value)}
              placeholder="e.g. Approved by legal exception, intentional campaign style..."
              rows={2}
              className="w-full text-xs p-2 border border-rose-300 rounded focus:ring-1 focus:ring-rose-500 focus:outline-none"
            />
            <div className="flex justify-end space-x-2 pt-1">
              <button
                onClick={() => setIsDismissing(false)}
                className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                disabled={loading || dismissReason.trim().length < 5}
                onClick={handleConfirmDismiss}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-medium rounded transition-colors"
              >
                {loading ? 'Dismissing...' : 'Confirm Dismissal'}
              </button>
            </div>
          </div>
        )}

        {/* Actions Bar (Only if Open & User has permission) */}
        {!isResolved && !isEditing && !isDismissing && canAction && (
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => setIsDismissing(true)}
              className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
            >
              <X className="w-3.5 h-3.5" />
              <span>Dismiss</span>
            </button>

            <button
              onClick={handleStartEdit}
              className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit then accept</span>
            </button>

            <button
              disabled={loading}
              onClick={handleQuickAccept}
              className="flex items-center space-x-1 px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Accept</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
