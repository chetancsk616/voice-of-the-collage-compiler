import MarkdownRenderer from './MarkdownRenderer';

export default function AIPanel({
  aiResponse,
  aiModel,
  suggestedCode,
  onShowDiff,
}) {
  return (
    <div className="vibe-card border-2 border-pink-500/40 rounded-2xl p-6 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-pink-300">🤖 AI</h3>
        {aiModel && (
          <span className="text-xs px-2 py-1 bg-pink-600/30 border border-pink-500/50 text-pink-300 rounded-full">
            {aiModel}
          </span>
        )}
      </div>
      {suggestedCode && (
        <button
          onClick={onShowDiff}
          className="mb-2 px-2 py-1 text-xs bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg font-semibold w-fit"
        >
          👀 Suggestion
        </button>
      )}
      <div
        className="bg-slate-900/80 border border-pink-500/30 rounded-lg p-4 text-sm text-pink-100 overflow-auto"
        style={{ maxHeight: '330px', minHeight: '60px' }}
      >
        {aiResponse ? (
          <MarkdownRenderer content={aiResponse} />
        ) : (
          <span className="text-pink-400/50 italic text-xs">
            Ask me something...
          </span>
        )}
      </div>
    </div>
  );
}
