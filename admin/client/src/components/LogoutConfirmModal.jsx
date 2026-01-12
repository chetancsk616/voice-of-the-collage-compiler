export default function LogoutConfirmModal({ show, onConfirm, onCancel }) {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 fade-in-up"
      style={{ zIndex: 90 }}
      onClick={onCancel}
    >
      <div 
        className="clean-card max-w-md w-full card-accent accent-red"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">👋</span>
          <h2 className="text-2xl font-bold text-gray-800">Logout?</h2>
        </div>
        <p className="text-gray-600 mb-6">
          Are you sure you want to logout?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 clean-button accent-red"
          >
            ✓ Logout
          </button>
          <button
            onClick={onCancel}
            className="flex-1 clean-button bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            ✕ Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
