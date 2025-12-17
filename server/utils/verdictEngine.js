/**
 * Verdict Engine
 * Combines test results, rule-based logic comparison, AI logic verdict, and trust score
 * Generates a final comprehensive verdict object
 * No database writes in this module
 */

/**
 * Calculates trust score based on agreement between different verification methods
 * @param {Object} ruleVerdictData - Results from rule-based logic comparison
 * @param {Object} aiVerdictData - Results from AI logic verification
 * @param {Object} testVerdictData - Results from test execution
 * @param {Array} securityEvents - Security events detected during submission (if any)
 * @returns {number} - Trust score from 0 to 100
 */
function calculateTrustScore(
  ruleVerdictData,
  aiVerdictData,
  testVerdictData,
  securityEvents = []
) {
  // Trust score reflects confidence in the verdict
  // Based ONLY on: rule-based analysis consistency + test execution results + security posture
  // AI verdict excluded from trust calculation (used only for explanation)
  let trustScore = 0;
  let factors = 0;

  // Factor 1: Rule-based consistency (weight: 0.5)
  // Stronger confidence when multiple rule checks agree
  if (ruleVerdictData) {
    let ruleAgreements = 0;
    let ruleChecks = 0;

    if (ruleVerdictData.algorithmMatch) {
      ruleChecks++;
      if (ruleVerdictData.algorithmMatch === 'FULL') ruleAgreements++;
    }

    if (ruleVerdictData.complexityMatch) {
      ruleChecks++;
      ruleAgreements++;
    }

    if (!ruleVerdictData.violatesDisallowedPatterns) {
      ruleChecks++;
      ruleAgreements++;
    }

    if (ruleChecks > 0) {
      trustScore += (ruleAgreements / ruleChecks) * 50;
    }
    factors++;
  }

  // Factor 2: Test execution results (weight: 0.5)
  // Highest confidence when all tests pass
  if (testVerdictData) {
    const passRate = testVerdictData.passRate || 0;

    if (passRate === 100) {
      trustScore += 50;
    } else if (passRate >= 80) {
      trustScore += 40;
    } else if (passRate >= 60) {
      trustScore += 25;
    } else if (passRate >= 40) {
      trustScore += 15;
    } else if (passRate > 0) {
      trustScore += 5;
    }
    factors++;
  }

  // Factor 3: Security posture (weight: 0.33)
  // Reduced trust when security events are detected
  if (securityEvents && Array.isArray(securityEvents)) {
    const securityEventCount = securityEvents.length;

    if (securityEventCount === 0) {
      // No security issues detected - full confidence
      trustScore += 33;
    } else if (securityEventCount === 1) {
      // Minor security concern
      trustScore += 20;
    } else if (securityEventCount === 2) {
      // Moderate security concerns
      trustScore += 10;
    } else if (securityEventCount >= 3) {
      // Significant security concerns - minimal trust
      trustScore += 0;
    }
    factors++;
  }

  // Normalize by number of factors available
  if (factors > 0) {
    trustScore = Math.round(trustScore / factors);
  }

  return Math.min(100, Math.max(0, trustScore));
}

/**
 * Synthesizes individual verdicts into a final comprehensive verdict
 * @param {Object} ruleVerdictData - Results from rule-based logic comparison
 * @param {Object} aiVerdictData - Results from AI logic verification
 * @param {Object} testVerdictData - Results from test execution
 * @returns {string} - Final verdict: "CORRECT", "ACCEPTABLE", "NEEDS_IMPROVEMENT", or "INCORRECT"
 */
