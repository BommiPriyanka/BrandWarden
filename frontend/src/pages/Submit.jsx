import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  Send, 
  AlertCircle, 
  Info,
  CheckCircle2,
  FileCheck
} from '../components/icons';
import { api } from '../api';
import { useRole } from '../context/RoleContext';

export default function Submit() {
  const navigate = useNavigate();
  const { role } = useRole();
  const [title, setTitle] = useState('');
  const [contentText, setContentText] = useState('');
  const [intendedMessage, setIntendedMessage] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const canSubmit = role === 'creator' || role === 'manager' || role === 'admin';

  const handleLoadSample = async () => {
    try {
      const sample = await api.get('/api/submissions/sample-draft');
      setTitle(sample.title);
      setContentText(sample.content_text);
      setIntendedMessage(sample.intended_message);
      setFile(null);
      setError(null);
    } catch (err) {
      setError(`Failed to load sample: ${err.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contentText.trim() && !file) {
      setError('Please provide draft text or upload a DOCX/TXT file.');
      return;
    }
    if (!intendedMessage.trim()) {
      setError('Intended message is required (needed for brand tone and intent-drift checking).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let sub;
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title.trim() || file.name);
        formData.append('intended_message', intendedMessage.trim());
        sub = await api.post('/api/submissions/upload', formData);
      } else {
        sub = await api.post('/api/submissions', {
          title: title.trim() || 'Untitled Draft',
          content_text: contentText.trim(),
          intended_message: intendedMessage.trim(),
        });
      }

      // Immediately run analysis pipeline
      await api.post(`/api/analysis/${sub.id}`);

      // Direct to findings
      navigate(`/submissions/${sub.id}/findings`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Title & Helper */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Submit Content for Brand Governance
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Checked against Northwind Outdoor brand voice, claims policy, and approved facts.
          </p>
        </div>

        {/* Load Sample Button */}
        <button
          type="button"
          onClick={handleLoadSample}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200 transition-colors shadow-2xs"
        >
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Load Northwind Sample Draft</span>
        </button>
      </div>

      {!canSubmit && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Current role <strong className="font-semibold uppercase">[{role}]</strong> cannot create submissions. 
            Use the top-right role switcher to switch to <strong>Creator</strong> or <strong>Manager</strong>.
          </span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-800 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
        {/* Title */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Campaign / Piece Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Northwind Autumn Jacket Campaign Draft"
            className="w-full text-sm p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Content text or file */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Content Draft (Paste or Upload)
            </label>
            {file && (
              <span className="text-xs text-emerald-700 font-medium">
                Using file: {file.name}
              </span>
            )}
          </div>

          <textarea
            value={contentText}
            onChange={(e) => {
              setContentText(e.target.value);
              if (file) setFile(null);
            }}
            rows={7}
            placeholder="Paste your draft text here (e.g. marketing copy, landing page, press release)..."
            className="w-full text-sm p-3.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-serif leading-relaxed"
          />

          <div className="flex items-center space-x-3 pt-1">
            <label className="flex items-center space-x-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 cursor-pointer transition-colors">
              <Upload className="w-4 h-4 text-slate-500" />
              <span>Upload DOCX / TXT</span>
              <input
                type="file"
                accept=".docx,.txt,.md"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFile(e.target.files[0]);
                    setContentText('');
                  }
                }}
                className="hidden"
              />
            </label>

            {file && (
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-xs text-rose-600 hover:underline"
              >
                Clear file
              </button>
            )}
          </div>
        </div>

        {/* Intended message (REQUIRED) */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center space-x-1.5">
            <Info className="w-4 h-4 text-emerald-600" />
            <label className="text-xs font-bold uppercase tracking-wider text-slate-900">
              One-Line Intended Message <span className="text-rose-500">*</span>
            </label>
          </div>
          <p className="text-[11px] text-slate-500">
            What core message must this content deliver? The suggestion engine uses this to prevent intent drift.
          </p>
          <input
            type="text"
            required
            value={intendedMessage}
            onChange={(e) => setIntendedMessage(e.target.value)}
            placeholder="e.g. Promote the Summit Jacket as durable and weatherproof while highlighting our friendly shipping policy."
            className="w-full text-sm p-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="flex items-center space-x-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Running Pipeline & Evidence Gate...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Run Analysis & Open Findings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
