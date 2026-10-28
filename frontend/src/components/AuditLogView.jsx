import React from 'react';
import { History, UserCheck, ShieldAlert, MessageSquare, CheckCircle, ArrowRight } from './icons';

export default function AuditLogView({ logs = [] }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
        No audit log events recorded yet.
      </div>
    );
  }

  const getActionBadge = (action) => {
    if (action.startsWith('status_changed')) {
      const parts = action.split(':');
      return (
        <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          <ArrowRight className="w-3 h-3 mr-1" />
          Status Changed: {parts[1] || ''}
        </span>
      );
    }
    if (action.includes('approval_override')) {
      return (
        <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          <ShieldAlert className="w-3 h-3 mr-1" />
          Approval Override
        </span>
      );
    }
    if (action.includes('accepted')) {
      return (
        <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Accepted Finding
        </span>
      );
    }
    if (action.includes('comment')) {
      return (
        <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
          <MessageSquare className="w-3 h-3 mr-1" />
          Comment Added
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
        {action}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-slate-500" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Immutable Audit Trail ({logs.length} events)
          </h4>
        </div>
        <span className="text-[11px] text-slate-500 font-medium">Who, What, When</span>
      </div>

      <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
        {logs.map((log) => {
          const dateStr = new Date(log.created_at).toLocaleString();
          return (
            <div key={log.id} className="p-3.5 hover:bg-slate-50/60 transition-colors text-xs space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900 capitalize">
                    {log.actor_role}
                  </span>
                  {getActionBadge(log.action)}
                </div>
                <span className="text-[11px] text-slate-400 font-mono">{dateStr}</span>
              </div>
              {log.detail && (
                <div className="text-slate-600 pl-1 border-l-2 border-slate-200 mt-1 font-sans">
                  {log.detail}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
