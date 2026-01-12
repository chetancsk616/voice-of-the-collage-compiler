import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import LogoutConfirmModal from './components/LogoutConfirmModal';
import { API_BASE_URL } from './config';

const QuestionManager = () => {
  const { user, getIdToken, logout } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchQuestions();
  }, [difficultyFilter]);

  const fetchQuestions = async () => {
    try {
      const token = await (getIdToken ? getIdToken() : user.getIdToken());
      const params = new URLSearchParams();
      if (difficultyFilter) params.append('difficulty', difficultyFilter);
      
      const response = await fetch(`${API_BASE_URL}/api/admin/questions?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch questions');
      
      const data = await response.json();
      const normalized = (data.questions || []).map((q) => ({
        ...q,
        requiresHiddenTests: q?.requiresHiddenTests !== false,
      }));
      setQuestions(normalized);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = () => {
    setEditingQuestion(null);
    setShowModal(true);
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setShowModal(true);
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const token = await (getIdToken ? getIdToken() : user.getIdToken());
      const response = await fetch(`${API_BASE_URL}/api/admin/questions/${questionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete question');
      
      fetchQuestions();
    } catch (err) {
      alert('Error deleting question: ' + err.message);
    }
  };

  const filteredQuestions = questions.filter(q =>
    q.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen light-bg">
        <div className="text-gray-700 text-xl">Loading questions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen light-bg text-gray-900">
      <LogoutConfirmModal
        show={showLogoutConfirm}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Question Management</h1>
          <div className="flex gap-3">
            <button
              onClick={handleCreateQuestion}
              className="clean-button secondary-green"
            >
              ➕ Add Question
            </button>
            <button
              onClick={() => navigate('/submissions')}
              className="clean-button primary-blue"
            >
              📊 View Submissions
            </button>
            <button
              onClick={() => navigate('/users')}
              className="clean-button primary-blue"
            >
              👥 Manage Users
            </button>
            <button
              onClick={() => navigate('/permissions')}
              className="clean-button primary-blue"
            >
              🔐 Permissions
            </button>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="clean-button accent-red"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="clean-card p-4 mb-6 flex gap-4">
          <input
            type="text"
            placeholder="🔍 Search questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        {/* Questions Table */}
        <div className="clean-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-gray-700 font-semibold">ID</th>
                <th className="px-6 py-3 text-left text-gray-700 font-semibold">Title</th>
                <th className="px-6 py-3 text-left text-gray-700 font-semibold">Difficulty</th>
                <th className="px-6 py-3 text-left text-gray-700 font-semibold">Tags</th>
                <th className="px-6 py-3 text-left text-gray-700 font-semibold">Hidden Tests</th>
                <th className="px-6 py-3 text-right text-gray-700 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.map((q, i) => (
                <tr key={q.id} className={`border-t border-gray-200 hover:bg-gray-50 fade-in-up ${i % 3 === 0 ? 'stagger-1' : i % 3 === 1 ? 'stagger-2' : 'stagger-3'}`}>
                  <td className="px-6 py-4 text-gray-900">{q.id}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{q.title}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      q.difficulty === 'Easy' ? 'secondary-green text-green-800' :
                      q.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'accent-red text-red-800'
                    }`}>
                      {q.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {q.tags?.map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        q.requiresHiddenTests !== false
                          ? 'secondary-green text-green-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {q.requiresHiddenTests !== false ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleEditQuestion(q)}
                      className="clean-button primary-blue text-sm px-3 py-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="clean-button accent-red text-sm px-3 py-1"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredQuestions.length === 0 && (
            <div className="px-6 py-12 text-center text-gray-400">
              No questions found
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <QuestionModal
          question={editingQuestion}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            fetchQuestions();
          }}
          currentUser={user}
          getIdToken={getIdToken}
        />
      )}
    </div>
  );
};

// Question Modal Component
const QuestionModal = ({ question, onClose, onSave, currentUser, getIdToken }) => {
  const [formData, setFormData] = useState({
    title: question?.title || '',
    description: question?.description || '',
    difficulty: question?.difficulty || 'Medium',
    tags: question?.tags?.join(', ') || '',
    testCases: JSON.stringify(question?.testCases || [], null, 2),
    requiresHiddenTests: question?.requiresHiddenTests !== false
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData({
      title: question?.title || '',
      description: question?.description || '',
      difficulty: question?.difficulty || 'Medium',
      tags: question?.tags?.join(', ') || '',
      testCases: JSON.stringify(question?.testCases || [], null, 2),
      requiresHiddenTests: question?.requiresHiddenTests !== false,
    });
  }, [question]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const token = await (getIdToken ? getIdToken() : currentUser.getIdToken());
      const url = question 
        ? `${API_BASE_URL}/api/admin/questions/${question.id}`
        : `${API_BASE_URL}/api/admin/questions`;
      
      const method = question ? 'PUT' : 'POST';
      
      const payload = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        testCases: JSON.parse(formData.testCases),
        requiresHiddenTests: formData.requiresHiddenTests !== false
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to save question');
      
      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="clean-card max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">
            {question ? 'Edit Question' : 'Create New Question'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="accent-red-bg border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
            <select
              value={formData.difficulty}
              onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({...formData, tags: e.target.value})}
              placeholder="arrays, strings, dynamic-programming"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Require Hidden Testcases?</label>
            <select
              value={formData.requiresHiddenTests ? 'yes' : 'no'}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  requiresHiddenTests: e.target.value === 'yes',
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="yes">Yes (default)</option>
              <option value="no">No</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Test Cases (JSON)</label>
            <textarea
              value={formData.testCases}
              onChange={(e) => setFormData({...formData, testCases: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm h-48"
              placeholder='[{"input": "5", "expected_output": "120"}]'
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 clean-button secondary-green disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Question'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="clean-button bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestionManager;

