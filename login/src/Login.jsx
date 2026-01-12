import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { auth } from './firebase';
import { useAuth } from './AuthContext';
import { FaGoogle } from 'react-icons/fa';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoutMessage, setLogoutMessage] = useState('');
  const { user, userRole } = useAuth();

  // Check for logout flag and display toast
  useEffect(() => {
    const loggedOut = localStorage.getItem('loggedOut');
    if (loggedOut) {
      setLogoutMessage('You have been logged out.');
      localStorage.removeItem('loggedOut');
      const timer = setTimeout(() => setLogoutMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Note: Do not auto-redirect on existing auth to avoid cross-origin loops.
  // Redirects are performed explicitly after successful login below.

  // Handle Google redirect result (fallback when popup is blocked)
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const result = await getRedirectResult(auth);
        if (!isMounted || !result) return;

        const token = await result.user.getIdTokenResult();

        const desired = localStorage.getItem('desiredUserType');
        if (desired) localStorage.removeItem('desiredUserType');

        if (desired === 'admin' && token.claims.role !== 'admin') {
          await auth.signOut();
          setError('You do not have admin access. Please contact an administrator.');
          return;
        }

        const effectiveRole = token.claims.role === 'admin' ? 'admin' : 'student';
        const redirectUrl = effectiveRole === 'admin'
          ? 'http://localhost:3001/admin/'
          : 'http://localhost:3002';
        window.location.href = redirectUrl;
      } catch (err) {
        // No-op if there is no redirect result or an expected error occurs
        if (err && err.code && !String(err.code).startsWith('auth/')) {
          console.error('Redirect result error:', err);
        }
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const token = await result.user.getIdTokenResult();

      // Validate admin selection against actual claims
      if (userType === 'admin' && token.claims.role !== 'admin') {
        await auth.signOut();
        setError('You do not have admin access. Please contact an administrator.');
        setLoading(false);
        return;
      }

      // Use actual role for redirect
      const effectiveRole = token.claims.role === 'admin' ? 'admin' : 'student';
      const redirectUrl = effectiveRole === 'admin'
        ? 'http://localhost:3000/admin/'
        : 'http://localhost:3000/student/';
      window.location.href = redirectUrl;
    } catch (err) {
      console.error('Login error:', err);
      if (err.code === 'auth/user-not-found') {
        setError('User not found. Please sign up first.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdTokenResult();

      if (userType === 'admin' && token.claims.role !== 'admin') {
        await auth.signOut();
        setError('You do not have admin access. Please contact an administrator.');
        setLoading(false);
        return;
      }

      // Redirect based on actual role
      const effectiveRole = token.claims.role === 'admin' ? 'admin' : 'student';
      const redirectUrl = effectiveRole === 'admin'
        ? 'http://localhost:3000/admin/'
        : 'http://localhost:3000/student/';
      window.location.href = redirectUrl;
    } catch (err) {
      console.error('Google login error:', err);
      if (err?.code === 'auth/popup-blocked') {
        try {
          const provider = new GoogleAuthProvider();
          localStorage.setItem('desiredUserType', userType);
          await signInWithRedirect(auth, provider);
          return; // Browser will redirect
        } catch (redirErr) {
          console.error('Google redirect fallback failed:', redirErr);
          setError(redirErr.message || 'Google login failed.');
        }
      } else if (err?.code === 'auth/cancelled-popup-request' || err?.code === 'auth/popup-closed-by-user') {
        setError('Popup closed before completing sign-in. Please try again.');
      } else {
        setError(err.message || 'Google login failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen light-bg flex items-center justify-center p-6">
      <div className="clean-card max-w-md w-full p-8 fade-in-up">
        <div className="text-center mb-8 login-hero fade-in-up">
          <h1 className="text-5xl font-extrabold text-gray-800 mb-2">AI Web Compiler</h1>
          <p className="text-muted">Unified Login Portal</p>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-5">
          {/* User Type Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Login As
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUserType('student')}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition duration-200 ${
                  userType === 'student'
                    ? 'primary-blue text-black'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                👤 Student
              </button>
              <button
                type="button"
                onClick={() => setUserType('admin')}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition duration-200 ${
                  userType === 'admin'
                    ? 'primary-blue text-black'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                👨‍💼 Admin
              </button>
            </div>
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100"
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100"
            />
          </div>

          {/* Logout Message */}
          {logoutMessage && (
            <div className="secondary-green-bg border border-green-200 rounded-lg p-3 text-green-700 text-sm">
              ✓ {logoutMessage}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="accent-red-bg border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full clean-button primary-blue disabled:opacity-50"
          >
            {loading ? 'Logging in...' : `Login as ${userType === 'admin' ? 'Admin' : 'Student'}`}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        {/* Google Login */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          type="button"
          className="w-full bg-white border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-2 rounded-lg transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <FaGoogle className="text-red-500" />
          Google Login
        </button>

        {/* Info Box */}
        <div className="mt-8 p-4 primary-blue-bg rounded-lg border border-blue-200">
          <p className="text-xs text-gray-700">
            <strong>Demo Credentials:</strong><br />
            • Student: student@test.com / password123<br />
            • Admin: admin@test.com / admin123
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-xs mt-6">
          After login, you'll be redirected to your respective portal
        </p>
      </div>
    </div>
  );
}
