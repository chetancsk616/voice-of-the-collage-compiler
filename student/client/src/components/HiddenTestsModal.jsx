import React, { useState } from 'react';

export default function HiddenTestsModal({ show, testResults, onClose }) {
  const [showAll, setShowAll] = useState(false);

  if (!show || !testResults) return null;

  // Extract hidden tests (those with generated: true flag)
  const allTests = testResults.results || [];
  const hiddenTests = allTests.filter(test => test.generated === true);
  const baseTests = allTests.filter(test => !test.generated);

  // Calculate stats
  const hiddenPassedCount = hiddenTests.filter(t => t.passed).length;
  const basePassedCount = baseTests.filter(t => t.passed).length;

  // Show first 10 by default, or all if showAll is true
  const displayedTests = showAll ? hiddenTests : hiddenTests.slice(0, 10);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4" style={{ zIndex: 100 }} onClick={onClose}>
      <div className="clean-card w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl p-8 card-accent fade-in-up" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-cyan-300 flex items-center gap-3">
              🔬 Hidden Test Cases
            </h2>
            <p className="text-sm text-cyan-400/60 mt-1">
              Auto-generated tests to validate edge cases and robustness
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-cyan-500/50 text-cyan-300 rounded-lg hover:bg-cyan-600/20 font-semibold"
          >
            ✕ Close
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {/* Base Tests */}
          <div className="bg-gray-50 border border-blue-50 rounded-lg p-4">
            <div className="text-xs font-semibold text-blue-400 mb-2">
              BASE TESTS
            </div>
            <div className="text-3xl font-bold text-blue-300">
              {baseTests.length}
            </div>
            <div className="text-xs text-blue-400/60 mt-1">
              {basePassedCount}/{baseTests.length} passed
            </div>
          </div>

          {/* Hidden Tests */}
          <div className="bg-gray-50 border border-cyan-50 rounded-lg p-4">
            <div className="text-xs font-semibold text-cyan-400 mb-2">
              HIDDEN TESTS
            </div>
            <div className="text-3xl font-bold text-cyan-300">
              {hiddenTests.length}
            </div>
            <div className="text-xs text-cyan-400/60 mt-1">
              auto-generated
            </div>
          </div>

          {/* Hidden Passed */}
          <div className="bg-gray-50 border border-green-50 rounded-lg p-4">
            <div className="text-xs font-semibold text-green-400 mb-2">
              PASSED
            </div>
            <div className="text-3xl font-bold text-green-300">
              {hiddenPassedCount}
            </div>
            <div className="text-xs text-green-400/60 mt-1">
              {hiddenTests.length > 0 ? Math.round((hiddenPassedCount / hiddenTests.length) * 100) : 0}% success rate
            </div>
          </div>

          {/* Hidden Failed */}
          <div className="bg-gray-50 border border-red-50 rounded-lg p-4">
            <div className="text-xs font-semibold text-red-400 mb-2">
              FAILED
            </div>
            <div className="text-3xl font-bold text-red-300">
              {hiddenTests.length - hiddenPassedCount}
            </div>
            <div className="text-xs text-red-400/60 mt-1">
              {hiddenTests.length > 0 ? Math.round(((hiddenTests.length - hiddenPassedCount) / hiddenTests.length) * 100) : 0}% failure rate
            </div>
          </div>
        </div>

        {/* Test Results Grid */}
        {hiddenTests.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-cyan-300">
                Test Results ({displayedTests.length} of {hiddenTests.length} shown)
              </h3>
              {hiddenTests.length > 10 && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="px-3 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/50 text-cyan-300 rounded-lg text-sm font-semibold"
                >
                  {showAll ? '📋 Show First 10' : '📜 Show All'}
                </button>
              )}
            </div>

            <div className="space-y-3">
              {displayedTests.map((test, idx) => (
                <div
                  key={idx}
                  className={`border rounded-lg p-4 ${
                    test.passed
                      ? 'bg-green-900/10 border-green-500/30'
                      : 'bg-red-900/10 border-red-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Test Number & Status */}
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className={`px-2 py-1 rounded font-mono text-sm ${
                          test.passed
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        #{test.testNumber}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`text-xl ${test.passed ? '✅' : '❌'}`}
                          >
                            {test.passed ? '✅' : '❌'}
                          </span>
                          <span
                            className={`text-sm font-bold ${
                              test.passed ? 'text-green-300' : 'text-red-300'
                            }`}
                          >
                            {test.passed ? 'PASSED' : 'FAILED'}
                          </span>
                          {test.executionTimeMs !== undefined && (
                            <span className="text-xs text-gray-400 ml-auto">
                              ⏱️ {test.executionTimeMs}ms
                            </span>
                          )}
                        </div>

                        {/* Input/Output Grid */}
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          {/* Input */}
                          <div>
                            <div className="text-gray-400 mb-1">📥 Input:</div>
                            <div className="bg-slate-800/50 border border-cyan-500/20 rounded p-2 font-mono text-cyan-100 whitespace-pre-wrap break-all">
                              {test.input || '(empty)'}
                            </div>
                          </div>

                          {/* Expected Output */}
                          <div>
                            <div className="text-gray-400 mb-1">
                              ✅ Expected:
                            </div>
                            <div className="bg-slate-800/50 border border-green-500/20 rounded p-2 font-mono text-green-100 whitespace-pre-wrap break-all">
                              {test.expectedOutput || '(empty)'}
                            </div>
                          </div>

                          {/* Actual Output */}
                          <div>
                            <div className="text-gray-400 mb-1">
                              📤 Actual:
                            </div>
                            <div
                              className={`bg-slate-800/50 border rounded p-2 font-mono whitespace-pre-wrap break-all ${
                                test.passed
                                  ? 'border-green-500/20 text-green-100'
                                  : 'border-red-500/20 text-red-100'
                              }`}
                            >
                              {test.actualOutput || '(empty)'}
                            </div>
                          </div>
                        </div>

                        {/* Error Display */}
                        {test.error && (
                          <div className="mt-2 bg-red-900/20 border border-red-500/30 rounded p-2">
                            <div className="text-xs font-semibold text-red-400 mb-1">
                              ⚠️ Error:
                            </div>
                            <div className="text-xs text-red-200 font-mono whitespace-pre-wrap">
                              {test.error}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/50 border border-cyan-500/30 rounded-lg p-8 text-center">
            <div className="text-cyan-300 text-5xl mb-4">🎯</div>
            <div className="text-lg font-bold text-cyan-300 mb-2">
              No Hidden Tests Generated
            </div>
            <p className="text-sm text-cyan-400/60">
              This question does not require hidden test case generation, or no base test cases were available for fuzzing.
            </p>
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-6 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 rounded-lg p-4">
          <div className="text-xs font-semibold text-cyan-300 mb-2">
            ℹ️ About Hidden Tests:
          </div>
          <div className="text-xs text-cyan-100/70 space-y-1">
            <p>
              • Hidden tests are automatically generated based on your question's sample test cases
            </p>
            <p>
              • They add input variations (whitespace, formatting) to test robustness
            </p>
            <p>
              • The number of tests varies by difficulty: Easy (5-15), Medium (10-30), Hard (15-50)
            </p>
            <p>
              • Tests are generated at runtime and never stored - each submission gets a unique deterministic set
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
