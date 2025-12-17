import SimpleDiff from './SimpleDiff';

export default function DiffModal({
  show,
  code,
  suggestedCode,
  onClose,
  onApply,
}) {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      style={{ zIndex: 80 }}
      onClick={onClose}
    >
      <div 
        className="vibe-card border-2 border-purple-500/40 w-full max-w-4xl rounded-2xl shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-purple-300">
            ✨ Suggested Change
          </h3>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-purple-500/50 text-purple-300 rounded-lg hover:bg-purple-600/20 font-semibold"
          >
            ✕ Close
          </button>
        </div>
        <div className="h-96 overflow-auto border border-purple-500/30 rounded-lg bg-slate-900/50">
          <SimpleDiff oldValue={code || ''} newValue={suggestedCode || ''} />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onApply}
            className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg font-bold shadow-lg"
          >
            ✅ Apply Suggestion
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-700/60 hover:bg-slate-700 border border-slate-600 text-slate-300 rounded-lg font-semibold"
          >
            ✕ Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
