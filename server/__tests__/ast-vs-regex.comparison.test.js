describe('AST vs Regex extraction parity - comparison', () => {
  function getASTFeatures(code) {
    jest.resetModules();
    const { extractLogicFeatures } = require('../utils/logicFeatureExtractor');
    return extractLogicFeatures(code, 'javascript');
  }

  function getRegexFeatures(code) {
    jest.resetModules();
    jest.isolateModules(() => {
      jest.doMock('../ast/core/extractorAdapter', () => null, { virtual: true });
    });
    const { extractLogicFeatures } = require('../utils/logicFeatureExtractor');
    return extractLogicFeatures(code, 'javascript');
  }

  function expectParity(astF, regexF) {
    const keys = [
      'loopCount',
      'nestedLoopCount',
      'recursionDetected',
      'usesHashMap',
      'usesSorting',
      'estimatedTimeComplexity',
      'estimatedSpaceComplexity',
    ];
    for (const k of keys) {
      expect(astF[k]).toEqual(regexF[k]);
    }
  }

  test('binary search (iterative) parity on key fields', () => {
    const code = `
      function binarySearch(a, t){
        let l=0, r=a.length-1; while(l<=r){ const m=(l+r)>>1; if(a[m]===t) return m; if(a[m]<t) l=m+1; else r=m-1; } return -1;
      }
    `;
    const astF = getASTFeatures(code);
    const regexF = getRegexFeatures(code);
    expectParity(astF, regexF);
  });

  test('nested loops parity on key fields', () => {
    const code = `
      function pairs(a){ let c=0; for(let i=0;i<a.length;i++){ for(let j=0;j<a.length;j++){ c++; } } return c; }
    `;
    const astF = getASTFeatures(code);
    const regexF = getRegexFeatures(code);
    expectParity(astF, regexF);
  });

  test('sorting usage parity on key fields', () => {
    const code = `
      function s(a){ const b=[...a]; b.sort((x,y)=>x-y); return b; }
    `;
    const astF = getASTFeatures(code);
    const regexF = getRegexFeatures(code);
    expectParity(astF, regexF);
  });
});
