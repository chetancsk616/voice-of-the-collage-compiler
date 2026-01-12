import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from './config';

const UserManager = () => {
  const { user, getIdToken, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = await (getIdToken ? getIdToken() : user.getIdToken());
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGrantAdmin = async (uid) => {
    if (!confirm('Grant admin access to this user?')) return;

    try {
      const token = await (getIdToken ? getIdToken() : user.getIdToken());
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${uid}/grant-admin`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to grant admin access');
      
      alert('Admin access granted successfully');
      fetchUsers();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleRevokeAdmin = async (uid) => {
    if (!confirm('Revoke admin access from this user?')) return;

    try {
      const token = await (getIdToken ? getIdToken() : user.getIdToken());
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${uid}/revoke-admin`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to revoke admin access');
      
      alert('Admin access revoked successfully');
      fetchUsers();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-xl">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">User Management</h1>
          <div className="flex gap-3">
              <button 
                onClick={() => navigate('/questions')}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition"
            >
              📝 Questions
            </button>
              <button 
                onClick={() => navigate('/submissions')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
            >
              📊 Submissions
            </button>
            <button 
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
            >
              ← Back
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <input
            type="text"
            placeholder="🔍 Search users by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Users Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left">Email</th>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Role</th>
                <th className="px-6 py-3 text-left">Joined</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-t border-gray-700 hover:bg-gray-750">
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">{user.name || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-sm ${
                      user.role === 'admin' ? 'bg-purple-900/30 text-purple-400' : 'bg-gray-700'
                    }`}>
                      {user.role || 'User'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {user.role !== 'admin' ? (
                      <button
                        onClick={() => handleGrantAdmin(user.id)}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
                      >
                        Grant Admin
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRevokeAdmin(user.id)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                      >
                        Revoke Admin
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/users/${user.id}`)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredUsers.length === 0 && (
            <div className="px-6 py-12 text-center text-gray-400">
              No users found
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            label="Total Users" 
            value={users.length}
            color="blue"
          />
          <StatCard 
            label="Admin Users" 
            value={users.filter(u => u.role === 'admin').length}
            color="purple"
          />
          <StatCard 
            label="Regular Users" 
            value={users.filter(u => u.role !== 'admin').length}
            color="green"
          />
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-900/30 border-blue-500',
    purple: 'bg-purple-900/30 border-purple-500',
    green: 'bg-green-900/30 border-green-500'
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-6`}>
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
};

export default UserManager;

