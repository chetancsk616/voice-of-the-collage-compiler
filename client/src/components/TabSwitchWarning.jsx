export default function TabSwitchWarning({ show, onDismiss }) {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center p-4"
      style={{ zIndex: 110 }}
      onClick={onDismiss}
    >
      <div
        className="vibe-card border-2 border-yellow-500/50 rounded-2xl p-8 max-w-md shadow-2xl animate-pulse"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">⚠️</span>
          <h2 className="text-2xl font-bold text-yellow-300">Tab Switched</h2>
        </div>
        <p className="text-yellow-100/80 mb-6 leading-relaxed">
          You've switched tabs or minimized the browser. Remember to save your
          work and monitor your code execution status.
        </p>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-6">
          <p className="text-sm text-yellow-200">
            💡 <strong>Tip:</strong> Keep this tab open to monitor code
            execution in real-time.
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="w-full px-6 py-3 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white rounded-lg font-bold shadow-lg hover:shadow-yellow-500/50 transition-all"
        >
          ✓ Got it, I'm back!
        </button>
      </div>
    </div>
  );
}
