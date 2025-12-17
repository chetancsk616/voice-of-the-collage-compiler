export default function QuestionPanel({ question }) {
  if (!question) return null;

  const handleCopyPaste = (e) => {
    e.preventDefault();
  };

  return (
    <div
      className="vibe-card border-2 border-cyan-500/40 rounded-2xl p-6 flex flex-col h-full overflow-auto"
      onCopy={handleCopyPaste}
      onCut={handleCopyPaste}
      onPaste={handleCopyPaste}
    >
      <h2 className="text-lg font-bold text-cyan-300 mb-4">📋 Question</h2>

      {/* Difficulty Badge */}
      <div className="mb-4">
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
            question.difficulty === 'Easy'
              ? 'bg-green-500/30 text-green-300 border border-green-500/50'
              : question.difficulty === 'Medium'
                ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50'
                : 'bg-red-500/30 text-red-300 border border-red-500/50'
          }`}
        >
          {question.difficulty}
        </span>
      </div>

      {/* Description */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-cyan-200 mb-2">
          Description
        </h3>
        <p className="text-xs text-cyan-100/80 leading-relaxed">
          {question.description}
        </p>
      </div>

      {/* Problem Statement */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-cyan-200 mb-2">Problem</h3>
        <p className="text-xs text-cyan-100/80 leading-relaxed whitespace-pre-wrap">
          {question.prompt}
        </p>
      </div>

      {/* Sample Test Cases */}
      <div className="mt-auto">
        <h3 className="text-sm font-semibold text-cyan-200 mb-3">
          Sample Test Case(s)
        </h3>
        <div className="space-y-3">
          {question.sampleTestCases && question.sampleTestCases.length > 0 ? (
            question.sampleTestCases.map((testCase, idx) => (
              <div
                key={idx}
                className="bg-slate-800/50 border border-cyan-500/30 rounded-lg p-3"
              >
                <div className="text-xs font-semibold text-cyan-300 mb-2">
                  Example {idx + 1}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-cyan-400 mb-1">📥 Input</div>
                    <pre className="text-xs text-cyan-100/70 font-mono bg-slate-900/50 p-2 rounded border border-cyan-500/20 overflow-auto max-h-16">
                      {testCase.input || 'None'}
                    </pre>
                  </div>
                  <div>
                    <div className="text-xs text-cyan-400 mb-1">📤 Output</div>
                    <pre className="text-xs text-cyan-100/70 font-mono bg-slate-900/50 p-2 rounded border border-cyan-500/20 overflow-auto max-h-16">
                      {testCase.output}
                    </pre>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <>
              <div className="bg-slate-800/50 border border-cyan-500/30 rounded-lg p-3">
                <div className="text-xs font-semibold text-cyan-300 mb-1">
                  📥 Input
                </div>
                <pre className="text-xs text-cyan-100/70 font-mono bg-slate-900/50 p-2 rounded border border-cyan-500/20 overflow-auto max-h-20">
                  {question.sampleInput}
                </pre>
              </div>
              <div className="bg-slate-800/50 border border-cyan-500/30 rounded-lg p-3">
                <div className="text-xs font-semibold text-cyan-300 mb-1">
                  📤 Expected Output
                </div>
                <pre className="text-xs text-cyan-100/70 font-mono bg-slate-900/50 p-2 rounded border border-cyan-500/20 overflow-auto max-h-20">
                  {question.sampleOutput}
                </pre>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
