import React from 'react';

/**
 * Word-level diff generator
 */
function computeWordDiff(oldText, newText) {
  const oldWords = oldText.split(/(\s+)/);
  const newWords = newText.split(/(\s+)/);

  // Simple LCS-based word diff
  const dp = Array(oldWords.length + 1)
    .fill(null)
    .map(() => Array(newWords.length + 1).fill(0));

  for (let i = 0; i < oldWords.length; i++) {
    for (let j = 0; j < newWords.length; j++) {
      if (oldWords[i] === newWords[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  let i = oldWords.length;
  let j = newWords.length;
  const result = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      result.unshift({ type: 'unchanged', text: oldWords[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'added', text: newWords[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      result.unshift({ type: 'removed', text: oldWords[i - 1] });
      i--;
    }
  }

  return result;
}

export default function DiffViewer({ oldText, newText, oldLabel = "Previous", newLabel = "Current" }) {
  if (!oldText || !newText) {
    return <div className="text-xs text-slate-500 italic">Select versions to compare.</div>;
  }

  if (oldText === newText) {
    return (
      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
        No textual differences between selected versions.
      </div>
    );
  }

  const diffChunks = computeWordDiff(oldText, newText);

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
      <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 font-medium">
        <span className="flex items-center space-x-2">
          <span className="inline-block w-2.5 h-2.5 bg-rose-400 rounded-sm" />
          <span>Removed ({oldLabel})</span>
        </span>
        <span className="flex items-center space-x-2">
          <span className="inline-block w-2.5 h-2.5 bg-emerald-400 rounded-sm" />
          <span>Added ({newLabel})</span>
        </span>
      </div>

      <div className="p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
        {diffChunks.map((chunk, index) => {
          if (chunk.type === 'added') {
            return (
              <span
                key={index}
                className="bg-emerald-100 text-emerald-900 font-semibold px-0.5 rounded"
              >
                {chunk.text}
              </span>
            );
          }
          if (chunk.type === 'removed') {
            return (
              <span
                key={index}
                className="bg-rose-100 text-rose-900 line-through px-0.5 rounded opacity-75"
              >
                {chunk.text}
              </span>
            );
          }
          return <span key={index}>{chunk.text}</span>;
        })}
      </div>
    </div>
  );
}
