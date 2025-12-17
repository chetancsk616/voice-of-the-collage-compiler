export default function LoadingSpinner({ running, asking }) {
  if (!running && !asking) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center pointer-events-none"
      style={{ zIndex: 40 }}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 border-4 border-purple-400 border-t-pink-400 rounded-full animate-spin" />
        <div className="text-purple-200 text-sm font-semibold">
          {running ? '✨ Compiling...' : '🤖 Thinking...'}
        </div>
      </div>
    </div>
  );
}
