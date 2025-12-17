export default function OutputPanel({
  stdout,
  stderr,
  exitCode,
  timeMs,
  testCaseResults = [],
}) {
  // If we have test case results, show them
  if (testCaseResults.length > 0) {
    const isCustomInput = testCaseResults[0]?.isCustomInput || false;
    const visibleTests = testCaseResults.filter((t) => !t.isHidden);
    const hiddenTests = testCaseResults.filter((t) => t.isHidden);
    const allPassed = testCaseResults.every((t) => t.passed);

    return (
      <div className="vibe-card border-2 border-purple-500/40 rounded-2xl p-6 flex flex-col">
        <h3 className="text-lg font-bold text-purple-300 mb-3">
          📤 {isCustomInput ? 'Custom Input Result' : 'Test Results'}
        </h3>

        <div
          className="flex flex-col gap-4 overflow-auto"
          style={{ maxHeight: '500px' }}
        >
          {/* Visible Test Cases */}
          {visibleTests.map((test, idx) => (
            <div
              key={idx}
              className={`border-2 rounded-lg p-3 ${test.passed ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-purple-300">
                  {isCustomInput
                    ? 'Custom Input'
                    : `Test Case ${test.testNumber}`}
                </span>
                <span
                  className={`text-xs font-bold ${test.passed ? 'text-green-400' : 'text-red-400'}`}
                >
                  {test.passed ? '✓ PASSED' : '✗ FAILED'}
                </span>
              </div>

              {test.input && test.input.trim() !== '' && (
                <div className="mb-2">
                  <div className="text-xs font-semibold text-blue-400 mb-1">
                    📥 Input
                  </div>
                  <pre
                    className="bg-slate-900/80 border border-blue-500/30 rounded p-2 text-xs text-blue-300 font-mono overflow-auto"
                    style={{ maxHeight: '80px' }}
                  >
                    {test.input}
                  </pre>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs font-semibold text-blue-400 mb-1">
                    🎯 Expected
                  </div>
                  <pre
                    className="bg-slate-900/80 border border-blue-500/30 rounded p-2 text-xs text-blue-300 font-mono overflow-auto"
                    style={{ minHeight: '40px', maxHeight: '100px' }}
                  >
                    {test.expectedOutput}
                  </pre>
                </div>
                <div>
                  <div
                    className={`text-xs font-semibold mb-1 ${test.passed ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {test.passed ? '✓' : '✗'} Actual
                  </div>
                  <pre
                    className={`bg-slate-900/80 border rounded p-2 text-xs font-mono overflow-auto ${test.passed ? 'border-green-500/30 text-green-300' : 'border-red-500/30 text-red-300'}`}
                    style={{ minHeight: '40px', maxHeight: '100px' }}
                  >
                    {test.actualOutput || '-'}
                  </pre>
                </div>
              </div>

              {test.stderr && (
                <div className="mt-2">
                  <div className="text-xs font-semibold text-red-400 mb-1">
                    ✗ Error
                  </div>
                  <pre
                    className="bg-slate-900/80 border border-red-500/30 rounded p-2 text-xs text-red-300 font-mono overflow-auto"
                    style={{ maxHeight: '60px' }}
                  >
                    {test.stderr}
                  </pre>
                </div>
              )}
            </div>
          ))}

          {/* Hidden Test Cases - Only show status */}
          {hiddenTests.length > 0 && (
            <div className="border-2 border-purple-500/30 rounded-lg p-3 bg-purple-500/5">
              <div className="text-xs font-bold text-purple-300 mb-2">
                🔒 Hidden Test Cases ({hiddenTests.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {hiddenTests.map((test, idx) => (
                  <div
                    key={idx}
                    className={`px-3 py-1 rounded text-xs font-semibold ${
                      test.passed
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    Test {test.testNumber}: {test.passed ? '✓' : '✗'}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Summary Footer */}
        <div className="mt-3 pt-3 border-t border-purple-500/20 text-xs font-mono flex justify-between">
          <span className={allPassed ? 'text-green-400' : 'text-red-400'}>
            {testCaseResults.filter((t) => t.passed).length}/
            {testCaseResults.length} Passed
          </span>
          {testCaseResults[0]?.timeMs !== null && (
            <span className="text-purple-300/60">
              Time:{' '}
              <span className="text-purple-400">
                {testCaseResults[0].timeMs}ms
              </span>
            </span>
          )}
        </div>
      </div>
    );
  }

  // Fallback to old display if no test case results
  return (
    <div className="vibe-card border-2 border-purple-500/40 rounded-2xl p-6 flex flex-col">
      <h3 className="text-lg font-bold text-purple-300 mb-3">📤 Output</h3>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col">
          <div className="text-xs font-semibold text-green-400 mb-1">✓ Out</div>
          <pre
            className="bg-slate-900/80 border border-green-500/30 rounded-lg p-2 text-xs text-green-300 font-mono overflow-auto"
            style={{ maxHeight: '150px', minHeight: '60px' }}
          >
            {stdout || '-'}
          </pre>
        </div>
        <div className="flex flex-col">
          <div className="text-xs font-semibold text-red-400 mb-1">✗ Err</div>
          <pre
            className="bg-slate-900/80 border border-red-500/30 rounded-lg p-2 text-xs text-red-300 font-mono overflow-auto"
            style={{ maxHeight: '150px', minHeight: '60px' }}
          >
            {stderr || '-'}
          </pre>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-purple-500/20 text-xs font-mono text-purple-300/60 flex justify-between">
        <span>
          Code:{' '}
          <span className="text-purple-400">
            {exitCode === null ? '-' : exitCode}
          </span>
        </span>
        <span>
          Time:{' '}
          <span className="text-purple-400">
            {timeMs === null ? '-' : `${timeMs}ms`}
          </span>
        </span>
      </div>
    </div>
  );
}
