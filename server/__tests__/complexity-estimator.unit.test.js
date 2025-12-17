const { estimateTimeComplexityAST, estimateSpaceComplexityAST, normalize } = require('../ast/core/complexityEstimator');

describe('Complexity Estimator (AST features) - unit', () => {
  test('normalization of symbols', () => {
    expect(normalize('O(n^2)')).toBe('O(n²)');
    expect(normalize('O(2^n)')).toBe('O(2ⁿ)');
    expect(normalize('something weird')).toBe('O(1)');
  });

  test('linear loop → O(n)', () => {
    const f = { loopCount: 1, nestedLoopCount: 0, recursionDetected: false };
    expect(estimateTimeComplexityAST(f)).toBe('O(n)');
  });

  test('nested loops → O(n²)', () => {
    const f = { loopCount: 2, nestedLoopCount: 1, recursionDetected: false };
    expect(estimateTimeComplexityAST(f)).toBe('O(n²)');
  });

  test('sorting present → O(n log n)', () => {
    const f = { usesSorting: true };
    expect(estimateTimeComplexityAST(f)).toBe('O(n log n)');
  });

  test('logarithmic loop → O(log n)', () => {
    const f = { hasLogLoop: true, nestedLoopCount: 0, recursionDetected: false };
    expect(estimateTimeComplexityAST(f)).toBe('O(log n)');
  });

  test('binary-search-like recursion → O(log n)', () => {
    const f = { recursionDetected: true, dividesInput: true, loopCount: 0 };
    expect(estimateTimeComplexityAST(f)).toBe('O(log n)');
    expect(estimateSpaceComplexityAST(f)).toBe('O(log n)');
  });

  test('memoized recursion → O(n) time and space', () => {
    const f = { recursionDetected: true, memoizationOrDP: true };
    expect(estimateTimeComplexityAST(f)).toBe('O(n)');
    expect(estimateSpaceComplexityAST(f)).toBe('O(n)');
  });

  test('exponential recursion (no divide, no memo) → O(2ⁿ)', () => {
    const f = { recursionDetected: true, dividesInput: false, memoizationOrDP: false };
    expect(estimateTimeComplexityAST(f)).toBe('O(2ⁿ)');
  });

  test('space: explicit structures imply O(n)', () => {
    const f = { usesHashMap: true, usesStack: false, useQueue: false };
    expect(estimateSpaceComplexityAST(f)).toBe('O(n)');
  });
});
