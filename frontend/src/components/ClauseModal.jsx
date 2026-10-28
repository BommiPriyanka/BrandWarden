import React, { useEffect, useState } from 'react';
import { X, BookOpen, ExternalLink, CheckCircle } from './icons';
import { api } from '../api';

export default function ClauseModal({ code, onClose }) {
  const [clause, setClause] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    setError(null);
    api.get(`/api/guidelines/clauses/${code}`)
      .then((data) => setClause(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [code]);

  if (!code) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-base">Guideline Clause {code}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-8 text-slate-500 text-sm">
              <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mr-2" />
              Loading clause details...
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          )}

          {clause && (
            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Clause Code & Title
                </span>
                <div className="text-lg font-bold text-slate-900 mt-0.5">
                  [{clause.code}] {clause.title}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Approved Verbatim Text
                </span>
                <p className="text-sm text-slate-700 leading-relaxed font-serif italic">
                  "{clause.text}"
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span className="flex items-center text-emerald-600 font-medium">
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                  Verified in Northwind Guideline Library
                </span>
                <span>Version {clause.version}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
