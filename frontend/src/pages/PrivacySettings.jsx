import React, { useEffect, useState } from 'react';
import { ShieldCheck, Lock, EyeOff, Cpu, Info, CheckCircle, Database } from '../components/icons';
import { api } from '../api';

export default function PrivacySettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/settings')
      .then((data) => setSettings(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-500">
        Loading privacy and AI disclosures...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
          <span>Privacy, Transparency & AI Disclosure</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Full transparency on data handling, PII sanitization, and external model usage.
        </p>
      </div>

      {/* Grid of Disclosure Cards */}
      <div className="space-y-6">
        {/* Active AI Engine */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
            <Cpu className="w-5 h-5 text-emerald-600" />
            <span>Active Inference Engine</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Configured Provider
              </span>
              <span className="font-mono font-bold text-slate-800 text-sm capitalize">
                {settings?.ai_provider || 'Deterministic Fallback'}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Model Identifier
              </span>
              <span className="font-mono text-slate-700 text-xs">
                {settings?.ai_model || 'None'}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            If no API key is provided, or if the external inference call exceeds the 10-second timeout or errors out, 
            BrandWarden operates smoothly in <strong>Deterministic Fallback Mode</strong> using the Rule Engine and Claim Checker.
          </p>
        </div>

        {/* PII Masking */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
            <EyeOff className="w-5 h-5 text-indigo-600" />
            <span>PII Masking & Confidential Term Redaction</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Before any text is dispatched to an external LLM, the payload passes through our local regex sanitization pipeline:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {settings?.pii_fields_masked?.map((field) => (
              <div key={field} className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 flex items-center space-x-2 text-xs text-indigo-900 font-medium capitalize">
                <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>{field}</span>
              </div>
            ))}
          </div>
          <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 text-xs text-slate-700 font-mono">
            "Contact sales@northwind.com at +1-555-0192 regarding confidential roadmap" <br />
            <span className="text-emerald-700 font-bold">↳ becomes:</span> "Contact [EMAIL] at [PHONE] regarding [REDACTED] roadmap"
          </div>
        </div>

        {/* Data Sent */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-3">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
            <Info className="w-5 h-5 text-blue-600" />
            <span>Payload Boundary</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {settings?.data_sent_to_ai}
          </p>
          <ul className="text-xs text-slate-500 list-disc list-inside space-y-1">
            <li>No user accounts, sessions, or credential metadata are ever transmitted.</li>
            <li>No file binaries or raw document structure are sent to external APIs.</li>
            <li>Only sanitized text and retrieved guideline clauses are exchanged.</li>
          </ul>
        </div>

        {/* Caching Policy */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-3">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
            <Database className="w-5 h-5 text-amber-600" />
            <span>Local SHA-256 Inference Cache</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            All AI responses are cached locally by a cryptographic hash of <code>SHA256(content_text + retrieved_clauses)</code>. 
            Repeated demo runs are instant, deterministic, and cost zero additional API tokens.
          </p>
        </div>
      </div>
    </div>
  );
}
