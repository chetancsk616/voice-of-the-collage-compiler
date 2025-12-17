export default function TestResultsModal({ testResults, onClose }) {
  if (!testResults) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center p-4"
      style={{ zIndex: 90 }}
      onClick={onClose}
    >
      <div 
        className="vibe-card border-2 border-purple-500/40 rounded-2xl p-8 max-w-2xl max-h-[80vh] overflow-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl">{testResults.passed ? '🎉' : '❌'}</span>
          <h2 className="text-2xl font-bold text-purple-300">
            {testResults.passed ? 'All Tests Passed!' : 'Some Tests Failed'}
          </h2>
        </div>

        <div className="space-y-3 mb-6">
          {testResults.cases.map((result, idx) => (
            <div
              key={idx}
              className={`border-l-4 rounded-lg p-4 ${
                result.passed
                  ? 'bg-green-500/10 border-green-500/50'
                  : 'bg-red-500/10 border-red-500/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`font-bold text-sm ${result.passed ? 'text-green-400' : 'text-red-400'}`}
                >
                  Test Case {result.number}:{' '}
                  {result.passed ? '✓ PASSED' : '✗ FAILED'}
                </span>
              </div>
              <div className="text-xs text-purple-200/70 space-y-1">
                <div>
                  <strong>Input:</strong>{' '}
                  <code className="bg-slate-900/50 px-1 rounded">
                    {result.input}
                  </code>
                </div>
                <div>
                  <strong>Expected:</strong>{' '}
                  <code className="bg-slate-900/50 px-1 rounded">
                    {result.expected}
                  </code>
                </div>
                <div>
                  <strong>Got:</strong>{' '}
                  <code className="bg-slate-900/50 px-1 rounded">
                    {result.actual}
                  </code>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-bold"
        >
          ✓ Close
        </button>
      </div>
    </div>
  );
}
