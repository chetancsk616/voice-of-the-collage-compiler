export default function EditorHeader({
  currentQuestion,
  onExit,
  user,
  logout,
  onShowAuth,
}) {
  if (!currentQuestion) return null;

  return (
    <div className="max-w-7xl mx-auto mb-6 flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold text-purple-300 mb-1">
          {currentQuestion.title}
        </h2>
        <p className="text-purple-400/60">{currentQuestion.description}</p>
      </div>
      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-purple-300 font-medium text-sm">
                {user.displayName || 'User'}
              </p>
              <p className="text-purple-400/60 text-xs">{user.email}</p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-purple-600/50 hover:bg-purple-600/70 border border-purple-500/50 text-purple-200 rounded-lg font-semibold transition-all text-sm"
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={onShowAuth}
            className="px-4 py-2 bg-purple-600/50 hover:bg-purple-600/70 border border-purple-500/50 text-purple-200 rounded-lg font-semibold transition-all text-sm"
          >
            Login
          </button>
        )}
        <button
          onClick={onExit}
          className="px-6 py-2 bg-red-600/50 hover:bg-red-600/70 border border-red-500/50 text-red-200 rounded-lg font-semibold transition-all"
        >
          ✕ Exit
        </button>
      </div>
    </div>
  );
}
