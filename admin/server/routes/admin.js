// Admin API Routes
// Protected routes for admin panel operations

const express = require('express');
const router = express.Router();
const {
  authenticateUser,
  requireAdmin,
  grantAdminAccess,
  revokeAdminAccess,
  adminAuth: admin,
} = require('../middleware/adminAuth');
const { getAuditStatistics, getRecentAuditLogs, getUserAuditLogs, getQuestionAuditLogs } = require('../utils/auditLogger');
const {
  PERMISSIONS,
  DEFAULT_PERMISSIONS,
  getUserPermissions,
  setUserPermissions,
  grantPermission,
  revokePermission,
  applyPermissionPreset,
  getAllUsersWithPermissions,
} = require('../utils/permissionManager');

// Fetch users directly from Firebase Auth so the admin UI reflects real accounts
async function fetchUsers(maxUsers = 500) {
  if (!admin.apps.length) {
    throw new Error('Firebase Admin not initialized');
  }

  const users = [];
  let totalUsers = 0;
  let nextPageToken;

  do {
    const result = await admin.auth().listUsers(1000, nextPageToken);
    totalUsers += result.users.length;

    for (const userRecord of result.users) {
      if (users.length < maxUsers) {
        const claims = userRecord.customClaims || {};
        users.push({
          id: userRecord.uid,
          email: userRecord.email || 'unknown',
          name: userRecord.displayName || userRecord.email?.split('@')[0] || 'N/A',
          role: claims.admin ? 'admin' : 'user',
          createdAt: userRecord.metadata?.creationTime || null,
          lastSignInAt: userRecord.metadata?.lastSignInTime || null,
          disabled: Boolean(userRecord.disabled),
        });
      }
    }

    nextPageToken = result.pageToken;
  } while (nextPageToken);

  return { users, totalUsers };
}

function getDb() {
  if (!admin.apps.length) {
    throw new Error('Firebase Admin not initialized');
  }
  return admin.database();
}

function getFirestore() {
  if (!admin.apps.length) {
    throw new Error('Firebase Admin not initialized');
  }
  return admin.firestore();
}

function normalizeQuestions(data) {
  if (Array.isArray(data)) {
    return data.map(q => ({ ...q, id: q?.id ?? q?.questionId })).sort((a, b) => Number(a.id) - Number(b.id));
  }
  return Object.entries(data || {})
    .map(([id, q]) => ({ ...q, id: q?.id ?? q?.questionId ?? Number(id) }))
    .sort((a, b) => Number(a.id) - Number(b.id));
}

async function readAllQuestions() {
  try {
    const snap = await getDb().ref('questions').once('value');
    const data = snap.val();
    if (!data) return [];
    
    // Handle both array and object formats
    if (Array.isArray(data)) {
      return normalizeQuestions(data);
    }
    
    // If object, convert to array
    const questions = Object.entries(data).map(([key, q]) => {
      return { ...q, id: q?.id ?? q?.questionId ?? Number(key) };
    });
    return questions.sort((a, b) => Number(a.id) - Number(b.id));
  } catch (err) {
    console.error('Error reading questions from RTDB:', err);
    return [];
  }
}

async function readQuestionById(questionId) {
  const snap = await getDb().ref(`questions/${questionId}`).once('value');
  const val = snap.val();
  return val ? { ...val, id: val.id ?? Number(questionId) } : null;
}

function logicKey(questionId) {
  return `Q${String(questionId).padStart(3, '0')}`;
}

async function readReferenceLogic(questionId) {
  const snap = await getDb().ref(`logicDetail/${logicKey(questionId)}`).once('value');
  return snap.val() || null;
}

async function writeReferenceLogic(questionId, logic) {
  await getDb().ref(`logicDetail/${logicKey(questionId)}`).set(logic);
}

async function deleteReferenceLogic(questionId) {
  await getDb().ref(`logicDetail/${logicKey(questionId)}`).remove();
}

// Apply authentication and admin middleware to all routes
router.use(authenticateUser);
router.use(requireAdmin);

// ============================================================================
// QUESTION MANAGEMENT
// ============================================================================

/**
 * GET /api/admin/questions
 * Get all questions with filters
 */
