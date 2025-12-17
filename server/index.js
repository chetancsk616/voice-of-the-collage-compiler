const path = require('path');
// Load .env from the project root explicitly so the server works regardless of cwd
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
// Log whether the GROQ_API_KEY env var is present (do not print the key)
console.info('GROQ_API_KEY set:', Boolean(process.env.GROQ_API_KEY));
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { askGroq } = require('./ai/groqClient');
const { runWithPiston } = require('./executor/pistonExecutor');
const { extractLogicFeatures } = require('./utils/logicFeatureExtractor');
const { compareAgainstReference } = require('./utils/referenceLogicLoader');
const { getReferenceLogic } = require('./utils/referenceLogicLoader');
const { generateFinalVerdict } = require('./utils/verdictEngine');

const app = express();
const PORT = process.env.PORT || 4000;
const API_PREFIX = process.env.API_PREFIX || '/api';
// Removed: DOCKER_EXECUTOR_URL (no longer needed)

app.use(cors());
app.use(bodyParser.json());

// Simple in-memory rate limiter for /api/ask-ai: 5 requests per minute per IP
const aiRateWindow = 60_000; // 1 minute
const aiRateLimit = 5;
const aiRequests = new Map(); // ip -> { count, windowStart }

function aiRateLimiter(req, res, next) {
  try {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = aiRequests.get(ip);
    if (!entry || now - entry.windowStart > aiRateWindow) {
      aiRequests.set(ip, { count: 1, windowStart: now });
      return next();
    }
    if (entry.count >= aiRateLimit) {
      // rate limited
      const retryAfter = Math.ceil(
        (entry.windowStart + aiRateWindow - now) / 1000
      );
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({ error: 'rate limit exceeded' });
    }
    entry.count += 1;
    aiRequests.set(ip, entry);
    return next();
  } catch (e) {
    return next();
  }
}

// Example health route
app.get(`${API_PREFIX}/health`, (req, res) => {
  res.json({ ok: true, message: 'server is up' });
});

// Simple ping route (alias for health) so clients expecting /api/ping work
app.get(`${API_PREFIX}/ping`, (req, res) => {
  res.json({ ok: true, message: 'pong' });
});

// Example compile route — returns a job id and echoes payload
app.post(`${API_PREFIX}/compile`, (req, res) => {
  const id = uuidv4();
  // In a real app you'd enqueue a compile job, run sandboxes, etc.
  res.json({ id, received: req.body });
});

// Execute code using Piston API
app.post(`${API_PREFIX}/execute`, async (req, res) => {
  try {
    const { language, code, stdin } = req.body || {};
    console.log('[Execute] Request received:', {
      language,
      codeLength: code?.length,
    });
    const result = await runWithPiston(language, code, stdin || '');
    console.log('[Execute] Result:', {
      stdout: result.stdout?.substring(0, 50),
      stderr: result.stderr?.substring(0, 50),
      exitCode: result.exitCode,
    });
    res.json(result);
  } catch (err) {
    console.error('[Execute] Error:', err);
    res.status(500).json({
      error: String(err),
      stdout: '',
      stderr: String(err),
      exitCode: 1,
    });
  }
});

