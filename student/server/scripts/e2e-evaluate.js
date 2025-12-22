#!/usr/bin/env node
/**
 * E2E evaluation script (offline)
 *
 * Runs the rule-based logic comparison (TAC-first) and combines it with
 * a mock test result via the verdict engine to validate the full scoring pipeline.
 *
 * Usage:
 *   node scripts/e2e-evaluate.js [QUESTION_ID] [LANGUAGE]
 *
 * Example:
 *   node scripts/e2e-evaluate.js Q010 python
 */

const path = require('path');
const { extractLogicFeatures } = require('../utils/logicFeatureExtractor');
const { compareAgainstReference, getReferenceLogic } = require('../utils/referenceLogicLoader');
const { generateFinalVerdict } = require('../utils/verdictEngine');

async function main() {
  const questionId = process.argv[2] || 'Q022';
  const language = (process.argv[3] || 'python').toLowerCase();

  // Example student submission snippets per language
  const samples = {
    python: `\n# Two Sum using hash map (loop-centric)\ndef two_sum(nums, target):\n    seen = {}\n    i = 0\n    while i < len(nums):\n        comp = target - nums[i]\n        if comp in seen:\n            return [seen[comp], i]\n        seen[nums[i]] = i\n        i = i + 1\n    return []\n\nprint(two_sum([2,7,11,15], 9))\n`,
    javascript: `\n// Two Sum using hash map (loop-centric)\nfunction twoSum(nums, target) {\n  const seen = {};\n  for (let i = 0; i < nums.length; i++) {\n    const comp = target - nums[i];\n    if (seen.hasOwnProperty(comp)) return [seen[comp], i];\n    seen[nums[i]] = i;\n  }\n  return [];\n}\nconsole.log(twoSum([2,7,11,15], 9));\n`,
  };

  const studentCode = samples[language] || samples.python;

  const reference = getReferenceLogic(questionId);
  if (!reference) {
    console.error(`[E2E] Reference logic not found for ${questionId}`);
    process.exit(1);
  }

  console.log(`[E2E] Evaluating submission for ${questionId} (${reference.title || 'Untitled'})`);
  console.log(`[E2E] Language: ${language}`);

  // Extract features (AST-backed where available) for complexity and diagnostics
  const features = extractLogicFeatures(studentCode, language);

  // TAC-first logic comparison and complexity marks
  const comparison = compareAgainstReference(features, questionId, studentCode, language);

  // Mock test results (simulate as needed)
  const testVerdictData = {
    totalTests: 10,
    passedTests: 7,
    failedTests: 3,
    passRate: 70, // percent
    executionError: false,
  };

  const finalVerdict = generateFinalVerdict({
    ruleVerdictData: comparison,
    aiVerdictData: null, // AI is explanation-only
    testVerdictData,
    securityViolations: [],
    aiExplanation: null,
    difficulty: reference.difficulty || 'medium',
  });

  // Pretty print results
  console.log('\n[E2E] TAC Logic Comparison:');
  console.log(`  Algorithm Match: ${comparison.algorithmMatch}`);
  console.log(`  TAC Similarity : ${comparison.tac.similarityScore}`);
  console.log(`  Logic Score    : ${comparison.logicScore}/100`);
  console.log(`  Complexity     : time ${comparison.detectedTimeComplexity} vs expected ${comparison.expectedTimeComplexity}`);
  console.log(`  ComplexityMarks: ${comparison.complexityMarks}/10`);

  console.log('\n[E2E] Final Verdict:');
  console.log(`  Decision : ${finalVerdict.decision}`);
  console.log(`  Score    : ${finalVerdict.score}/100 (70/20/10 weighting)`);
  console.log(`  Trust    : ${finalVerdict.trustScore}/100`);
}

main().catch((e) => {
  console.error('[E2E] Unexpected error:', e);
  process.exit(1);
});
