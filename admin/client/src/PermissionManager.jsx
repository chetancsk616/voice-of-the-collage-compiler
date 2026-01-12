import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { auth } from './firebase';

const API_URL = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:4100/api';

export default function PermissionManager() {
  const [users, setUsers] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState({});
  const [presets, setPresets] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData(true);
  }, []);

  const fetchData = async (showFullScreen = false) => {
    try {
      if (showFullScreen) {
        setInitialLoading(true);
      } else {
        setUpdating(true);
      }
      const token = await auth.currentUser?.getIdToken();
      
      const [usersRes, permsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/users-with-permissions`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/admin/permissions/available`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setUsers(usersRes.data.users || []);
      setAvailablePermissions(permsRes.data.permissions || {});
      setPresets(permsRes.data.presets || {});
      setError('');
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load permission data');
    } finally {
      setInitialLoading(false);
      setUpdating(false);
    }
  };

  const updateUserPermissions = async (userId, permissions) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      await axios.post(
        `${API_URL}/admin/permissions/user/${userId}`,
        { permissions },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccessMessage('Permissions updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      await fetchData();
    } catch (err) {
      console.error('Error updating permissions:', err);
      setError('Failed to update permissions');
    }
  };

  const applyPreset = async (userId, presetName) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      await axios.post(
        `${API_URL}/admin/permissions/user/${userId}/preset/${presetName}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccessMessage(`${presetName} preset applied successfully`);
      setTimeout(() => setSuccessMessage(''), 3000);
      await fetchData();
    } catch (err) {
      console.error('Error applying preset:', err);
      setError('Failed to apply preset');
    }
  };

  const togglePermission = async (userId, permissionKey, currentValue) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    const updatedPermissions = {
      ...user.permissions,
      [permissionKey]: !currentValue
    };
    
    await updateUserPermissions(userId, updatedPermissions);
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Loading permissions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 clean-hero">
          <div>
            <h1 className="text-4xl font-bold text-900">Permission Manager</h1>
            <p className="muted">Grant or revoke permissions for users</p>
          </div>
          <button
            onClick={() => fetchData(false)}
            className="clean-button primary-blue"
          >
            🔄 Refresh
          </button>
        </div>

        {updating && (
          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/40 rounded text-blue-200 text-sm">
            Refreshing permission data...
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-200">
            {successMessage}
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search users by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
          />
        </div>

        {/* Users Grid */}
        <div className="grid gap-6">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="clean-card p-6"
            >
              {/* User Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                    {user.name}
                    {user.isAdmin && (
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full">
                        ADMIN
                      </span>
                    )}
                  </h3>
                  <p className="text-gray-400">{user.email}</p>
                  <p className="text-gray-500 text-sm mt-1">
                    ID: {user.id.substring(0, 12)}...
                  </p>
                </div>
                
                {/* Preset Buttons */}
                <div className="flex gap-2">
                  {Object.keys(presets).map((presetName) => (
                    <button
                      key={presetName}
                      onClick={() => applyPreset(user.id, presetName)}
                      className={`clean-button ${presetName === 'admin' ? 'accent-red' : presetName === 'teacher' ? 'primary-blue' : 'secondary-green'}`}
                      disabled={user.isAdmin}
                    >
                      {presetName.charAt(0).toUpperCase() + presetName.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Permissions Grid */}
              {!user.isAdmin && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(availablePermissions).map(([key, info]) => {
                    const hasPermission = user.permissions?.[key] === true;
                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between p-3 clean-card"
                      >
                        <div className="flex-1">
                          <div className="text-900 font-medium text-sm">
                            {info.label}
                          </div>
                          <div className="muted text-xs">
                            {info.description}
                          </div>
                        </div>
                        <button
                          onClick={() => togglePermission(user.id, key, hasPermission)}
                          className={`ml-3 w-12 h-6 rounded-full transition ${
                            hasPermission ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white transition transform ${
                              hasPermission ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {user.isAdmin && (
                <div className="text-center py-4 text-gray-400">
                  Admins have all permissions by default
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No users found matching your search
          </div>
        )}
      </div>
    </div>
  );
}
