import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import QuestionManager from './QuestionManager.jsx';
import SubmissionViewer from './SubmissionViewer.jsx';
import UserManager from './UserManager.jsx';
import PermissionManager from './PermissionManager.jsx';
import ProtectedAdminRoute from './components/ProtectedAdminRoute.jsx';
import { AuthProvider } from './AuthContext.jsx';
import './index.css';

// Redirect component that sends users to the main login page
function RedirectToLogin() {
  useEffect(() => {
    window.location.href = 'http://localhost:3000';
  }, []);
  return null;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter basename={(import.meta.env.BASE_URL || '/admin/').replace(/\/$/, '')}>
        <Routes>
          {/* Redirect /login to login page, but let all other routes through */}
          <Route path="/login" element={<RedirectToLogin />} />

          <Route 
            path="/" 
            element={
              <ProtectedAdminRoute>
                <QuestionManager />
              </ProtectedAdminRoute>
            } 
          />
          <Route 
            path="/questions" 
            element={
              <ProtectedAdminRoute>
                <QuestionManager />
              </ProtectedAdminRoute>
            } 
          />
          <Route 
            path="/submissions" 
            element={
              <ProtectedAdminRoute>
                <SubmissionViewer />
              </ProtectedAdminRoute>
            } 
          />
          <Route 
            path="/users" 
            element={
              <ProtectedAdminRoute>
                <UserManager />
              </ProtectedAdminRoute>
            } 
          />
          <Route 
            path="/permissions" 
            element={
              <ProtectedAdminRoute>
                <PermissionManager />
              </ProtectedAdminRoute>
            } 
          />
          {/* Catch-all for any paths under the admin basename */}
          <Route 
            path="/*" 
            element={
              <ProtectedAdminRoute>
                <QuestionManager />
              </ProtectedAdminRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
