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

function getDb() {
  if (!admin.apps.length) {
    throw new Error('Firebase Admin not initialized');
  }
  return admin.database();
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
    
    // In a real app, this would query Firestore
    // For now, return mock data structure
    const submissions = {
      total: 0,
      submissions: [],
      message: 'Connect to Firestore to fetch actual submissions'
    };
    
    // TODO: Implement Firestore query
    // const snapshot = await admin.firestore()
    //   .collection('submissions')
    //   .limit(parseInt(limit))
    //   .offset(parseInt(offset))
    //   .get();
    
    res.json({ success: true, ...submissions });
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
    
    // TODO: Implement Firestore fetch
    // const doc = await admin.firestore()
    //   .collection('submissions')
    //   .doc(submissionId)
    //   .get();
    
    res.json({ 
      success: true, 
      message: 'Connect to Firestore to fetch submission details' 
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
    
    // Read users from file (fallback)
    const usersPath = path.join(__dirname, '../../client/users.json');
    const usersData = await fs.readFile(usersPath, 'utf8');
    const users = JSON.parse(usersData);
    
    res.json({ 
      success: true, 
      users: users.slice(0, parseInt(limit)),
      total: users.length 
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
    
    // Read users count
    const usersPath = path.join(__dirname, '../../client/users.json');
    const usersData = await fs.readFile(usersPath, 'utf8');
    const users = JSON.parse(usersData);
    
    const stats = {
      totalQuestions: questions.length,
      totalUsers: users.length,
      totalSubmissions: 0, // TODO: Query from Firestore
      averageScore: 0, // TODO: Calculate from submissions
      questionsByDifficulty: {
        Easy: questions.filter(q => q.difficulty === 'Easy').length,
        Medium: questions.filter(q => q.difficulty === 'Medium').length,
        Hard: questions.filter(q => q.difficulty === 'Hard').length
      },
      recentActivity: [] // TODO: Fetch recent submissions
    };
    
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
