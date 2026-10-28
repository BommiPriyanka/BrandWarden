import React, { useState } from 'react';
import { ShieldCheck, Cpu, Filter, Eye, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Bot, Layers } from './icons';

export default function TransparencyPanel({ transparency }) {
  const [showDiscarded, setShowDiscarded] = useState(false);

  if (!transparency) return null;

  const {
    total_candidates = 0,
    discarded_by_evidence_gate = 0,
    shown_findings = 0,
    ai_status = '',
    checks_run = [],
    ai_used = false,
    discarded_reasons = [],
    rule_engine_findings = 0,
    claim_check_findings = 0,
    ai_findings_raw = 0,
  } = transparency;

  const isAiUnavailable = ai_status === 'ai_unavailable' || !ai_used;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
      {/* Top Banner / Pipeline Status */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide uppercase text-slate-200">
                Pipeline Transparency Panel
              </h3>
              <p className="text-xs text-slate-400">
                Evidence-gate verification & multi-stage analysis breakdown
              </p>
            </div>
          </div>

          {/* AI Badge */}
          <div className="flex items-center space-x-2">
            {isAiUnavailable ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                AI unavailable, deterministic checks only
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <Bot className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                AI-Assisted ({ai_status === 'cached' ? 'Cached Result' : 'Live Claude/Gemini'})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 bg-slate-50/50 p-4 border-b border-slate-200">
        {/* Candidates Generated */}
        <div className="px-4 py-2 flex items-center space-x-3.5">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{total_candidates}</div>
            <div className="text-xs font-medium text-slate-600">Candidate findings generated</div>
            <div className="text-[11px] text-slate-400">
              Rules: {rule_engine_findings} · Claims: {claim_check_findings} · AI: {ai_findings_raw}
            </div>
          </div>
        </div>

        {/* Evidence Gate Discards */}
        <div className="px-4 py-2 flex items-center space-x-3.5">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg border border-rose-100">
            <Filter className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{discarded_by_evidence_gate}</div>
            <div className="text-xs font-medium text-slate-600">Discarded by evidence gate</div>
            <div className="text-[11px] text-rose-600 font-medium">
              Zero unverified claims shown
            </div>
          </div>
        </div>

        {/* Verified Findings Shown */}
        <div className="px-4 py-2 flex items-center space-x-3.5">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600">{shown_findings}</div>
            <div className="text-xs font-medium text-slate-600">Verified findings shown</div>
            <div className="text-[11px] text-emerald-700 font-medium">
              100% backed by approved clauses/facts
            </div>
          </div>
        </div>
      </div>

      {/* Checks Run Badges */}
      <div className="px-6 py-3 bg-white flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-500">Pipeline stages executed:</span>
          {checks_run.map((check) => (
            <span
              key={check}
              className="inline-flex items-center px-2.5 py-0.5 rounded-md font-mono text-[11px] bg-slate-100 text-slate-700 border border-slate-200"
            >
              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
              {check === 'rule_engine' && '1. Rule Engine'}
              {check === 'claim_check' && '2. Claim Verification'}
              {check === 'ai_judge' && '3. AI Tone Judge'}
              {check !== 'rule_engine' && check !== 'claim_check' && check !== 'ai_judge' && check}
            </span>
          ))}
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md font-mono text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
            <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
            4. Evidence Gate (Active)
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md font-mono text-[11px] bg-blue-50 text-blue-800 border border-blue-200">
            5. Suggestion Engine
          </span>
        </div>

        {/* Toggle Discarded Log */}
        {discarded_by_evidence_gate > 0 && (
          <button
            onClick={() => setShowDiscarded(!showDiscarded)}
            className="flex items-center space-x-1 text-xs font-medium text-rose-600 hover:text-rose-700 focus:outline-none"
          >
            <span>View {discarded_by_evidence_gate} rejected finding(s)</span>
            {showDiscarded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Discarded Findings Details Drawer */}
      {showDiscarded && discarded_reasons.length > 0 && (
        <div className="px-6 py-4 bg-rose-50/50 border-t border-rose-100 text-xs">
          <div className="font-semibold text-rose-900 mb-2 flex items-center">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-rose-600" />
            Evidence Gate Audit Log — Why candidate findings were suppressed:
          </div>
          <div className="space-y-2">
            {discarded_reasons.map((d, idx) => (
              <div key={idx} className="bg-white p-3 rounded-lg border border-rose-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="font-mono text-rose-700 font-semibold">[{d.clause_code || 'Unknown'}]</span>
                  <span className="uppercase text-[10px] tracking-wider text-slate-400">{d.category}</span>
                </div>
                <div className="text-slate-700 font-sans">{d.reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
