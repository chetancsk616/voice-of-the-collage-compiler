import React, { useState, useEffect } from 'react';
import questionsData from './questions.json';

export default function Home({ onSelectQuestion, user, logout, onShowAuth }) {
  const [questions, setQuestions] = useState([]);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    setQuestions(questionsData.questions);
  }, []);

  const filteredQuestions =
    filter === 'All'
      ? questions
      : questions.filter((q) => q.difficulty === filter);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy':
        return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'Medium':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'Hard':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      default:
        return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1"></div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent flex-1">
              🚀 Code Challenge Arena
            </h1>
            <div className="flex-1 flex justify-end">
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
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all shadow-lg"
                >
                  Login / Sign Up
                </button>
              )}
            </div>
          </div>
          <p className="text-purple-300/70 text-lg">
            Master coding with curated challenges and instant feedback
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex gap-3 mb-8 justify-center flex-wrap">
          {['All', 'Easy', 'Medium', 'Hard'].map((difficulty) => (
            <button
              key={difficulty}
              onClick={() => setFilter(difficulty)}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                filter === difficulty
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-slate-800/50 border border-purple-500/30 text-purple-300 hover:border-purple-500/60'
              }`}
            >
              {difficulty}
            </button>
          ))}
        </div>

        {/* Questions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuestions.map((question) => (
            <div
              key={question.id}
              onClick={() => onSelectQuestion(question)}
              className="vibe-card border-2 border-purple-500/40 rounded-2xl p-6 hover:border-purple-500/80 cursor-pointer transition-all hover:shadow-lg hover:shadow-purple-500/20 group"
            >
              {/* Question ID and Difficulty */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-purple-400">
                  #{question.id}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${getDifficultyColor(question.difficulty)}`}
                >
                  {question.difficulty}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold text-purple-300 mb-2 group-hover:text-purple-200 transition-colors">
                {question.title}
              </h2>

              {/* Description */}
              <p className="text-purple-200/70 text-sm mb-4 line-clamp-2">
                {question.description}
              </p>

              {/* Languages */}
              <div className="flex flex-wrap gap-2 mb-4">
                {question.languages.map((lang) => (
                  <span
                    key={lang}
                    className="text-xs px-2 py-1 bg-slate-800/60 border border-purple-500/30 text-purple-300 rounded"
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
              <button className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-bold text-sm transition-all">
                Start Challenge →
              </button>
            </div>
          ))}
        </div>

        {/* No Questions */}
        {filteredQuestions.length === 0 && (
          <div className="text-center py-16">
            <p className="text-purple-400/60 text-lg">
              No challenges found for this difficulty level
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
