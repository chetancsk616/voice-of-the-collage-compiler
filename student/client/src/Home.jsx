import React, { useState, useMemo } from 'react';

export default function Home({
  onSelectQuestion,
  user,
  isAdmin,
  logout,
  onShowAuth,
  questions,
  loading,
  error,
  onShowLogoutConfirm,
}) {
  const [filter, setFilter] = useState('All');

  const filteredQuestions = useMemo(() => {
    if (!questions) return [];
    return filter === 'All'
      ? questions
      : questions.filter((q) => q.difficulty === filter);
  }, [questions, filter]);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy':
        return 'badge badge-easy accent-green';
      case 'Medium':
        return 'badge badge-medium accent-yellow';
      case 'Hard':
        return 'badge badge-hard accent-red';
      default:
        return 'badge badge-medium';
    }
  };

  return (
    <div className="min-h-screen light-bg p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1"></div>
            <h1 className="text-5xl font-bold text-gray-800 flex-1">
              🚀 Code Challenge Arena
            </h1>
            <div className="flex-1 flex justify-end">
              {user ? (
                <div className="flex items-center gap-3">
                  {isAdmin && (
                    <a
                      href="/admin/"
                      className="clean-button primary-blue text-sm"
                      title="Admin Panel"
                    >
                      ⚙️ Admin
                    </a>
                  )}
                  <div className="text-right">
                    <p className="text-gray-700 font-medium text-sm">
                      {user.displayName || 'User'}
                    </p>
                    <p className="text-gray-500 text-xs">{user.email}</p>
                  </div>
                  <button
                    onClick={onShowLogoutConfirm}
                    className="clean-button accent-red text-sm"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={onShowAuth}
                  className="clean-button primary-blue"
                >
                  Login / Sign Up
                </button>
              )}
            </div>
          </div>
          <p className="text-gray-600 text-lg">
            Master coding with curated challenges and instant feedback
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex gap-3 mb-8 justify-center flex-wrap">
          {['All', 'Easy', 'Medium', 'Hard'].map((difficulty) => (
            <button
              key={difficulty}
              onClick={() => setFilter(difficulty)}
              className={`clean-button ${
                filter === difficulty
                  ? 'primary-blue'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {difficulty}
            </button>
          ))}
        </div>

        {/* Questions Grid */}
        {loading && (
          <div className="text-center text-gray-600 py-10">
            Loading challenges from the cloud...
          </div>
        )}

        {error && !loading && (
          <div className="text-center text-red-600 py-10">
            Could not load challenges. Please try again.
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuestions.map((question) => (
            <div
              key={question.id}
              onClick={() => onSelectQuestion(question)}
              className={`clean-card card-accent cursor-pointer transition-all group ${question.difficulty === 'Easy' ? 'accent-green' : question.difficulty === 'Medium' ? 'accent-yellow' : 'accent-red'}`}
            >
              {/* Question ID and Difficulty */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-600">
                  #{question.id}
                </span>
                <span className={getDifficultyColor(question.difficulty)}>
                  {question.difficulty}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                {question.title}
              </h2>

              {/* Description */}
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {question.description}
              </p>

              {/* Languages */}
              <div className="flex flex-wrap gap-2 mb-4">
                {question.languages.map((lang) => (
                  <span
                    key={lang}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                  >
                    {lang === 'python3' ? '🐍' : lang === 'node' ? '⚡' : '🔧'}{' '}
                    {lang === 'python3'
                      ? 'Python'
                      : lang === 'node'
                        ? 'Node'
                        : 'C'}
                  </span>
                ))}
              </div>

              {/* Start Button */}
              <button className="w-full clean-button primary-blue text-sm">
                Start Challenge →
              </button>
            </div>
            ))}
          </div>
        )}

        {/* No Questions */}
        {!loading && !error && filteredQuestions.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">
              No challenges found for this difficulty level
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
