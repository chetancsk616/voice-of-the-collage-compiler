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
    <div className="clean-card flex flex-col">
      {/* Header with Status and Language Selector */}
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-800">💻 Code</h2>
          {status === 'running' && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full border border-yellow-200">
              ⚙️
            </span>
          )}
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="ml-3 px-2 py-1 border border-gray-300 text-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        className="w-full border border-gray-300 text-gray-800 rounded-lg p-3 font-mono text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        style={{ height: '300px' }}
        placeholder="Write your code here..."
      />

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mt-3">
        <button
          onClick={onRun}
          disabled={running}
          className="clean-button secondary-green disabled:opacity-50"
        >
          {running ? '⚙️' : '▶️'} Run
        </button>
        {running && (
          <button
            onClick={onCancel}
            className="clean-button bg-yellow-100 hover:bg-yellow-200 text-yellow-800"
          >
            ⏹️
          </button>
        )}
        {currentQuestion && (
          <button
            onClick={onSubmitForEvaluation}
            disabled={running || submitting}
            className="clean-button accent-red disabled:opacity-50"
          >
            {submitting ? '⏳' : '🚀'} Evaluate
          </button>
        )}
        <button
          onClick={onAsk}
          disabled={asking}
          className="clean-button primary-blue disabled:opacity-50"
        >
          {asking ? '🤔' : '🤖'} Ask
        </button>
        {asking && (
          <button
            onClick={onCancel}
            className="clean-button bg-yellow-100 hover:bg-yellow-200 text-yellow-800"
          >
            ⏹️
          </button>
        )}
        <button
          onClick={onClear}
          className="clean-button bg-gray-100 hover:bg-gray-200 text-gray-700"
        >
          🗑️
        </button>
      </div>

      {/* Input/Prompt Grid */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            💬 Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onCopy={handleCopyPaste}
            onCut={handleCopyPaste}
            onPaste={handleCopyPaste}
            className="w-full border border-gray-300 text-gray-800 rounded p-1.5 text-xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            rows={2}
            placeholder="What would you like?"
          />
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            📥 Input
          </label>
          <textarea
            value={stdinInput}
            onChange={(e) => setStdinInput(e.target.value)}
            onCopy={handleCopyPaste}
            onCut={handleCopyPaste}
            onPaste={handleCopyPaste}
            className="w-full border border-gray-300 text-gray-800 rounded p-1.5 text-xs font-mono placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            rows={2}
            placeholder="stdin..."
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
          <div className="text-xs font-semibold text-gray-700 mb-2">
            ⚡ Quick Actions
          </div>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => onAskPreset('explain')}
              className="clean-button primary-blue text-xs"
            >
              📝 Error
            </button>
            <button
              onClick={() => onAskPreset('optimize')}
              className="clean-button secondary-green text-xs"
            >
              ⚡ Opt
            </button>
            <button
              onClick={() => onAskPreset('comments')}
              className="clean-button primary-blue text-xs"
            >
              💬 Docs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
