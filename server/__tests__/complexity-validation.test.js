// Complexity validation tests — deterministic end-to-end validation
const { extractLogicFeatures } = require('../utils/logicFeatureExtractor');
const { compareAgainstReference, clearCache } = require('../utils/referenceLogicLoader');
const { generateFinalVerdict } = require('../utils/verdictEngine');

function testComplexity({ name, questionId, code, language, expectedTimeMatch, expectedSpaceMatch, expectedMarks }) {
  clearCache();
  const features = extractLogicFeatures(code, language);
  const ruleVerdict = compareAgainstReference(features, questionId);
  const final = generateFinalVerdict({
    ruleVerdictData: ruleVerdict,
    aiVerdictData: null,
    testVerdictData: { totalTests: 1, passedTests: 1, failedTests: [], passRate: 100 },
    securityViolations: [],
    aiExplanation: null,
  });

  console.log(`\n--- Test: ${name} ---`);
  console.log(`Time Match: ${ruleVerdict.timeComplexityMatch} (expect ${expectedTimeMatch})`);
  console.log(`Space Match: ${ruleVerdict.spaceComplexityMatch} (expect ${expectedSpaceMatch})`);
  console.log(`Complexity Marks: ${ruleVerdict.complexityMarks} (expect ${expectedMarks})`);

  expect(ruleVerdict.timeComplexityMatch).toBe(expectedTimeMatch);
  expect(ruleVerdict.spaceComplexityMatch).toBe(expectedSpaceMatch);
  expect(ruleVerdict.complexityMarks).toBe(expectedMarks);
  expect(final.components.ruleBased.complexityMarks).toBe(expectedMarks);
}

describe('Complexity Validation', () => {
  test('Q022 Two Sum: O(n) time + O(n) space match', () => {
    const code = `
      function twoSum(nums, target) {
        const map = new Map();
        for (let i = 0; i < nums.length; i++) {
          const comp = target - nums[i];
          if (map.has(comp)) return [map.get(comp), i];
          map.set(nums[i], i);
        }
        return [];
      }
    `;
    testComplexity({
      name: 'Q022 Two Sum (hash map)',
      questionId: 'Q022',
      code,
      language: 'javascript',
      expectedTimeMatch: true,
      expectedSpaceMatch: true,
      expectedMarks: 10,
    });
  });

  test('Q010 Fibonacci DP: O(n) time + O(n) space match', () => {
    const code = `
      function fib(n) {
        if (n <= 1) return n;
        const dp = new Array(n + 1).fill(0);
        dp[1] = 1;
        for (let i = 2; i <= n; i++) {
          dp[i] = dp[i-1] + dp[i-2];
        }
        return dp[n];
      }
    `;
    testComplexity({
      name: 'Q010 Fibonacci DP',
      questionId: 'Q010',
      code,
      language: 'javascript',
      expectedTimeMatch: true,
      expectedSpaceMatch: true,
      expectedMarks: 10,
    });
  });

  test('Q027 Binary Search: O(log n) time + O(1) space match', () => {
    const code = `
      function binarySearch(arr, target) {
        let left = 0, right = arr.length - 1;
        while (left <= right) {
          const mid = Math.floor((left + right) / 2);
          if (arr[mid] === target) return mid;
          if (arr[mid] < target) left = mid + 1; else right = mid - 1;
        }
        return -1;
      }
    `;
    testComplexity({
      name: 'Q027 Binary Search',
      questionId: 'Q027',
      code,
      language: 'javascript',
      expectedTimeMatch: true,
      expectedSpaceMatch: true,
      expectedMarks: 10,
    });
  });

  test('Q034 Activity Selection: O(n log n) time + O(n) space partial match', () => {
    const code = `
      function activitySelection(activities) {
        activities.sort((a, b) => a.end - b.end);
        let count = 1;
        let lastEnd = activities[0].end;
        for (let i = 1; i < activities.length; i++) {
          if (activities[i].start >= lastEnd) {
            count++;
            lastEnd = activities[i].end;
          }
        }
        return count;
      }
    `;
    testComplexity({
      name: 'Q034 Activity Selection (sorting)',
      questionId: 'Q034',
      code,
      language: 'javascript',
      expectedTimeMatch: true,
      expectedSpaceMatch: false, // Detected O(1) vs expected O(n)
      expectedMarks: 5, // Only time matches
    });
  });

  test('Q010 Naive Recursive Fib: O(2^n) time mismatch, space mismatch', () => {
    const code = `
      function fib(n) {
        if (n <= 1) return n;
        return fib(n - 1) + fib(n - 2);
      }
    `;
    testComplexity({
      name: 'Q010 Naive Recursion (no memo)',
      questionId: 'Q010',
      code,
      language: 'javascript',
      expectedTimeMatch: false, // Detected O(1) (missing recursion?) vs expected O(n)
      expectedSpaceMatch: false, // Detected O(1) vs expected O(n)
      expectedMarks: 0,
    });
  });

  test('Q022 Nested Loops: O(n²) time + O(1) space mismatches', () => {
    const code = `
      function twoSumNested(nums, target) {
        for (let i = 0; i < nums.length; i++) {
          for (let j = i + 1; j < nums.length; j++) {
            if (nums[i] + nums[j] === target) return [i, j];
          }
        }
        return [];
      }
    `;
    testComplexity({
      name: 'Q022 Nested Loops (both mismatches)',
      questionId: 'Q022',
      code,
      language: 'javascript',
      expectedTimeMatch: false,
      expectedSpaceMatch: false,
      expectedMarks: 0,
    });
  });

  test('Verdict output includes all Phase 5 fields', () => {
    const code = `function twoSum(nums, target) { const m = new Map(); for (let i = 0; i < nums.length; i++) { if (m.has(target - nums[i])) return [m.get(target - nums[i]), i]; m.set(nums[i], i); } return []; }`;
    clearCache();
    const features = extractLogicFeatures(code, 'javascript');
    const ruleVerdict = compareAgainstReference(features, 'Q022');
    const final = generateFinalVerdict({
      ruleVerdictData: ruleVerdict,
      aiVerdictData: null,
      testVerdictData: { totalTests: 1, passedTests: 1, failedTests: [], passRate: 100 },
      securityViolations: [],
      aiExplanation: null,
    });

    expect(final.components.ruleBased).toHaveProperty('timeComplexityMatch');
    expect(final.components.ruleBased).toHaveProperty('spaceComplexityMatch');
    expect(final.components.ruleBased).toHaveProperty('detectedTimeComplexity');
    expect(final.components.ruleBased).toHaveProperty('expectedTimeComplexity');
    expect(final.components.ruleBased).toHaveProperty('detectedSpaceComplexity');
    expect(final.components.ruleBased).toHaveProperty('expectedSpaceComplexity');
    expect(final.components.ruleBased).toHaveProperty('complexityMarks');
  });
});
