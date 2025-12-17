import React from 'react';

export default function VerdictModal({ show, verdict, onClose }) {
  if (!show || !verdict) return null;

  // Map deterministic engine decisions to UI buckets
  // CORRECT -> Accepted, ACCEPTABLE -> Partial, NEEDS_IMPROVEMENT/INCORRECT -> Rejected
  const decision = verdict.decision || verdict.verdict;
  const isAccepted = decision === 'ACCEPTED' || decision === 'CORRECT';
  const isPartial = decision === 'PARTIAL_CREDIT' || decision === 'ACCEPTABLE';

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center p-4"
      style={{ zIndex: 100 }}
      onClick={onClose}
    >
      <div
        className="vibe-card border-2 w-full max-w-2xl rounded-2xl shadow-2xl p-8"
        onClick={(e) => e.stopPropagation()}
        style={{
          borderColor: isAccepted
            ? 'rgba(34, 197, 94, 0.5)'
            : isPartial
              ? 'rgba(251, 191, 36, 0.5)'
              : 'rgba(239, 68, 68, 0.5)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">
            {isAccepted
              ? '✅ Solution Accepted!'
              : isPartial
                ? '⚠️ Partial Credit'
                : '❌ Solution Rejected'}
          </h2>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-purple-500/50 text-purple-300 rounded-lg hover:bg-purple-600/20 font-semibold"
          >
            ✕ Close
          </button>
        </div>

        {/* Score Display */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Final Score */}
          <div className="bg-slate-900/50 border border-pink-500/30 rounded-lg p-4">
            <div className="text-xs font-semibold text-pink-400 mb-2">
              FINAL SCORE
            </div>
            <div className="text-4xl font-bold text-pink-300">
              {verdict.score}
            </div>
            <div className="text-xs text-pink-400/60 mt-1">out of 100</div>
          </div>

          {/* Decision */}
          <div
            className={`bg-slate-900/50 border rounded-lg p-4 ${
              isAccepted
                ? 'border-green-500/30'
                : isPartial
                  ? 'border-yellow-500/30'
                  : 'border-red-500/30'
            }`}
          >
            <div
              className="text-xs font-semibold mb-2"
              style={{
                color: isAccepted
                  ? 'rgb(74, 222, 128)'
                  : isPartial
                    ? 'rgb(250, 204, 21)'
                    : 'rgb(248, 113, 113)',
              }}
            >
              DECISION
            </div>
            <div
              className="text-2xl font-bold"
              style={{
                color: isAccepted
                  ? 'rgb(74, 222, 128)'
                  : isPartial
                    ? 'rgb(250, 204, 21)'
                    : 'rgb(248, 113, 113)',
              }}
            >
              {isAccepted ? 'PASS' : isPartial ? 'PARTIAL' : 'FAIL'}
            </div>
          </div>

          {/* Trust Score */}
          <div className="bg-slate-900/50 border border-purple-500/30 rounded-lg p-4">
            <div className="text-xs font-semibold text-purple-400 mb-2">
              TRUST SCORE
            </div>
            <div className="text-4xl font-bold text-purple-300">
              {verdict.trustScore}
            </div>
            <div className="text-xs text-purple-400/60 mt-1">
              confidence level
            </div>
          </div>
        </div>

        {/* Reasoning */}
        {verdict.reasoning && (
          <div className="mb-6 bg-slate-900/50 border border-blue-500/30 rounded-lg p-4">
            <div className="text-sm font-semibold text-blue-400 mb-2">
              REASONING
            </div>
            <p className="text-sm text-blue-100/80">{verdict.reasoning}</p>
          </div>
        )}

        {/* AI Explanation */}
        {verdict.aiExplanation && (
          <div className="mb-6 bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/50 rounded-lg p-4">
            <div className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-2">
              <span>🤖</span>
              <span>AI Analysis</span>
              {verdict.aiExplanationModel && (
                <span className="text-xs text-purple-400/60 ml-auto">
                  ({verdict.aiExplanationModel})
                </span>
              )}
            </div>
            <p className="text-sm text-purple-100/90 leading-relaxed whitespace-pre-wrap">
              {verdict.aiExplanation}
            </p>
          </div>
        )}

        {/* Feedback */}
        {verdict.feedback && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Strengths */}
            {verdict.feedback.strengths &&
              verdict.feedback.strengths.length > 0 && (
                <div className="bg-slate-900/50 border border-green-500/30 rounded-lg p-4">
                  <div className="text-sm font-semibold text-green-400 mb-2">
                    💡 Strengths
                  </div>
                  <ul className="text-xs text-green-100/80 space-y-1">
                    {verdict.feedback.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-green-400 mt-0.5">✓</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {/* Improvements */}
            {verdict.feedback.improvements &&
              verdict.feedback.improvements.length > 0 && (
                <div className="bg-slate-900/50 border border-yellow-500/30 rounded-lg p-4">
                  <div className="text-sm font-semibold text-yellow-400 mb-2">
                    📝 Improvements
                  </div>
                  <ul className="text-xs text-yellow-100/80 space-y-1">
                    {verdict.feedback.improvements.map((imp, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-yellow-400 mt-0.5">→</span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        )}

        {/* Stage Results */}
        {verdict.stages && (
          <div className="mb-6">
            <div className="text-sm font-semibold text-purple-400 mb-3">
              📊 Evaluation Pipeline
            </div>
            <div className="space-y-2">
              {Object.entries(verdict.stages).map(([stageName, stage]) => (
                <div
                  key={stageName}
                  className="flex items-center justify-between bg-slate-900/50 border border-purple-500/20 rounded p-2"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        stage.status === 'success'
                          ? 'text-green-400'
                          : 'text-red-400'
                      }
                    >
                      {stage.status === 'success' ? '✓' : '✗'}
                    </span>
                    <span className="text-xs font-mono text-purple-300">
                      {stageName.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                  <span className="text-xs text-purple-400/60">
                    {stage.durationMs}ms
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total Duration */}
        {verdict.totalDurationMs && (
          <div className="mb-6 text-xs text-purple-400/60 text-center">
            Total evaluation time:{' '}
            <span className="text-purple-400 font-semibold">
              {verdict.totalDurationMs}ms
            </span>
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-center gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-bold transition-all"
          >
            ✓ Got it
          </button>
        </div>
      </div>
    </div>
  );
}