function synthesizeVerdict(ruleVerdictData, aiVerdictData, testVerdictData) {
  // Count positive indicators
  // Decision is based ONLY on rule-based analysis and test results
  // AI verdict is used for explanation/reasoning only, not for decision logic
  let positiveIndicators = 0;
  let totalIndicators = 0;

  // Rule-based verdict indicators
  if (ruleVerdictData) {
    if (ruleVerdictData.algorithmMatch === 'FULL') {
      positiveIndicators += 2;
    } else if (ruleVerdictData.algorithmMatch === 'PARTIAL') {
      positiveIndicators += 1;
    }
    totalIndicators += 2;

    if (ruleVerdictData.complexityMatch) {
      positiveIndicators += 2;
    }
    totalIndicators += 2;

    if (!ruleVerdictData.violatesDisallowedPatterns) {
      positiveIndicators += 1;
    }
    totalIndicators += 1;
  }

  // Test execution indicators (weighted heavily as they determine pass/fail)
  if (testVerdictData) {
    const passRate = testVerdictData.passRate || 0;

    if (passRate === 100) {
      positiveIndicators += 3;
    } else if (passRate >= 80) {
      positiveIndicators += 2;
    } else if (passRate >= 50) {
      positiveIndicators += 1;
    }
    totalIndicators += 3;
  }

  // Calculate ratio
  const successRatio =
    totalIndicators > 0 ? positiveIndicators / totalIndicators : 0;

  // Determine verdict
  if (successRatio >= 0.85) {
    return 'CORRECT';
  } else if (successRatio >= 0.65) {
    return 'ACCEPTABLE';
  } else if (successRatio >= 0.4) {
    return 'NEEDS_IMPROVEMENT';
  } else {
    return 'INCORRECT';
  }
}

/**
 * Aggregates issues from all sources
 * @param {Object} ruleVerdictData - Results from rule-based logic comparison
 * @param {Object} aiVerdictData - Results from AI logic verification
 * @param {Object} testVerdictData - Results from test execution
 * @returns {Array<Object>} - Array of issue objects with source and description
 */
function aggregateIssues(ruleVerdictData, aiVerdictData, testVerdictData) {
  const issues = [];

  // Rule-based issues
  if (ruleVerdictData) {
    if (ruleVerdictData.algorithmMatch === 'NONE') {
      issues.push({
        source: 'rule-based',
        severity: 'critical',
        type: 'algorithm_mismatch',
        description: 'Algorithm does not match expected approach',
      });
    }

    if (ruleVerdictData.algorithmMatch === 'PARTIAL') {
      issues.push({
        source: 'rule-based',
        severity: 'warning',
        type: 'partial_algorithm_match',
        description: 'Algorithm partially matches expected approach',
      });
    }

    if (!ruleVerdictData.complexityMatch) {
      issues.push({
        source: 'rule-based',
        severity: 'warning',
        type: 'complexity_mismatch',
        description: `Expected complexity: ${ruleVerdictData.expectedComplexity}, Detected: ${ruleVerdictData.detectedComplexity}`,
      });
    }

    if (ruleVerdictData.violatesDisallowedPatterns) {
      const violated = Array.isArray(ruleVerdictData.violatedPatterns)
        ? ruleVerdictData.violatedPatterns
        : [];
      issues.push({
        source: 'rule-based',
        severity: 'critical',
        type: 'disallowed_patterns',
        description:
          violated.length > 0
            ? `Disallowed patterns detected: ${violated.join(', ')}`
            : 'Disallowed patterns detected',
      });
    }
  }

  // AI verdict issues
  if (aiVerdictData) {
    if (!aiVerdictData.algorithmCorrect) {
      issues.push({
        source: 'ai-verdict',
        severity: 'critical',
        type: 'algorithm_incorrect',
        description: `Algorithm analysis: ${aiVerdictData.approachUsed}`,
      });
    }

    if (!aiVerdictData.complexityCorrect) {
      issues.push({
        source: 'ai-verdict',
        severity: 'warning',
        type: 'complexity_incorrect',
        description: `Expected complexity not met. Actual: ${aiVerdictData.actualComplexity}`,
      });
    }

    if (
      aiVerdictData.hasDisallowedPatterns &&
      aiVerdictData.disallowedPatternsFound?.length > 0
    ) {
      issues.push({
        source: 'ai-verdict',
        severity: 'critical',
        type: 'disallowed_patterns',
        description: `Disallowed patterns: ${aiVerdictData.disallowedPatternsFound.join(', ')}`,
      });
    }

    // Add AI-detected weaknesses as issues
    if (aiVerdictData.weaknesses && aiVerdictData.weaknesses.length > 0) {
      issues.push({
        source: 'ai-verdict',
        severity: 'info',
        type: 'identified_weakness',
        description: aiVerdictData.weaknesses.join('; '),
      });
    }
  }

  // Test execution issues
  if (testVerdictData) {
    if (testVerdictData.failedTests && testVerdictData.failedTests.length > 0) {
      issues.push({
        source: 'test-execution',
        severity: 'critical',
        type: 'test_failures',
        description: `Failed tests: ${testVerdictData.failedTests.length}/${testVerdictData.totalTests}`,
      });
    }

    if (testVerdictData.executionError) {
      issues.push({
        source: 'test-execution',
        severity: 'critical',
        type: 'runtime_error',
        description: testVerdictData.executionError,
      });
    }

    if (testVerdictData.timeoutOccurred) {
      issues.push({
        source: 'test-execution',
        severity: 'critical',
        type: 'timeout',
        description: 'Code execution timeout exceeded',
      });
    }
  }

  return issues;
}