// Execute with diagnostics enabled (Piston API)
app.post(`${API_PREFIX}/execute-debug`, async (req, res) => {
  try {
    const { language, code, stdin } = req.body || {};
    try {
      const result = await runWithPiston(language, code, stdin || '');
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  } catch (err) {
    console.error(
      JSON.stringify({
        jobId: uuidv4(),
        ts: new Date().toISOString(),
        event: 'unexpected_error_debug',
        message: String(err),
      })
    );
    return res.status(500).json({ error: String(err) });
  }
});

// AI ask route
app.post(`${API_PREFIX}/ask-ai`, aiRateLimiter, async (req, res) => {
  const jobId = uuidv4();
  const startTs = Date.now();
  try {
    const { prompt, code, stderr, language, model } = req.body || {};
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      console.warn(
        JSON.stringify({
          jobId,
          event: 'ai_request',
          ts: new Date().toISOString(),
          error: 'prompt required',
        })
      );
      return res.status(400).json({ error: 'prompt is required' });
    }

    // Log start of AI request
    console.info(
      JSON.stringify({
        jobId,
        event: 'ai_request',
        ts: new Date().toISOString(),
        model: model || null,
      })
    );

    const result = await askGroq(
      prompt,
      code || '',
      stderr || '',
      language || '',
      model || undefined
    );
    const duration = Date.now() - startTs;

    if (!result) {
      console.error(
        JSON.stringify({
          jobId,
          event: 'ai_request',
          ts: new Date().toISOString(),
          durationMs: duration,
          error: 'no response',
        })
      );
      return res.status(502).json({ error: 'no response from AI' });
    }
    if (result.error) {
      console.error(
        JSON.stringify({
          jobId,
          event: 'ai_request',
          ts: new Date().toISOString(),
          durationMs: duration,
          model: result.model || model || null,
          error: result.error,
        })
      );
      return res.status(502).json({ error: result.error });
    }

    // Success: log tokens and duration
    console.info(
      JSON.stringify({
        jobId,
        event: 'ai_request',
        ts: new Date().toISOString(),
        model: result.model || model || null,
        tokens: result.tokensUsed || null,
        durationMs: duration,
      })
    );

    return res.json({
      text: result.text,
      model: result.model,
      codeBlocks: result.codeBlocks || [],
      firstCodeBlock: result.firstCodeBlock || null,
    });
  } catch (err) {
    const duration = Date.now() - startTs;
    console.error(
      JSON.stringify({
        jobId,
        event: 'ai_request',
        ts: new Date().toISOString(),
        durationMs: duration,
        error: String(err),
      })
    );
    return res.status(502).json({ error: String(err) });
  }
});

