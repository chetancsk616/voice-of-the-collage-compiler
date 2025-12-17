// Deterministic AST-feature-only time complexity estimator
// Supported outputs: O(1), O(log n), O(n), O(n log n), O(n²), O(2ⁿ)

const ORDER = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(2ⁿ)'];
const ALLOWED = new Set(ORDER);

function worstCase(results) {
  if (!results || results.length === 0) return 'O(1)';
  let idx = 0; // default to O(1)
  for (const r of results) {
    const norm = normalize(r);
    const i = ORDER.indexOf(norm);
    if (i > idx) idx = i;
  }
  return ORDER[idx];
}

function normalize(s) {
  if (!s) return 'O(1)';
  let t = String(s).trim();
  t = t.replace('^2', '²').replace('2^n', '2ⁿ').replace('n^2', 'n²');
  if (!ALLOWED.has(t)) {
    // Collapse to nearest conservative option
    if (/2\s*\^\s*n|2ⁿ/i.test(t)) return 'O(2ⁿ)';
    if (/n\s*\^\s*\d+|n\s*\*\s*n\s*\*\s*n/i.test(t)) return 'O(n²)';
    if (/n\s*log\s*n|log\s*n\s*\*\s*n/i.test(t)) return 'O(n log n)';
    if (/log\s*n/i.test(t)) return 'O(log n)';
    if (/\bn\b/i.test(t)) return 'O(n)';
    return 'O(1)';
  }
  return t;
}

function estimateTimeComplexityAST(featuresInput) {
  const f = featuresInput || {};
  const loopCount = Number.isFinite(f.loopCount) ? f.loopCount : 0;
  const nestedLoopCount = Number.isFinite(f.nestedLoopCount) ? f.nestedLoopCount : 0;
  const recursionDetected = !!f.recursionDetected;
  const usesSorting = !!f.usesSorting;

  // Optional extended AST features; default to false when absent
  const hasLogLoop = !!f.hasLogLoop; // e.g., halving via /2 or >>1 or multiplicative updates
  const memoizationOrDP = !!f.memoizationOrDP;
  const dividesInput = !!f.dividesInput; // recursive divide-and-conquer
  const hasLinearWorkInsideRecursion = !!f.hasLinearWorkInsideRecursion;

  const candidates = [];

  // R1 Exponential recursion
  if (recursionDetected && !dividesInput && !memoizationOrDP) {
    candidates.push('O(2ⁿ)');
  }

  // R2 Divide-and-conquer recursion producing logarithmic time (search-like)
  if (recursionDetected && dividesInput && !hasLinearWorkInsideRecursion && loopCount <= 1) {
    candidates.push('O(log n)');
  }

  // R3 Sorting present
  if (usesSorting) {
    candidates.push('O(n log n)');
  }

  // R4 Nested loops
  if (nestedLoopCount >= 1) {
    candidates.push('O(n²)');
  }

  // R5 Logarithmic loop (geometric reduction)
  if (hasLogLoop && nestedLoopCount === 0 && !recursionDetected) {
    candidates.push('O(log n)');
  }

  // R6 Single linear loop (no logarithmic reduction and no recursion)
  if (loopCount >= 1 && nestedLoopCount === 0 && !hasLogLoop && !recursionDetected) {
    candidates.push('O(n)');
  }

  // Fallback R0 Constant when nothing recognized
  if (candidates.length === 0 && !recursionDetected && loopCount === 0) {
    candidates.push('O(1)');
  }

  // Overrides
  // O1 Sorting + nested loops → O(n²)
  if (usesSorting && nestedLoopCount >= 1) {
    candidates.push('O(n²)');
  }
  // O2 Divide-and-conquer with linear combine → O(n log n)
  if (recursionDetected && dividesInput && hasLinearWorkInsideRecursion) {
    candidates.push('O(n log n)');
  }
  // O3 Recursion with memoization → O(n)
  if (recursionDetected && memoizationOrDP) {
    candidates.push('O(n)');
  }
  // O4 Log-loop alongside at least one other independent loop → O(n log n)
  if (hasLogLoop && loopCount > 1 && nestedLoopCount === 0) {
    candidates.push('O(n log n)');
  }

  return worstCase(candidates);
}

module.exports = {
  estimateTimeComplexityAST,
  normalize,
  estimateSpaceComplexityAST: function estimateSpaceComplexityAST(featuresInput) {
    const f = featuresInput || {};
    const recursionDetected = !!f.recursionDetected;
    const dividesInput = !!f.dividesInput; // recursive D&C halves depth → log n
    const memoizationOrDP = !!f.memoizationOrDP; // DP/memo tables imply O(n) aux space
    const usesHashMap = !!f.usesHashMap; // maps/sets scale with n
    const usesStack = !!f.usesStack; // explicit stack can grow with n
    const useQueue = !!f.useQueue; // queues can grow with n

    // Candidates with worst-case selection: O(n) > O(log n) > O(1)
    const candidates = [];

    // Auxiliary structures
    if (memoizationOrDP || usesHashMap || usesStack || useQueue) {
      candidates.push('O(n)');
    }

    // Recursion stack space (conservative: only when structure is evident)
    // - dividesInput: logarithmic recursion depth
    // - memoizationOrDP: typical top-down DP implies O(n) memo + stack
    if (recursionDetected) {
      if (dividesInput) candidates.push('O(log n)');
      else if (memoizationOrDP) candidates.push('O(n)');
      // else: unknown recursion depth → do not assume extra space
    }

    if (candidates.length === 0) return 'O(1)';
    // Worst-case among candidates given restricted set
    if (candidates.includes('O(n)')) return 'O(n)';
    if (candidates.includes('O(log n)')) return 'O(log n)';
    return 'O(1)';
  },
};
