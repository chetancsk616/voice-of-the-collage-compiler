export default function CodeEditor({
  code,
  setCode,
  language,
  setLanguage,
  status,
  running,
  asking,
  submitting,
  currentQuestion,
  onRun,
  onCancel,
  onSubmit,
  onSubmitForEvaluation,
  onAsk,
  onClear,
  onAskPreset,
  prompt,
  setPrompt,
  stdinInput,
  setStdinInput,
  handleEditorKeyDown,
}) {
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    // Don't set any example code - let user type their own
  };

  const handleCopyPaste = (e) => {
    e.preventDefault();
  };

  return (
    <div className="vibe-card backdrop-blur-xl border-2 border-purple-500/40 rounded-2xl p-6 flex flex-col">
      {/* Header with Status and Language Selector */}
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-purple-300">💻 Code</h2>
          {status === 'running' && (
            <span className="text-xs bg-yellow-500/30 text-yellow-300 px-2 py-1 rounded-full border border-yellow-500/50">
              ⚙️
            </span>
          )}
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="ml-3 px-2 py-1 bg-slate-900 border border-purple-500/30 text-purple-100 rounded-lg text-sm focus:border-purple-500/60 focus:outline-none"
          >
            <option value="python3">🐍 Python</option>
            <option value="node">⚡ Node</option>
            <option value="c">🔧 C</option>
          </select>
        </div>
      </div>

      {/* Code Textarea */}
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={handleEditorKeyDown}
        onCopy={handleCopyPaste}
        onCut={handleCopyPaste}
        onPaste={handleCopyPaste}
        className="w-full bg-slate-800/50 border border-purple-500/30 text-purple-100 rounded-lg p-3 font-mono text-sm placeholder-purple-400/40 focus:border-purple-500/60 focus:outline-none resize-none"
        style={{ height: '300px' }}
        placeholder="Write your code here..."
      />

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mt-3">
        <button
          onClick={onRun}
          disabled={running}
          className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg font-bold text-sm shadow-lg hover:shadow-green-500/50 disabled:opacity-50"
        >
          {running ? '⚙️' : '▶️'} Run
        </button>
        {running && (
          <button
            onClick={onCancel}
            className="px-3 py-2 bg-yellow-600/80 hover:bg-yellow-600 text-white rounded-lg font-semibold text-sm"
          >
            ⏹️
          </button>
        )}
        {currentQuestion && (
          <button
            onClick={onSubmitForEvaluation}
            disabled={running || submitting}
            className="px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-lg font-bold text-sm shadow-lg hover:shadow-red-500/50 disabled:opacity-50"
          >
            {submitting ? '⏳' : '🚀'} Evaluate
          </button>
        )}
        <button
          onClick={onAsk}
          disabled={asking}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-bold text-sm shadow-lg hover:shadow-purple-500/50 disabled:opacity-50"
        >
          {asking ? '🤔' : '🤖'} Ask
        </button>
        {asking && (
          <button
            onClick={onCancel}
            className="px-3 py-2 bg-yellow-600/80 hover:bg-yellow-600 text-white rounded-lg font-semibold text-sm"
          >
            ⏹️
          </button>
        )}
        <button
          onClick={onClear}
          className="px-4 py-2 bg-slate-700/60 hover:bg-slate-700 border border-slate-600 text-slate-300 rounded-lg font-semibold text-sm"
        >
          🗑️
        </button>
      </div>

      {/* Input/Prompt Grid */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="vibe-card border border-purple-500/30 rounded-lg p-2">
          <label className="block text-xs font-semibold text-purple-300 mb-1">
            💬 Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onCopy={handleCopyPaste}
            onCut={handleCopyPaste}
            onPaste={handleCopyPaste}
            className="w-full bg-slate-800/50 border border-purple-500/30 text-purple-100 rounded-lg p-1.5 text-xs placeholder-purple-400/40 focus:border-purple-500/60 focus:outline-none resize-none"
            rows={2}
            placeholder="What would you like?"
          />
        </div>

        <div className="vibe-card border border-purple-500/30 rounded-lg p-2">
          <label className="block text-xs font-semibold text-purple-300 mb-1">
            📥 Input
          </label>
          <textarea
            value={stdinInput}
            onChange={(e) => setStdinInput(e.target.value)}
            onCopy={handleCopyPaste}
            onCut={handleCopyPaste}
            onPaste={handleCopyPaste}
            className="w-full bg-slate-800/50 border border-purple-500/30 text-purple-100 rounded-lg p-1.5 text-xs font-mono placeholder-purple-400/40 focus:border-purple-500/60 focus:outline-none resize-none"
            rows={2}
            placeholder="stdin..."
          />
        </div>

        <div className="border border-purple-500/30 rounded-lg p-2 bg-purple-600/10">
          <div className="text-xs font-semibold text-purple-300 mb-2">
            ⚡ Quick Actions
          </div>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => onAskPreset('explain')}
              className="px-2 py-1 bg-purple-600/50 hover:bg-purple-600/70 border border-purple-500/50 text-purple-200 rounded text-xs font-semibold"
            >
              📝 Error
            </button>
            <button
              onClick={() => onAskPreset('optimize')}
              className="px-2 py-1 bg-blue-600/50 hover:bg-blue-600/70 border border-blue-500/50 text-blue-200 rounded text-xs font-semibold"
            >
              ⚡ Opt
            </button>
            <button
              onClick={() => onAskPreset('comments')}
              className="px-2 py-1 bg-cyan-600/50 hover:bg-cyan-600/70 border border-cyan-500/50 text-cyan-200 rounded text-xs font-semibold"
            >
              💬 Docs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
