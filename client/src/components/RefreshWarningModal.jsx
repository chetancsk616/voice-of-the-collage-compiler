export default function RefreshWarningModal({ show, onConfirm, onCancel }) {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center p-4"
      style={{ zIndex: 110 }}
      onClick={onCancel}
    >
      <div 
        className="vibe-card border-2 border-yellow-500/50 rounded-2xl p-8 max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">⚠️</span>
          <h2 className="text-2xl font-bold text-yellow-300">
            Unsaved Changes
          </h2>
        </div>
        <p className="text-yellow-100/80 mb-6">
          All your work will be reset if you refresh. Are you sure you want to
          continue?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-white rounded-lg font-bold transition-all"
          >
            ✓ Refresh
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-slate-700/60 hover:bg-slate-700 border border-slate-600 text-slate-300 rounded-lg font-semibold"
          >
            ✕ Keep Working
          </button>
        </div>
      </div>
    </div>
  );
}
