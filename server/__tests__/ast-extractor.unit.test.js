const { extractFeaturesAST } = require('../ast/core/extractorAdapter');
const { estimateTimeComplexityAST, estimateSpaceComplexityAST } = require('../ast/core/complexityEstimator');

describe('AST Extractor (JavaScript) - unit', () => {
  test('detects single loop, no recursion → O(n)', () => {
    const code = `
      function sum(arr){
        let s=0; for(let i=0;i<arr.length;i++){ s+=arr[i]; }
        return s;
      }
    `;
    const f = extractFeaturesAST(code, 'javascript');
    expect(f.loopCount).toBeGreaterThanOrEqual(1);
    expect(f.nestedLoopCount).toBe(0);
    expect(f.recursionDetected).toBe(false);
    expect(estimateTimeComplexityAST(f)).toBe('O(n)');
    expect(estimateSpaceComplexityAST(f)).toBe('O(1)');
  });

  test('detects nested loops → O(n²)', () => {
    const code = `
      function pairs(a){
        let c=0; for(let i=0;i<a.length;i++){ for(let j=0;j<a.length;j++){ c++; } }
        return c;
      }
    `;
    const f = extractFeaturesAST(code, 'javascript');
    expect(f.loopCount).toBeGreaterThanOrEqual(2);
    expect(f.nestedLoopCount).toBeGreaterThanOrEqual(1);
    expect(estimateTimeComplexityAST(f)).toBe('O(n²)');
  });

  test('detects sorting → O(n log n)', () => {
    const code = `
      function sortedCopy(a){ const b=[...a]; b.sort((x,y)=>x-y); return b; }
    `;
    const f = extractFeaturesAST(code, 'javascript');
    expect(f.usesSorting).toBe(true);
    expect(estimateTimeComplexityAST(f)).toBe('O(n log n)');
  });

  test('detects direct recursion and dividesInput → O(log n) time, O(log n) space', () => {
    const code = `
      function bs(a, t, l=0, r=a.length-1){
        if(l>r) return -1; const m = Math.floor((l+r)/2);
        if(a[m]===t) return m; if(a[m] < t) return bs(a,t,m+1,r); else return bs(a,t,l,m-1);
      }
    `;
    const f = extractFeaturesAST(code, 'javascript');
    expect(f.recursionDetected).toBe(true);
    // Extended AST flags
    expect(f.dividesInput).toBe(true);
    expect(estimateTimeComplexityAST(f)).toBe('O(log n)');
    expect(estimateSpaceComplexityAST(f)).toBe('O(log n)');
  });

  test('detects hasLogLoop for iterative halving → O(log n)', () => {
    const code = `
      function countDown(n){ let c=0; while(n>1){ n = n/2; c++; } return c; }
    `;
    const f = extractFeaturesAST(code, 'javascript');
    expect(f.hasLogLoop).toBe(true);
    expect(f.recursionDetected).toBe(false);
    expect(estimateTimeComplexityAST(f)).toBe('O(log n)');
  });

  test('detects memoizationOrDP → O(n) time, O(n) space', () => {
    const code = `
      function fib(n, memo={}){
        if(n<=1) return n; if(memo[n]!==undefined) return memo[n];
        memo[n] = fib(n-1, memo) + fib(n-2, memo); return memo[n];
      }
    `;
    const f = extractFeaturesAST(code, 'javascript');
    expect(f.recursionDetected).toBe(true);
    expect(f.memoizationOrDP).toBe(true);
    expect(estimateTimeComplexityAST(f)).toBe('O(n)');
    expect(estimateSpaceComplexityAST(f)).toBe('O(n)');
  });

  test('empty code → safe defaults', () => {
    const f = extractFeaturesAST('   ', 'javascript');
    expect(f.loopCount).toBe(0);
    expect(f.estimatedTimeComplexity).toBe('O(1)');
  });
});
