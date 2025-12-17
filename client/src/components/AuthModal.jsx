import React, { useState } from 'react';
import { useAuth } from '../AuthContext';

export default function AuthModal({
  show,
  onClose,
  mode: initialMode = 'login',
}) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup, loginWithGoogle } = useAuth();

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        await signup(email, password, displayName);
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center p-4"
      style={{ zIndex: 200 }}
      onClick={onClose}
    >
      <div 
        className="vibe-card border-2 border-purple-500/50 rounded-2xl p-8 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-purple-300">
            {mode === 'login' ? '🔐 Login' : '✨ Sign Up'}
          </h2>
          <button
            onClick={onClose}
            className="text-purple-300 hover:text-purple-100 text-2xl"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-semibold text-purple-300 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800/50 border border-purple-500/30 rounded-lg text-purple-100 focus:border-purple-500/60 focus:outline-none"
                placeholder="Your Name"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-purple-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800/50 border border-purple-500/30 rounded-lg text-purple-100 focus:border-purple-500/60 focus:outline-none"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-purple-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800/50 border border-purple-500/30 rounded-lg text-purple-100 focus:border-purple-500/60 focus:outline-none"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-bold shadow-lg hover:shadow-purple-500/50 disabled:opacity-50 transition-all"
          >
            {loading
              ? '⏳ Processing...'
              : mode === 'login'
                ? '🔓 Login'
                : '✨ Sign Up'}
          </button>
        </form>

        <div className="my-4 flex items-center gap-2">
          <div className="flex-1 border-t border-purple-500/30"></div>
          <span className="text-purple-300/60 text-sm">OR</span>
          <div className="flex-1 border-t border-purple-500/30"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full px-4 py-3 bg-white hover:bg-gray-100 text-gray-800 rounded-lg font-bold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="mt-4 text-center text-sm text-purple-300/60">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button
                onClick={() => setMode('signup')}
                className="text-purple-400 hover:text-purple-300 font-semibold"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => setMode('login')}
                className="text-purple-400 hover:text-purple-300 font-semibold"
              >
                Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