// ============ EVALUATION PIPELINE ============
// POST /api/submit - Orchestrates the complete evaluation pipeline
app.post(`${API_PREFIX}/submit`, async (req, res) => {
  const submissionId = uuidv4();
  const startTime = Date.now();

  try {
    const { userId, email, questionId, language, code, securityEvents } =
      req.body || {};

    // Validation
    if (!userId || !email || !questionId || !language || !code) {
      console.warn(
        JSON.stringify({
          submissionId,
          event: 'submit_validation_error',
          ts: new Date().toISOString(),
          missing: {
            userId: !userId,
            email: !email,
            questionId: !questionId,
            language: !language,
            code: !code,
          },
        })
      );
      return res.status(400).json({
        error:
          'Missing required fields: userId, email, questionId, language, code',
      });
    }

    console.info(
      JSON.stringify({
        submissionId,
        event: 'submit_start',
        ts: new Date().toISOString(),
        userId,
        email,
        questionId,
        language,
        codeLength: code.length,
        securityEventsCount: securityEvents?.length || 0,
      })
    );

    // Result object to accumulate all analysis results
    const evaluationResult = {
      submissionId,
      userId,
      questionId,
      language,
      timestamp: new Date().toISOString(),
      stages: {},
    };

    // ===== STAGE 1: Load Reference Logic =====
    let stage1Start = Date.now();
    let referenceLogic = null;
    try {
      console.info(
        JSON.stringify({
          submissionId,
          event: 'stage_1_start',
          stage: 'Load Reference Logic',
          ts: new Date().toISOString(),
        })
      );

      referenceLogic = getReferenceLogic(questionId);

      if (!referenceLogic) {
        throw new Error(
          `Reference logic not found for question: ${questionId}`
        );
      }

      const stage1Duration = Date.now() - stage1Start;
      evaluationResult.stages.loadReference = {
        status: 'success',
        durationMs: stage1Duration,
        problemTitle: referenceLogic.title,
        expectedAlgorithm: referenceLogic.expectedAlgorithm,
      };

      console.info(
        JSON.stringify({
          submissionId,
          event: 'stage_1_complete',
          stage: 'Load Reference Logic',
          ts: new Date().toISOString(),
          durationMs: stage1Duration,
        })
      );
    } catch (err) {
      const stage1Duration = Date.now() - stage1Start;
      evaluationResult.stages.loadReference = {
        status: 'error',
        durationMs: stage1Duration,
        error: String(err),
      };

      console.error(
        JSON.stringify({
          submissionId,
          event: 'stage_1_error',
          stage: 'Load Reference Logic',
          ts: new Date().toISOString(),
          durationMs: stage1Duration,
          error: String(err),
        })
      );
    }

    // ===== STAGE 2: Extract Features =====
    let stage2Start = Date.now();
    let logicFeatures = null;
    try {
      console.info(
        JSON.stringify({
          submissionId,
          event: 'stage_2_start',
          stage: 'Extract Features',
          ts: new Date().toISOString(),
        })
      );

      logicFeatures = extractLogicFeatures(code, language);

      const stage2Duration = Date.now() - stage2Start;
      evaluationResult.stages.extractFeatures = {
        status: 'success',
        durationMs: stage2Duration,
        featureCount: Object.keys(logicFeatures).length,
        paradigm: logicFeatures.paradigm,
        timeComplexity: logicFeatures.estimatedTimeComplexity,
        spaceComplexity: logicFeatures.estimatedSpaceComplexity,
      };
      evaluationResult.logicFeatures = logicFeatures;

      console.info(
        JSON.stringify({
          submissionId,
          event: 'stage_2_complete',
          stage: 'Extract Features',
          ts: new Date().toISOString(),
          durationMs: stage2Duration,
          paradigm: logicFeatures.paradigm,
        })
      );
    } catch (err) {
      const stage2Duration = Date.now() - stage2Start;
      evaluationResult.stages.extractFeatures = {
        status: 'error',
        durationMs: stage2Duration,
        error: String(err),
      };

      console.error(
        JSON.stringify({
          submissionId,
          event: 'stage_2_error',
          stage: 'Extract Features',
          ts: new Date().toISOString(),
          durationMs: stage2Duration,
          error: String(err),
        })
      );
    }

    // ===== STAGE 3: Compare Against Reference =====
    let stage3Start = Date.now();
    let logicComparison = null;
    try {
      console.info(
        JSON.stringify({
          submissionId,
          event: 'stage_3_start',
          stage: 'Compare Against Reference',
          ts: new Date().toISOString(),
        })
      );

      if (!logicFeatures || !referenceLogic) {
        throw new Error('Cannot compare: missing features or reference logic');
      }

      logicComparison = compareAgainstReference(logicFeatures, questionId);

      const stage3Duration = Date.now() - stage3Start;
      evaluationResult.stages.compareLogic = {
        status: 'success',
        durationMs: stage3Duration,
        matched: logicComparison.matched,
        issuesCount: logicComparison.issues?.length || 0,
        warningsCount: logicComparison.warnings?.length || 0,
      };
      evaluationResult.logicComparison = logicComparison;

      console.info(
        JSON.stringify({
          submissionId,
          event: 'stage_3_complete',
          stage: 'Compare Against Reference',
          ts: new Date().toISOString(),
          durationMs: stage3Duration,
          matched: logicComparison.matched,
        })
      );
    } catch (err) {
      const stage3Duration = Date.now() - stage3Start;
      evaluationResult.stages.compareLogic = {
        status: 'error',
        durationMs: stage3Duration,
        error: String(err),
      };

      console.error(
        JSON.stringify({
          submissionId,
          event: 'stage_3_error',
          stage: 'Compare Against Reference',
          ts: new Date().toISOString(),
          durationMs: stage3Duration,
          error: String(err),
        })
      );
    }

    // ===== STAGE 4: Test Execution =====
    let stage4Start = Date.now();
    let testResults = null;
    try {
      console.info(
        JSON.stringify({
          submissionId,
          event: 'stage_5_start',
          stage: 'Test Execution',
          ts: new Date().toISOString(),
        })
      );

      // Execute code against test cases (if available in reference logic)
      const testCases = referenceLogic?.testCases || [];
      const results = [];

      if (testCases.length > 0) {
        for (let i = 0; i < testCases.length; i++) {
          try {
            const testCase = testCases[i];
            const result = await runWithPiston(
              language,
              code,
              testCase.input || ''
            );

            results.push({
              testNumber: i + 1,
              input: testCase.input || '',
              expectedOutput: testCase.expectedOutput || '',
              actualOutput: result.stdout || '',
              passed:
                (result.stdout || '').trim() ===
                (testCase.expectedOutput || '').trim(),
              error: result.stderr || null,
              executionTimeMs: result.executionTimeMs || 0,
            });
          } catch (err) {
            results.push({
              testNumber: i + 1,
              error: String(err),
              passed: false,
            });
          }
        }
      }

      const passedCount = results.filter((r) => r.passed).length;
      const stage4Duration = Date.now() - stage4Start;

      testResults = {
        totalTests: results.length,
        passedTests: passedCount,
        failedTests: results.length - passedCount,
        passRate: results.length > 0 ? (passedCount / results.length) * 100 : 0,
        results: results,
      };

      evaluationResult.stages.testExecution = {
        status: 'success',
        durationMs: stage4Duration,
        totalTests: testResults.totalTests,
        passedTests: testResults.passedTests,
        passRate: testResults.passRate,
      };
      evaluationResult.testResults = testResults;

      console.info(
        JSON.stringify({
          submissionId,
          event: 'stage_4_complete',
          stage: 'Test Execution',
          ts: new Date().toISOString(),
          durationMs: stage4Duration,
          passRate: testResults.passRate,
        })
      );
    } catch (err) {
      const stage4Duration = Date.now() - stage4Start;
      evaluationResult.stages.testExecution = {
        status: 'error',
        durationMs: stage4Duration,
        error: String(err),
      };

      console.error(
        JSON.stringify({
          submissionId,
          event: 'stage_4_error',
          stage: 'Test Execution',
          ts: new Date().toISOString(),
          durationMs: stage4Duration,
          error: String(err),
        })
      );
    }

    // ===== STAGE 5: Generate Final Verdict =====
    let stage5Start = Date.now();
    let finalVerdict = null;
    let aiExplanation = null;

    try {
      console.info(
        JSON.stringify({
          submissionId,
          event: 'stage_5_start',
          stage: 'Generate Final Verdict',
          ts: new Date().toISOString(),
        })
      );

      // Generate AI explanation based on deterministic results
      // AI provides human-readable justification for the verdict, NOT the verdict itself
      if (logicComparison && testResults) {
        try {
          const passRate = testResults.passRate || 0;
          const algorithmMatch = logicComparison.algorithmMatch || 'NONE';
          const complexityMatch = logicComparison.complexityMatch || false;
          const logicScore = logicComparison.logicScore || 0;

          // Construct explanation prompt with deterministic results
          const explanationPrompt = `You are evaluating a coding solution. Based on the following DETERMINISTIC evaluation results, provide a clear, concise explanation of why the solution received this verdict.

**Evaluation Results:**
- Test Pass Rate: ${passRate}% (${testResults.passedTests}/${testResults.totalTests} tests passed)
- Algorithm Match: ${algorithmMatch}
- Complexity Match: ${complexityMatch ? 'Yes' : 'No'}
- Logic Score: ${logicScore}/100
- Expected Algorithm: ${referenceLogic?.expectedAlgorithm || 'Not specified'}
- Expected Complexity: ${referenceLogic?.expectedTimeComplexity || 'Not specified'}

**Issues Found:**
${logicComparison.issues?.map((issue) => `- ${issue.message || issue.type}`).join('\n') || 'None'}

**Strengths:**
${logicComparison.successes?.map((success) => `- ${success.message || success.type}`).join('\n') || 'None'}

Provide a 2-3 sentence explanation of:
1. Why the solution received this score
2. What the main issues are (if any)
3. What could be improved (if applicable)

Keep the explanation constructive and educational.`;

          const aiResult = await askGroq(
            explanationPrompt,
            code,
            '',
            language,
            'llama-3.1-70b-versatile' // Use larger model for better explanations
          );

          if (aiResult && aiResult.text && !aiResult.error) {
            aiExplanation = {
              explanation: aiResult.text,
              model: aiResult.model,
              timestamp: new Date().toISOString(),
            };
            console.info(
              JSON.stringify({
                submissionId,
                event: 'ai_explanation_generated',
                ts: new Date().toISOString(),
                model: aiResult.model,
              })
            );
          } else {
            console.warn(
              JSON.stringify({
                submissionId,
                event: 'ai_explanation_failed',
                ts: new Date().toISOString(),
                error: aiResult?.error || 'No response',
              })
            );
          }
        } catch (aiErr) {
          console.error(
            JSON.stringify({
              submissionId,
              event: 'ai_explanation_error',
              ts: new Date().toISOString(),
              error: String(aiErr),
            })
          );
          // Continue without AI explanation - verdict generation should not fail
        }
      }

      // Create verdict input from all analysis results
      // Decision is based on: test results + logic comparison only
      // AI is used only for explanation/justification
      const verdictInput = {
        ruleVerdictData: logicComparison || {},
        testVerdictData: testResults || {},
        aiExplanation: aiExplanation || {},
        securityViolations: securityEvents || [],
        referenceLogic: referenceLogic || {},
      };

      finalVerdict = generateFinalVerdict(verdictInput);

      const stage5Duration = Date.now() - stage5Start;
      evaluationResult.stages.generateVerdict = {
        status: 'success',
        durationMs: stage5Duration,
        decision: finalVerdict.decision,
        score: finalVerdict.score,
        trustScore: finalVerdict.trustScore,
      };
      evaluationResult.finalVerdict = finalVerdict;

      console.info(
        JSON.stringify({
          submissionId,
          event: 'stage_5_complete',
          stage: 'Generate Final Verdict',
          ts: new Date().toISOString(),
          durationMs: stage5Duration,
          decision: finalVerdict.decision,
          score: finalVerdict.score,
        })
      );
    } catch (err) {
      const stage5Duration = Date.now() - stage5Start;
      evaluationResult.stages.generateVerdict = {
        status: 'error',
        durationMs: stage5Duration,
        error: String(err),
      };

      console.error(
        JSON.stringify({
          submissionId,
          event: 'stage_5_error',
          stage: 'Generate Final Verdict',
          ts: new Date().toISOString(),
          durationMs: stage5Duration,
          error: String(err),
        })
      );

      // Create minimal verdict on error
      finalVerdict = {
        decision: 'ERROR',
        score: 0,
        trustScore: 0,
        reasoning: 'Could not generate final verdict',
        error: String(err),
      };
      evaluationResult.finalVerdict = finalVerdict;
    }

    // ===== COMPLETION =====
    const totalDuration = Date.now() - startTime;
    evaluationResult.totalDurationMs = totalDuration;

    // Calculate stage completion rate
    const completedStages = Object.values(evaluationResult.stages || {}).filter(
      (s) => s.status === 'success'
    ).length;
    evaluationResult.completionRate = completedStages / 5; // 5 stages: load, extract, compare, test, verdict

    // Add final verdict details to top level for client compatibility
    if (finalVerdict) {
      evaluationResult.finalVerdict = finalVerdict;
      evaluationResult.decision = finalVerdict.decision;
      evaluationResult.score = finalVerdict.score;
      evaluationResult.trustScore = finalVerdict.trustScore;
    }

    console.info(
      JSON.stringify({
        submissionId,
        event: 'submit_complete',
        ts: new Date().toISOString(),
        totalDurationMs: totalDuration,
        completionRate: evaluationResult.completionRate,
        decision: finalVerdict?.decision || 'ERROR',
      })
    );

    // Send response
    res.json(evaluationResult);
  } catch (err) {
    const totalDuration = Date.now() - startTime;
    console.error(
      JSON.stringify({
        submissionId,
        event: 'submit_fatal_error',
        ts: new Date().toISOString(),
        totalDurationMs: totalDuration,
        error: String(err),
      })
    );

    res.status(500).json({
      error: 'Fatal error during evaluation',
      message: String(err),
      submissionId,
    });
  }
});

// Serve static client build
const clientDist = path.join(__dirname, '..', 'client', 'dist');
console.log('Serving static files from:', clientDist);

// Check if client dist exists
const fs = require('fs');
if (!fs.existsSync(clientDist)) {
  console.error('WARNING: Client dist folder not found at:', clientDist);
  console.error(
    'Build may have failed. Check that "npm run build" completed successfully.'
  );
} else {
  console.log('Client dist folder found. Files:', fs.readdirSync(clientDist));
}

app.use(express.static(clientDist));
app.get('*', (req, res) => {
  const indexPath = path.join(clientDist, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error('index.html not found at:', indexPath);
    return res
      .status(404)
      .send('Application not built. Please check build logs.');
  }
  res.sendFile(indexPath);
});

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res
    .status(500)
    .json({ error: 'Internal server error', message: String(err) });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT} (api prefix: ${API_PREFIX})`);
});
