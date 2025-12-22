import React from 'react';

export default function VerdictModal({ show, verdict, onClose, onViewHiddenTests }) {
  if (!show || !verdict) return null;

  // Debug: Log the verdict object to see what data we have
  console.log('🔍 Verdict Modal Data:', verdict);
  console.log('📊 Has components?', !!verdict.components);
  console.log('🤖 Has aiExplanation?', !!verdict.aiExplanation);
  console.log('⚠️ Has issues?', verdict.issues?.length);

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
        className="vibe-card border-2 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-8"
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
          <div className="flex gap-2">
            {onViewHiddenTests && (
              <button
                onClick={onViewHiddenTests}
                className="px-4 py-2 border border-cyan-500/50 text-cyan-300 rounded-lg hover:bg-cyan-600/20 font-semibold"
              >
                🔬 View Hidden Tests
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 border border-purple-500/50 text-purple-300 rounded-lg hover:bg-purple-600/20 font-semibold"
            >
              ✕ Close
            </button>
          </div>
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

        {/* Detailed Marks Breakdown */}
        {verdict.components && (
          <div className="mb-6 bg-gradient-to-br from-indigo-900/30 to-blue-900/30 border border-indigo-500/40 rounded-lg p-5">
            <div className="text-lg font-bold text-indigo-300 mb-4 flex items-center gap-2">
              <span>📊</span>
              <span>Marks Breakdown</span>
            </div>
            
            <div className="space-y-3">
              {/* Test Cases */}
              {verdict.components.testResults && (
                <div className="bg-slate-900/50 border border-cyan-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400 text-lg">🧪</span>
                      <span className="text-sm font-semibold text-cyan-300">Test Cases</span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-cyan-300">
                        {Math.round((verdict.components.testResults.passRate || 0) * 0.7)}
                      </span>
                      <span className="text-sm text-cyan-400/60 ml-1">/70</span>
                    </div>
                  </div>
                  <div className="text-xs text-cyan-100/70">
                    {verdict.components.testResults.passedTests}/{verdict.components.testResults.totalTests} tests passed 
                    <span className="ml-2 text-cyan-400">
                      ({verdict.components.testResults.passRate}%)
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                      style={{ width: `${verdict.components.testResults.passRate}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Logic Quality */}
              {verdict.components.ruleBased && (
                <div className="bg-slate-900/50 border border-purple-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-purple-400 text-lg">🧠</span>
                      <span className="text-sm font-semibold text-purple-300">Logic Quality</span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-purple-300">
                        {Math.round((verdict.components.ruleBased.logicScore || 0) * 0.2)}
                      </span>
                      <span className="text-sm text-purple-400/60 ml-1">/20</span>
                    </div>
                  </div>
                  <div className="text-xs text-purple-100/70">
                    Logic score: {verdict.components.ruleBased.logicScore || 0}/100
                    {verdict.components.ruleBased.algorithmMatch && (
                      <span className="ml-2 text-purple-400">
                        • Algorithm: {verdict.components.ruleBased.algorithmMatch}
                      </span>
                    )}
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                      style={{ width: `${verdict.components.ruleBased.logicScore}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Complexity */}
              {verdict.components.ruleBased && (
                <div className="bg-slate-900/50 border border-emerald-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 text-lg">⚡</span>
                      <span className="text-sm font-semibold text-emerald-300">Complexity Analysis</span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-emerald-300">
                        {verdict.components.ruleBased.complexityMarks || 0}
                      </span>
                      <span className="text-sm text-emerald-400/60 ml-1">/10</span>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs">
                    {/* Time Complexity */}
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-100/70">Time Complexity:</span>
                      <span className={`font-mono ${verdict.components.ruleBased.timeComplexityMatch ? 'text-green-400' : 'text-red-400'}`}>
                        {verdict.components.ruleBased.timeComplexityMatch ? '✓' : '✗'} 
                        <span className="ml-1">
                          {verdict.components.ruleBased.detectedTimeComplexity || 'N/A'}
                        </span>
                        {verdict.components.ruleBased.expectedTimeComplexity && (
                          <span className="text-emerald-400/60 ml-1">
                            (expected: {verdict.components.ruleBased.expectedTimeComplexity})
                          </span>
                        )}
                      </span>
                    </div>
                    {/* Space Complexity */}
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-100/70">Space Complexity:</span>
                      <span className={`font-mono ${verdict.components.ruleBased.spaceComplexityMatch ? 'text-green-400' : 'text-red-400'}`}>
                        {verdict.components.ruleBased.spaceComplexityMatch ? '✓' : '✗'}
                        <span className="ml-1">
                          {verdict.components.ruleBased.detectedSpaceComplexity || 'N/A'}
                        </span>
                        {verdict.components.ruleBased.expectedSpaceComplexity && (
                          <span className="text-emerald-400/60 ml-1">
                            (expected: {verdict.components.ruleBased.expectedSpaceComplexity})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                      style={{ width: `${(verdict.components.ruleBased.complexityMarks || 0) * 10}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Explanation & Reasoning - Show this prominently */}
        {(verdict.aiExplanation || verdict.reasoning || (verdict.issues && verdict.issues.length > 0)) && (
          <div className="mb-6 bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-2 border-purple-500/50 rounded-lg p-5">
            <div className="text-lg font-bold text-purple-300 mb-4 flex items-center gap-2">
              <span>🤖</span>
              <span>Evaluation Feedback & Reasoning</span>
              {verdict.aiExplanationModel && (
                <span className="text-xs text-purple-400/60 ml-auto font-normal">
                  ({verdict.aiExplanationModel})
                </span>
              )}
            </div>
            
            {/* AI Explanation */}
            {verdict.aiExplanation && (
              <div className="mb-4">
                <div className="text-sm font-semibold text-purple-200 mb-2">AI Analysis:</div>
                <p className="text-sm text-purple-100/90 leading-relaxed whitespace-pre-wrap bg-slate-900/40 rounded-lg p-3 border border-purple-500/20">
                  {verdict.aiExplanation}
                </p>
              </div>
            )}

            {/* Reasoning */}
            {verdict.reasoning && (
              <div className="mb-4">
                <div className="text-sm font-semibold text-purple-200 mb-2">System Reasoning:</div>
                <p className="text-sm text-purple-100/80 bg-slate-900/40 rounded-lg p-3 border border-purple-500/20">
                  {verdict.reasoning}
                </p>
              </div>
            )}

            {/* Quick Summary of Score */}
            <div className="bg-purple-900/30 rounded-lg p-3 border border-purple-500/30">
              <div className="text-xs font-semibold text-purple-300 mb-2">📊 Score Summary:</div>
              <div className="text-xs text-purple-100/80 space-y-1">
                {verdict.components?.testResults && (
                  <div>• Test Cases: {Math.round((verdict.components.testResults.passRate || 0) * 0.7)}/70 
                    ({verdict.components.testResults.passedTests}/{verdict.components.testResults.totalTests} passed)
                  </div>
                )}
                {verdict.components?.ruleBased && (
                  <>
                    <div>• Logic Quality: {Math.round((verdict.components.ruleBased.logicScore || 0) * 0.2)}/20 
                      (Logic Score: {verdict.components.ruleBased.logicScore}/100)
                    </div>
                    <div>• Complexity: {verdict.components.ruleBased.complexityMarks || 0}/10 
                      {verdict.components.ruleBased.timeComplexityMatch && verdict.components.ruleBased.spaceComplexityMatch 
                        ? ' (Both match ✓)' 
                        : verdict.components.ruleBased.timeComplexityMatch || verdict.components.ruleBased.spaceComplexityMatch
                          ? ' (Partial match)' 
                          : ' (No match)'}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Issues & Deductions - Always show this section */}
        <div className="mb-6">
          {verdict.issues && verdict.issues.length > 0 ? (
            <div className="bg-gradient-to-br from-red-900/20 to-orange-900/20 border border-red-500/40 rounded-lg p-5">
              <div className="text-base font-bold text-red-300 mb-3 flex items-center gap-2">
                <span>⚠️</span>
                <span>Issues Found & Mark Deductions</span>
              </div>
            <div className="space-y-3">
              {verdict.issues.map((issue, i) => {
                // Determine mark deduction based on severity
                let deduction = 0;
                let severityColor = '';
                let severityLabel = '';
                
                if (issue.severity === 'critical' || issue.severity === 'high') {
                  deduction = 20;
                  severityColor = 'text-red-400';
                  severityLabel = 'CRITICAL';
                } else if (issue.severity === 'warning' || issue.severity === 'medium') {
                  deduction = 10;
                  severityColor = 'text-orange-400';
                  severityLabel = 'MEDIUM';
                } else {
                  deduction = 5;
                  severityColor = 'text-yellow-400';
                  severityLabel = 'LOW';
                }

                return (
                  <div key={i} className="bg-slate-900/50 border border-red-500/20 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="flex items-start gap-2 flex-1">
                        <span className="text-red-400 mt-0.5">✗</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-bold ${severityColor} uppercase`}>
                              {severityLabel}
                            </span>
                            <span className="text-xs text-gray-400 font-mono">
                              [{issue.source || 'system'}]
                            </span>
                          </div>
                          <p className="text-sm text-red-100/80 leading-relaxed">
                            {issue.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs text-red-400/60">Logic Deduction</div>
                        <div className="text-lg font-bold text-red-400">
                          -{deduction}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {verdict.issues.length > 0 && (
              <div className="mt-3 text-xs text-red-300/60 italic">
                💡 Logic scoring starts at 100/100 and deductions are applied based on severity:
                Critical (-20), Medium (-10), Low (-5)
              </div>
            )}
            </div>
          ) : (
            <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/40 rounded-lg p-5">
              <div className="text-base font-bold text-green-300 mb-3 flex items-center gap-2">
                <span>✨</span>
                <span>Excellent Work!</span>
              </div>
              <div className="space-y-2 text-sm text-green-100/80">
                <p>Your solution achieved a high score with minimal or no deductions:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  {verdict.components?.testResults?.passRate === 100 && (
                    <li>✓ All test cases passed (70/70 marks)</li>
                  )}
                  {verdict.components?.ruleBased?.logicScore >= 80 && (
                    <li>✓ Strong logic implementation ({Math.round((verdict.components.ruleBased.logicScore || 0) * 0.2)}/20 marks)</li>
                  )}
                  {verdict.components?.ruleBased?.complexityMarks === 10 && (
                    <li>✓ Optimal time and space complexity (10/10 marks)</li>
                  )}
                </ul>
                
                {/* Show minor issues if any */}
                {verdict.score < 100 && (
                  <div className="mt-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
                    <div className="text-xs font-semibold text-yellow-300 mb-2">Minor Observations:</div>
                    <div className="text-xs text-yellow-100/80">
                      {verdict.components?.testResults?.passRate < 100 && (
                        <div>• Some test cases didn't pass ({verdict.components.testResults.passedTests}/{verdict.components.testResults.totalTests})</div>
                      )}
                      {verdict.components?.ruleBased?.logicScore < 100 && verdict.components?.ruleBased?.logicScore >= 90 && (
                        <div>• Minor logic optimization possible (Logic: {verdict.components.ruleBased.logicScore}/100) - likely a warning about code style or unnecessary constructs</div>
                      )}
                      {verdict.components?.ruleBased?.logicScore < 90 && (
                        <div>• Some logic improvements needed (Logic: {verdict.components.ruleBased.logicScore}/100)</div>
                      )}
                      {verdict.components?.ruleBased?.complexityMarks < 10 && verdict.components?.ruleBased?.complexityMarks > 0 && (
                        <div>• Partial complexity match - check time or space complexity</div>
                      )}
                      {verdict.components?.ruleBased?.complexityMarks === 0 && (
                        <div>• Complexity doesn't match expected requirements</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

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
