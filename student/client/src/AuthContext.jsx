import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  getIdTokenResult,
} from 'firebase/auth';
import { auth } from './firebase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const result = await getIdTokenResult(firebaseUser, true);
          const customClaims = result?.claims || {};
          setClaims(customClaims);
          setIsAdmin(Boolean(customClaims.admin) || customClaims.role === 'admin');
        } catch (err) {
          console.warn('Failed to load custom claims:', err?.message || err);
          setClaims(null);
          setIsAdmin(false);
        }
      } else {
        setClaims(null);
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Sign up with email and password
  const signup = async (email, password, displayName) => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }
    return userCredential;
  };

  // Sign in with email and password
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Sign in with Google
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  // Sign out and redirect to unified login (called after modal confirmation)
  const performLogout = async () => {
    try {
      await signOut(auth);
    } finally {
      localStorage.setItem('loggedOut', 'true');
      localStorage.removeItem('awc.currentPage');
      localStorage.removeItem('awc.questionId');
      // Redirect to student root (will show auth modal)
      const BASE = (import.meta.env.BASE_URL || '/student/').replace(/\/$/, '');
      window.location.href = BASE + '/';
    }
  };

  // Force refresh token and claims (useful after granting admin)
  const refreshClaims = async () => {
    if (!auth.currentUser) return null;
    const result = await getIdTokenResult(auth.currentUser, true);
    const customClaims = result?.claims || {};
    setClaims(customClaims);
    setIsAdmin(Boolean(customClaims.admin) || customClaims.role === 'admin');
    return customClaims;
  };

  // Get a fresh ID token for authorized API calls
  const getIdToken = async () => {
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken(true);
  };

  const value = {
    user,
    loading,
    claims,
    isAdmin,
    signup,
    login,
    loginWithGoogle,
    logout: performLogout,
    refreshClaims,
    getIdToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
