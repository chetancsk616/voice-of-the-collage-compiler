export default function LoadingSpinner({ running, asking }) {
  if (!running && !asking) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center pointer-events-none" style={{ zIndex: 40 }}>
      <div className="clean-card w-56 p-4 flex flex-col items-center gap-3 card-accent fade-in-up">
        <div className="w-12 h-12 border-4 rounded-full border-t-primary-600 animate-spin" style={{ borderColor: 'rgba(59,130,246,0.18)', borderTopColor: 'var(--primary)' }} />
        <div className="text-gray-700 text-sm font-semibold">{running ? '✨ Compiling...' : '🤖 Thinking...'}</div>
      </div>
    </div>
  );
}