router.get('/questions', async (req, res) => {
  try {
    const { search, difficulty, tag } = req.query;
    
    // Read questions from RTDB
    let questions = (await readAllQuestions()).map((q) => ({
      ...q,
      requiresHiddenTests: q?.requiresHiddenTests !== false,
    }));
    
    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      questions = questions.filter(q => 
        q.title?.toLowerCase().includes(searchLower) ||
        q.description?.toLowerCase().includes(searchLower)
      );
    }
    
    if (difficulty) {
      questions = questions.filter(q => q.difficulty === difficulty);
    }
    
    if (tag) {
      questions = questions.filter(q => q.tags?.includes(tag));
    }
    
    res.json({ 
      success: true, 
      questions,
      total: questions.length 
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

/**
 * GET /api/admin/questions/:id
 * Get single question with reference logic
 */
router.get('/questions/:id', async (req, res) => {
  try {
    const questionId = parseInt(req.params.id);
    const question = await readQuestionById(questionId);

    if (question) {
      question.requiresHiddenTests = question?.requiresHiddenTests !== false;
    }

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const referenceLogic = await readReferenceLogic(questionId);

    res.json({ 
      success: true, 
      question,
      referenceLogic 
    });
  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({ error: 'Failed to fetch question' });
  }
});

/**
 * POST /api/admin/questions
 * Create new question
 */
router.post('/questions', async (req, res) => {
  try {
    const { title, description, difficulty, tags, testCases, referenceLogic } = req.body;
    
    // Validation
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }
    
    // Read existing questions
    const questions = await readAllQuestions();
    
    // Generate new ID
    const newId = questions.length > 0 
      ? Math.max(...questions.map(q => Number(q.id))) + 1 
      : 1;
    
    // Create new question
    const newQuestion = {
      id: newId,
      title,
      description,
      difficulty: difficulty || 'Medium',
      tags: tags || [],
      testCases: testCases || [],
      requiresHiddenTests: req.body?.requiresHiddenTests !== false,
      createdAt: new Date().toISOString(),
      createdBy: req.user.email
    };
    
    // Save question to RTDB
    await getDb().ref(`questions/${newId}`).set(newQuestion);
    
    // Save reference logic if provided
    if (referenceLogic) {
      await writeReferenceLogic(newId, referenceLogic);
    }
    
    res.json({ 
      success: true, 
      question: newQuestion,
      message: 'Question created successfully' 
    });
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ error: 'Failed to create question' });
  }
});

/**
 * PUT /api/admin/questions/:id
 * Update existing question
 */
router.put('/questions/:id', async (req, res) => {
  try {
    const questionId = parseInt(req.params.id);
    const { title, description, difficulty, tags, testCases, referenceLogic } = req.body;
    
    const existing = await readQuestionById(questionId);
    if (!existing) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const updatedQuestion = {
      ...existing,
      title: title || existing.title,
      description: description || existing.description,
      difficulty: difficulty || existing.difficulty,
      tags: tags !== undefined ? tags : existing.tags,
      testCases: testCases !== undefined ? testCases : existing.testCases,
      requiresHiddenTests:
        req.body?.requiresHiddenTests !== undefined
          ? req.body.requiresHiddenTests !== false
          : existing.requiresHiddenTests !== false,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.email
    };

    await getDb().ref(`questions/${questionId}`).set(updatedQuestion);
    
    // Update reference logic if provided
    if (referenceLogic) {
      await writeReferenceLogic(questionId, referenceLogic);
    }
    
    res.json({ 
      success: true, 
      question: updatedQuestion,
      message: 'Question updated successfully' 
    });
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

/**
 * DELETE /api/admin/questions/:id
 * Delete question
 */
router.delete('/questions/:id', async (req, res) => {
  try {
    const questionId = parseInt(req.params.id);
    
    const existing = await readQuestionById(questionId);
    if (!existing) {
      return res.status(404).json({ error: 'Question not found' });
    }

    await getDb().ref(`questions/${questionId}`).remove();
    await deleteReferenceLogic(questionId);
    
    res.json({ 
      success: true, 
      message: 'Question deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// ============================================================================
// SUBMISSION MANAGEMENT
// ============================================================================

/**
 * GET /api/admin/submissions
 * Get all submissions with filters
 */
router.get('/submissions', async (req, res) => {
  try {
    const { userId, questionId, minScore, maxScore, limit = 100, offset = 0 } = req.query;
    
    let query = getFirestore().collection('submissions');
    
    // Apply filters (ensure values are valid before querying)
    if (userId && userId.trim()) {
      query = query.where('userId', '==', userId);
    }
    if (questionId && !isNaN(parseInt(questionId))) {
      query = query.where('questionId', '==', parseInt(questionId));
    }
    
    const parsedMinScore = parseFloat(minScore);
    if (minScore && !isNaN(parsedMinScore)) {
      query = query.where('score', '>=', parsedMinScore);
    }
    
    const parsedMaxScore = parseFloat(maxScore);
    if (maxScore && !isNaN(parsedMaxScore)) {
      query = query.where('score', '<=', parsedMaxScore);
    }
    
    // Order and paginate
    query = query.orderBy('submittedAt', 'desc').limit(parseInt(limit));
    
    const snapshot = await query.get();
    const submissions = [];
    
    snapshot.forEach(doc => {
      submissions.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({ 
      success: true, 
      total: submissions.length,
      submissions 
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

/**
 * GET /api/admin/submissions/:id
 * Get single submission with full details
 */
router.get('/submissions/:id', async (req, res) => {
  try {
    const submissionId = req.params.id;
    
    const doc = await getFirestore()
      .collection('submissions')
      .doc(submissionId)
      .get();
    
    if (!doc.exists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Submission not found' 
      });
    }
    
    res.json({ 
      success: true, 
      submission: {
        id: doc.id,
        ...doc.data()
      }
    });
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
});

// ============================================================================
// USER MANAGEMENT
// ============================================================================

/**
 * GET /api/admin/users
 * Get all users
 */
router.get('/users', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const parsedLimit = Number(limit);
    const maxUsers = Number.isFinite(parsedLimit)
      ? Math.max(1, Math.min(parsedLimit, 1000))
      : 100;

    const { users, totalUsers } = await fetchUsers(maxUsers);

    res.json({ 
      success: true, 
      users,
      total: totalUsers
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * POST /api/admin/users/:uid/grant-admin
 * Grant admin access to a user
 */
router.post('/users/:uid/grant-admin', async (req, res) => {
  try {
    const { uid } = req.params;
    const result = await grantAdminAccess(uid);
    
    if (result.success) {
      res.json({ success: true, message: result.message });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error granting admin access:', error);
    res.status(500).json({ error: 'Failed to grant admin access' });
  }
});

/**
 * POST /api/admin/users/:uid/revoke-admin
 * Revoke admin access from a user
 */
router.post('/users/:uid/revoke-admin', async (req, res) => {
  try {
    const { uid } = req.params;
    const result = await revokeAdminAccess(uid);
    
    if (result.success) {
      res.json({ success: true, message: result.message });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error revoking admin access:', error);
    res.status(500).json({ error: 'Failed to revoke admin access' });
  }
});

// ============================================================================
// ANALYTICS & STATISTICS
// ============================================================================

/**
 * GET /api/admin/stats
 * Get platform statistics
 */
router.get('/stats', async (req, res) => {
  try {
    // Read questions count
    const { questions } = await readQuestions();
    // Read users count from Firebase Auth
    const { totalUsers } = await fetchUsers(1); // only count; list not needed
    
    // Get submission statistics from Firestore
    const submissionsSnapshot = await getFirestore()
      .collection('submissions')
      .get();
    
    const totalSubmissions = submissionsSnapshot.size;
    let totalScore = 0;
    const recentActivity = [];
    
    submissionsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.score !== undefined) {
        totalScore += data.score;
      }
      // Collect recent activity (latest 10)
      if (recentActivity.length < 10) {
        recentActivity.push({
          id: doc.id,
          userId: data.userId,
          questionId: data.questionId,
          score: data.score,
          submittedAt: data.submittedAt
        });
      }
    });
    
    const averageScore = totalSubmissions > 0 ? (totalScore / totalSubmissions).toFixed(2) : 0;
    
    const stats = {
      totalQuestions: questions.length,
      totalUsers,
      totalSubmissions,
      averageScore: parseFloat(averageScore),
      questionsByDifficulty: {
        Easy: questions.filter(q => q.difficulty === 'Easy').length,
        Medium: questions.filter(q => q.difficulty === 'Medium').length,
        Hard: questions.filter(q => q.difficulty === 'Hard').length
      },
      recentActivity: recentActivity.sort((a, b) => 
        (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0)
      ).slice(0, 10)
    };
    
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// AI Override Audit Statistics
router.get('/ai-audit/stats', authenticateUser, requireAdmin, async (req, res) => {
  // Deprecated: AI override feature removed; audit statistics unavailable
  res.status(410).json({ success: false, error: 'AI override audit statistics deprecated' });
});

// Recent AI Override Audit Logs
router.get('/ai-audit/logs', authenticateUser, requireAdmin, async (req, res) => {
  // Deprecated: AI override logs disabled
  res.status(410).json({ success: false, error: 'AI override audit logs deprecated' });
});

// AI Override Audit Logs by User
router.get('/ai-audit/user/:userId', authenticateUser, requireAdmin, async (req, res) => {
  // Deprecated: AI override logs disabled
  res.status(410).json({ success: false, error: 'AI override audit logs deprecated' });
});

// AI Override Audit Logs by Question
router.get('/ai-audit/question/:questionId', authenticateUser, requireAdmin, async (req, res) => {
  // Deprecated: AI override logs disabled
  res.status(410).json({ success: false, error: 'AI override audit logs deprecated' });
});

// ============================================================================
// PERMISSION MANAGEMENT ROUTES
// ============================================================================

// Get all available permissions
router.get('/permissions/available', authenticateUser, requireAdmin, async (req, res) => {
  try {
    res.json({ 
      success: true, 
      permissions: PERMISSIONS,
      presets: DEFAULT_PERMISSIONS 
    });
  } catch (error) {
    console.error('Error fetching available permissions:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

// Get permissions for a specific user
router.get('/permissions/user/:userId', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const permissions = await getUserPermissions(userId);
    res.json({ success: true, ...permissions });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    res.status(500).json({ error: 'Failed to fetch user permissions' });
  }
});

// Get all users with their permissions
router.get('/users-with-permissions', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const maxUsers = parseInt(req.query.maxUsers) || 500;
    const users = await getAllUsersWithPermissions(maxUsers);
    res.json({ success: true, users, count: users.length });
  } catch (error) {
    console.error('Error fetching users with permissions:', error);
    res.status(500).json({ error: 'Failed to fetch users with permissions' });
  }
});

// Set permissions for a user
router.post('/permissions/user/:userId', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { permissions } = req.body;
    const adminUserId = req.user.uid;
    
    if (!permissions || typeof permissions !== 'object') {
      return res.status(400).json({ error: 'Permissions object is required' });
    }
    
    const updatedPermissions = await setUserPermissions(userId, permissions, adminUserId);
    res.json({ success: true, permissions: updatedPermissions });
  } catch (error) {
    console.error('Error setting user permissions:', error);
    res.status(500).json({ error: 'Failed to set user permissions' });
  }
});

// Grant a specific permission to a user
router.post('/permissions/user/:userId/grant/:permission', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { userId, permission } = req.params;
    const adminUserId = req.user.uid;
    
    const updatedPermissions = await grantPermission(userId, permission, adminUserId);
    res.json({ success: true, permissions: updatedPermissions });
  } catch (error) {
    console.error('Error granting permission:', error);
    res.status(500).json({ error: error.message || 'Failed to grant permission' });
  }
});

// Revoke a specific permission from a user
router.post('/permissions/user/:userId/revoke/:permission', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { userId, permission } = req.params;
    const adminUserId = req.user.uid;
    
    const updatedPermissions = await revokePermission(userId, permission, adminUserId);
    res.json({ success: true, permissions: updatedPermissions });
  } catch (error) {
    console.error('Error revoking permission:', error);
    res.status(500).json({ error: error.message || 'Failed to revoke permission' });
  }
});

// Apply a permission preset (student, teacher, admin) to a user
router.post('/permissions/user/:userId/preset/:presetName', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { userId, presetName } = req.params;
    const adminUserId = req.user.uid;
    
    const updatedPermissions = await applyPermissionPreset(userId, presetName, adminUserId);
    res.json({ success: true, permissions: updatedPermissions, preset: presetName });
  } catch (error) {
    console.error('Error applying permission preset:', error);
    res.status(500).json({ error: error.message || 'Failed to apply permission preset' });
  }
});

module.exports = router;