/**
 * Aggregates strengths and achievements from all sources
 * @param {Object} ruleVerdictData - Results from rule-based logic comparison
 * @param {Object} aiVerdictData - Results from AI logic verification
 * @param {Object} testVerdictData - Results from test execution
 * @returns {Array<Object>} - Array of strength objects with source and description
 */
function aggregateStrengths(ruleVerdictData, aiVerdictData, testVerdictData) {
  const strengths = [];

  // Rule-based strengths
  if (ruleVerdictData) {
    if (ruleVerdictData.algorithmMatch === 'FULL') {
      strengths.push({
        source: 'rule-based',
        type: 'algorithm_match',
        description: 'Algorithm matches expected approach',
      });
    }

    if (ruleVerdictData.complexityMatch) {
      strengths.push({
        source: 'rule-based',
        type: 'complexity_match',
        description: 'Time complexity matches expected requirement',
      });
    }

    if (!ruleVerdictData.violatesDisallowedPatterns) {
      strengths.push({
        source: 'rule-based',
        type: 'no_violations',
        description: 'No disallowed patterns detected',
      });
    }

    // Add feedback reasons as strengths
    if (ruleVerdictData.reasons) {
      const positiveReasons = ruleVerdictData.reasons.filter((r) =>
        r.startsWith('✓')
      );
      positiveReasons.forEach((reason) => {
        strengths.push({
          source: 'rule-based',
          type: 'feedback',
          description: reason.replace('✓ ', ''),
        });
      });
    }
  }

  // AI verdict strengths
  if (aiVerdictData) {
    if (aiVerdictData.strengths && aiVerdictData.strengths.length > 0) {
      aiVerdictData.strengths.forEach((strength) => {
        strengths.push({
          source: 'ai-verdict',
          type: 'identified_strength',
          description: strength,
        });
      });
    }
  }

  // Test execution strengths
  if (testVerdictData) {
    if (testVerdictData.passRate === 100 && testVerdictData.totalTests > 0) {
      strengths.push({
        source: 'test-execution',
        type: 'all_tests_passed',
        description: `All ${testVerdictData.totalTests} test cases passed`,
      });
    }

    if (testVerdictData.passRate >= 80 && testVerdictData.passRate < 100) {
      strengths.push({
        source: 'test-execution',
        type: 'high_pass_rate',
        description: `${testVerdictData.passedTests}/${testVerdictData.totalTests} tests passed (${testVerdictData.passRate}%)`,
      });
    }
  }

  return strengths;
}

/**
 * Calculates an aggregated logic score (0-100)
 * @param {Object} ruleVerdictData - Results from rule-based logic comparison
 * @param {Object} aiVerdictData - Results from AI logic verification
 * @param {Object} testVerdictData - Results from test execution
 * @returns {number} - Aggregated logic score
 */
