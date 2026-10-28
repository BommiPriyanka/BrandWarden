import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  FileCheck, 
  CheckCircle, 
  Layers, 
  Lock, 
  BookOpen, 
  Clock, 
  AlertCircle,
  Play
} from '../components/icons';
import { api } from '../api';
import { useRole } from '../context/RoleContext';

export default function Landing() {
  const navigate = useNavigate();
  const { role, setRole } = useRole();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    api.get('/api/submissions')
      .then((data) => setSubmissions(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleStartDemo = async () => {
    setDemoLoading(true);
    try {
      // 1. Fetch sample draft
      const draft = await api.get('/api/submissions/sample-draft');
      
      // 2. Automatically submit as Creator
      setRole('creator');
      const sub = await api.post('/api/submissions', {
        title: draft.title,
        content_text: draft.content_text,
        intended_message: draft.intended_message,
      });

      // 3. Immediately trigger analysis
      await api.post(`/api/analysis/${sub.id}`);

      // 4. Navigate directly to the Findings view
      navigate(`/submissions/${sub.id}/findings`);
    } catch (err) {
      alert(`Could not start demo: ${err.message}`);
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-850 to-slate-900 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full text-xs text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Evidence-First Brand Governance</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            Content goes in. <br />
            <span className="text-emerald-400 underline decoration-emerald-500/40 decoration-wavy">
              Verified findings
            </span> come back.
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            BrandWarden checks drafts against your organization’s approved guidelines, 
            claims policy, and verified facts. Every issue is verified by the <strong className="text-white">Evidence Gate</strong> with 
            an exact verbatim source quote — no hallucinated advice.
          </p>

          {/* Big Try Demo Button */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleStartDemo}
              disabled={demoLoading}
              className="w-full sm:w-auto flex items-center justify-center space-x-2.5 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-slate-950 font-bold text-base rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              {demoLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  <span>Preparing Northwind Demo...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-slate-950" />
                  <span>Try the Northwind Demo</span>
                </>
              )}
            </button>

            <Link
              to="/submit"
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm rounded-xl border border-slate-700 transition-colors"
            >
              <span>Submit Custom Draft</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="text-xs text-slate-400 pt-2 flex items-center justify-center space-x-4">
            <span className="flex items-center">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mr-1" />
              No login required
            </span>
            <span className="flex items-center">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mr-1" />
              Pre-loaded Northwind Outdoor dataset
            </span>
            <span className="flex items-center">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mr-1" />
              1-click end-to-end evaluation
            </span>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Core Architecture Highlights */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="font-bold text-slate-900 text-base">Deterministic Rule Engine</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Detects unapproved terminology (e.g. "clients" vs "customers"), exclamation marks exceeding brand limit, and overly complex sentence structures.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="font-bold text-slate-900 text-base">Claim Verification vs Facts</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Catches superlatives (#1, best, leading) and guarantees. Compares figures like "$50 free shipping" directly against approved operations facts ($75).
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="font-bold text-slate-900 text-base">The Evidence Gate</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Candidate findings must quote an approved clause or fact verbatim. If the quote cannot be verified in the stored library, it is suppressed.
            </p>
          </div>
        </section>

        {/* Existing Submissions List */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileCheck className="w-5 h-5 text-slate-600" />
              <h2 className="font-bold text-sm text-slate-800 uppercase tracking-wider">
                Drafts in Brand Review ({submissions.length})
              </h2>
            </div>
            <Link
              to="/submit"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center"
            >
              <span>+ New Submission</span>
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Loading submissions...
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="text-slate-400">No submissions found yet.</div>
              <button
                onClick={handleStartDemo}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700"
              >
                Load Sample Draft
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {submissions.map((sub) => {
                const dateStr = new Date(sub.created_at).toLocaleDateString();
                const statusStyles = {
                  draft: 'bg-slate-100 text-slate-700 border-slate-200',
                  in_review: 'bg-blue-100 text-blue-700 border-blue-200',
                  needs_changes: 'bg-amber-100 text-amber-800 border-amber-200',
                  approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                  rejected: 'bg-rose-100 text-rose-800 border-rose-200',
                };
                return (
                  <div
                    key={sub.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/submissions/${sub.id}/findings`}
                          className="font-bold text-sm text-slate-900 hover:text-emerald-700 transition-colors"
                        >
                          {sub.title}
                        </Link>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${statusStyles[sub.status] || statusStyles.draft}`}>
                          {sub.status.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          v{sub.version}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1 max-w-2xl font-serif italic">
                        "{sub.content_text}"
                      </p>
                      <div className="text-[11px] text-slate-400">
                        Intended: <span className="font-medium text-slate-600">{sub.intended_message}</span> · Created {dateStr} by {sub.created_by_role}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/submissions/${sub.id}/findings`}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        Findings & Gate
                      </Link>
                      <Link
                        to={`/submissions/${sub.id}/review`}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200"
                      >
                        Workflow & Review
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
