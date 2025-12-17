export default function Toast({ toast }) {
  if (!toast) return null;

  return (
    <div className="fixed top-6 right-6" style={{ zIndex: 50 }}>
      <div
        className={`px-4 py-3 rounded-lg backdrop-blur-md text-white font-semibold shadow-xl ${
          toast.type === 'error'
            ? 'bg-red-600/80 border border-red-400'
            : toast.type === 'warning'
              ? 'bg-yellow-600/80 text-white border border-yellow-400'
              : 'bg-purple-600/80 border border-purple-400'
        }`}
      >
        {toast.message}
      </div>
    </div>
  );
}