function calculateAggregatedScore(
  ruleVerdictData,
  aiVerdictData,
  testVerdictData
) {
  // Fixed marking schema:
  // Tests: 70, Logic: 20, Complexity: 10
  // AI excluded from score calculation
  let weightedScore = 0;

  // Tests (70)
  const testComponent =
    testVerdictData && testVerdictData.passRate !== undefined
      ? Math.max(0, Math.min(100, testVerdictData.passRate)) * 0.7
      : 0;
  weightedScore += testComponent;

  // Logic (20) — use rule-based logicScore scaled to 20
  const logicComponent =
    ruleVerdictData && ruleVerdictData.logicScore !== undefined
      ? Math.max(0, Math.min(100, ruleVerdictData.logicScore)) * 0.2
      : 0;
  weightedScore += logicComponent;

  // Complexity (10) — computed deterministically from time/space matches
  const complexityMarks = computeComplexityMarks(ruleVerdictData);
  weightedScore += complexityMarks;

  return Math.round(weightedScore);
}

/**
 * Fixed complexity marks (0/5/10) based on deterministic match rules
 * @param {Object} ruleVerdictData
 * @returns {number} - Complexity marks on 0-10 scale
 */
function computeComplexityMarks(ruleVerdictData) {
  if (!ruleVerdictData) return 0;

  const timeMatch = !!ruleVerdictData.timeComplexityMatch;
  const spaceMatch = !!ruleVerdictData.spaceComplexityMatch;

  if (timeMatch && spaceMatch) return 10;
  if (timeMatch || spaceMatch) return 5;
  return 0;
}

/**
 * Generates recommendations based on verdict data
 * @param {string} finalVerdict - The synthesized final verdict
 * @param {Array<Object>} issues - Array of identified issues
 * @param {Array<Object>} strengths - Array of identified strengths
 * @param {Object} aiVerdictData - AI verdict data
 * @returns {Array<string>} - Array of recommendation strings
 */
function generateRecommendations(
  finalVerdict,
  issues,
  strengths,
  aiVerdictData
) {
  const recommendations = [];

  // Verdict-based recommendations
  if (finalVerdict === 'INCORRECT') {
    recommendations.push(
      'Review the problem statement and expected algorithm carefully'
    );
    recommendations.push('Consider consulting reference solutions or examples');
  } else if (finalVerdict === 'NEEDS_IMPROVEMENT') {
    recommendations.push('Refactor code to improve algorithm or complexity');
    recommendations.push(
      'Review the hints provided and focus on failing test cases'
    );
  } else if (finalVerdict === 'ACCEPTABLE') {
    recommendations.push(
      'Minor optimizations recommended for better efficiency'
    );
  } else if (finalVerdict === 'CORRECT') {
    recommendations.push(
      'Solution is correct! Review the analysis for optimization opportunities'
    );
  }

  // Issue-based recommendations
  const criticalIssues = issues.filter((i) => i.severity === 'critical');
  if (criticalIssues.length > 0) {
    const types = [...new Set(criticalIssues.map((i) => i.type))];

    if (
      types.includes('algorithm_mismatch') ||
      types.includes('algorithm_incorrect')
    ) {
      recommendations.push('Revise the algorithm to match expected approach');
    }

    if (
      types.includes('complexity_mismatch') ||
      types.includes('complexity_incorrect')
    ) {
      recommendations.push(
        'Optimize time complexity - avoid unnecessary nested loops'
      );
    }

    if (types.includes('disallowed_patterns')) {
      recommendations.push(
        'Remove disallowed patterns and use approved techniques'
      );
    }

    if (types.includes('test_failures')) {
      recommendations.push('Debug failing test cases to identify edge cases');
    }

    if (types.includes('runtime_error')) {
      recommendations.push('Fix runtime errors in the code');
    }

    if (types.includes('timeout')) {
      recommendations.push(
        'Optimize code to prevent timeout - reduce time complexity'
      );
    }
  }

  // AI verdict-based recommendations
  if (aiVerdictData && aiVerdictData.suggestion) {
    recommendations.push(aiVerdictData.suggestion);
  }

  // Remove duplicates and limit to 5 recommendations
  return [...new Set(recommendations)].slice(0, 5);
}

/**
 * Main engine function - combines all verdict sources into final verdict object
 * @param {Object} params - Input parameters
 * @param {Object} params.ruleVerdictData - Results from rule-based logic comparison
 * @param {Object} params.aiVerdictData - Results from AI logic verification
 * @param {Object} params.testVerdictData - Results from test execution
 * @param {Array} params.securityViolations - Security events detected during submission
 * @param {Object} params.aiExplanation - AI-generated explanation of the verdict
 * @returns {Object} - Final verdict object
 */
