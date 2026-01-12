/**
 * Audit Logger (DEPRECATED FOR AI OVERRIDES)
 *
 * The AI override capability has been removed from the evaluation pipeline.
 * These utilities remain available for backward compatibility but AI override
 * logging is effectively a no-op. Other audit helpers return empty results.
 */

const fs = require('fs').promises;
const path = require('path');

// In-memory audit log (last 1000 entries)
const auditLog = [];
const MAX_LOG_SIZE = 1000;

// Optional: Path to persistent log file
const LOG_FILE_PATH = path.join(__dirname, '../logs/ai-override-audit.jsonl');

/**
 * Log an AI override decision
 * @param {Object} logEntry - Log entry data
 */
async function logAIOverride(logEntry) {
  // AI override logging is deprecated and disabled. This function intentionally
  // performs no persistent logging to avoid misleading audit data.
  console.warn('[Audit] logAIOverride called, but AI override logging is disabled. Entry ignored.');
  return;
}

/**
 * Get recent audit log entries
 * @param {Number} limit - Number of entries to retrieve
 * @returns {Array} Recent audit log entries
 */
function getRecentAuditLogs(limit = 100) {
  return auditLog.slice(-limit);
}

/**
 * Get audit statistics
 * @returns {Object} Audit statistics
 */
function getAuditStatistics() {
  if (auditLog.length === 0) {
    return {
      totalDecisions: 0,
      overridesApplied: 0,
      overridesRejected: 0,
      overrideRate: 0,
      averageMarksRestored: 0,
      byLevel: {}
    };
  }
  
  const totalDecisions = auditLog.length;
  const overridesApplied = auditLog.filter(e => e.aiOverrideApplied).length;
  const overridesRejected = totalDecisions - overridesApplied;
  
  const marksRestored = auditLog
    .filter(e => e.aiOverrideApplied)
    .map(e => e.marksRestored || 0);
  
  const averageMarksRestored = marksRestored.length > 0
    ? marksRestored.reduce((a, b) => a + b, 0) / marksRestored.length
    : 0;
  
  // Statistics by level
  const byLevel = {};
  ['easy', 'medium', 'hard'].forEach(level => {
    const levelEntries = auditLog.filter(e => e.questionLevel?.toLowerCase() === level);
    const levelOverrides = levelEntries.filter(e => e.aiOverrideApplied).length;
    
    byLevel[level] = {
      total: levelEntries.length,
      overridden: levelOverrides,
      rate: levelEntries.length > 0 ? (levelOverrides / levelEntries.length * 100).toFixed(1) + '%' : '0%'
    };
  });
  
  return {
    totalDecisions,
    overridesApplied,
    overridesRejected,
    overrideRate: (overridesApplied / totalDecisions * 100).toFixed(1) + '%',
    averageMarksRestored: averageMarksRestored.toFixed(1),
    byLevel
  };
}

/**
 * Get audit logs for a specific user
 * @param {String} userId - User ID
 * @returns {Array} User's audit log entries
 */
function getUserAuditLogs(userId) {
  return auditLog.filter(e => e.userId === userId);
}

/**
 * Get audit logs for a specific question
 * @param {String} questionId - Question ID
 * @returns {Array} Question's audit log entries
 */
function getQuestionAuditLogs(questionId) {
  return auditLog.filter(e => e.questionId === questionId);
}

/**
 * Ensure log directory exists
 */
async function ensureLogDirectory() {
  const logDir = path.dirname(LOG_FILE_PATH);
  try {
    await fs.access(logDir);
  } catch {
    await fs.mkdir(logDir, { recursive: true });
  }
}

/**
 * Clear in-memory audit log (for testing)
 */
function clearAuditLog() {
  auditLog.length = 0;
}

module.exports = {
  logAIOverride,
  getRecentAuditLogs,
  getAuditStatistics,
  getUserAuditLogs,
  getQuestionAuditLogs,
  clearAuditLog
};
