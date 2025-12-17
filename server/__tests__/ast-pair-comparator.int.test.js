const { compareCodePair } = require('../utils/astPairComparator');

describe('AST Pair Comparator - integration', () => {
  test('binary search variants considered overall match', () => {
    const iterative = `
      function binarySearch(a, t){
        let l=0, r=a.length-1; while(l<=r){ const m=(l+r)>>1; if(a[m]===t) return m; if(a[m]<t) l=m+1; else r=m-1; } return -1;
      }
    `;
    const recursive = `
      function bs(a,t,l=0,r=a.length-1){ if(l>r) return -1; const m=Math.floor((l+r)/2); if(a[m]===t) return m; if(a[m]<t) return bs(a,t,m+1,r); return bs(a,t,l,m-1); }
    `;
    const res = compareCodePair({
      reference: { code: iterative, language: 'javascript' },
      submission: { code: recursive, language: 'javascript' }
    });
    expect(res).toBeTruthy();
    // Time should align at O(log n); space differs (iterative O(1) vs recursive O(log n))
    expect(res.matches.timeMatch).toBe(true);
    expect(res.matches.spaceMatch).toBe(false);
    expect(res.equivalence.logarithmicSearchClass).toBe(true);
    expect(res.reference.estimatedTimeComplexity).toBe('O(log n)');
    expect(res.submission.estimatedTimeComplexity).toBe('O(log n)');
  });
});