function generateFinalVerdict(params) {
  const {
    ruleVerdictData,
    aiVerdictData,
    testVerdictData,
    securityViolations,
    aiExplanation,
  } = params;

  // Calculate components
  const trustScore = calculateTrustScore(
    ruleVerdictData,
    aiVerdictData,
    testVerdictData,
    securityViolations
  );
  const finalVerdict = synthesizeVerdict(
    ruleVerdictData,
    aiVerdictData,
    testVerdictData
  );
  const issues = aggregateIssues(
    ruleVerdictData,
    aiVerdictData,
    testVerdictData
  );
  const strengths = aggregateStrengths(
    ruleVerdictData,
    aiVerdictData,
    testVerdictData
  );
  const aggregatedScore = calculateAggregatedScore(
    ruleVerdictData,
    aiVerdictData,
    testVerdictData
  );
  const recommendations = generateRecommendations(
    finalVerdict,
    issues,
    strengths,
    aiVerdictData
  );

  // Build comprehensive verdict object
  return {
    // Final verdict - use both 'verdict' and 'decision' for compatibility
    verdict: finalVerdict,
    decision: finalVerdict, // For client compatibility
    score: aggregatedScore,
    trustScore: trustScore,
    timestamp: new Date().toISOString(),

    // Component verdicts
    components: {
      ruleBased: ruleVerdictData
        ? {
            algorithmMatch: ruleVerdictData.algorithmMatch,
            complexityMatch: ruleVerdictData.complexityMatch,
            timeComplexityMatch: ruleVerdictData.timeComplexityMatch || false,
            spaceComplexityMatch:
              ruleVerdictData.spaceComplexityMatch || false,
            disallowedPatternsFound: ruleVerdictData.violatesDisallowedPatterns,
            logicScore: ruleVerdictData.logicScore,
            // Phase 5: include explicit complexity fields for transparency
            detectedTimeComplexity:
              ruleVerdictData.detectedTimeComplexity || null,
            expectedTimeComplexity:
              ruleVerdictData.expectedTimeComplexity || null,
            detectedSpaceComplexity:
              ruleVerdictData.detectedSpaceComplexity || null,
            expectedSpaceComplexity:
              ruleVerdictData.expectedSpaceComplexity || null,
            complexityMarks: computeComplexityMarks(ruleVerdictData),
          }
        : null,

      aiAnalysis: aiVerdictData
        ? {
            algorithmCorrect: aiVerdictData.algorithmCorrect,
            approachUsed: aiVerdictData.approachUsed,
            complexityCorrect: aiVerdictData.complexityCorrect,
            actualComplexity: aiVerdictData.actualComplexity,
            logicScore: aiVerdictData.logicScore,
            verdict: aiVerdictData.verdict,
          }
        : null,

      testResults: testVerdictData
        ? {
            totalTests: testVerdictData.totalTests,
            passedTests: testVerdictData.passedTests,
            failedTests: testVerdictData.failedTests,
            passRate: testVerdictData.passRate,
            executionError: testVerdictData.executionError,
          }
        : null,
    },

    // Analysis
    issues: issues,
    strengths: strengths,
    recommendations: recommendations,

    // AI Explanation (if available)
    aiExplanation: aiExplanation?.explanation || null,
    aiExplanationModel: aiExplanation?.model || null,

    // Summary
    summary: {
      overallStatus: finalVerdict,
      keyMetrics: {
        score: aggregatedScore,
        trustScore: trustScore,
        testPassRate: testVerdictData?.passRate || 'N/A',
        algorithmMatch: ruleVerdictData?.algorithmMatch || 'N/A',
        complexityMatch: ruleVerdictData?.complexityMatch ? 'Yes' : 'No',
      },
      nextSteps: recommendations.slice(0, 2),
    },
  };
}

module.exports = {
  generateFinalVerdict,
  calculateTrustScore,
  synthesizeVerdict,
  calculateAggregatedScore,
  aggregateIssues,
  aggregateStrengths,
  generateRecommendations,
};
