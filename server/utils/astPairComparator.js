// AST Pair Comparator: runs the exact same pipeline on reference and submission
// and returns a normalized comparison with clear pass/fail markers and deltas.

const { extractLogicFeatures } = require('./logicFeatureExtractor');

function core(features) {
  return {
    loopCount: features.loopCount,
    nestedLoopCount: features.nestedLoopCount,
    recursionDetected: !!features.recursionDetected,
    usesHashMap: !!features.usesHashMap,
    usesSorting: !!features.usesSorting,
    memoizationOrDP: !!features.memoizationOrDP,
    hasLogLoop: !!features.hasLogLoop,
    dividesInput: !!features.dividesInput,
    paradigm: features.paradigm,
    estimatedTimeComplexity: features.estimatedTimeComplexity,
    estimatedSpaceComplexity: features.estimatedSpaceComplexity,
  };
}

function compareCodePair({ reference, submission }) {
  const refLang = (reference && reference.language) || 'python';
  const subLang = (submission && submission.language) || refLang;
  const refCode = (reference && reference.code) || '';
  const subCode = (submission && submission.code) || '';

  const refFeatures = extractLogicFeatures(refCode, refLang);
  const subFeatures = extractLogicFeatures(subCode, subLang);

  const ref = core(refFeatures);
  const sub = core(subFeatures);

  const timeMatch = ref.estimatedTimeComplexity === sub.estimatedTimeComplexity;
  const spaceMatch = ref.estimatedSpaceComplexity === sub.estimatedSpaceComplexity;
  const paradigmMatch = (ref.paradigm && sub.paradigm) ? ref.paradigm === sub.paradigm : false;

  // Equivalence classes (soft): logarithmic search and DP/memo
  const logSearchRef = ref.estimatedTimeComplexity === 'O(log n)';
  const logSearchSub = sub.estimatedTimeComplexity === 'O(log n)';
  const dpClassRef = !!ref.memoizationOrDP || ref.paradigm === 'Dynamic Programming';
  const dpClassSub = !!sub.memoizationOrDP || sub.paradigm === 'Dynamic Programming';

  const comparison = {
    success: true,
    overallMatch: timeMatch && spaceMatch,
    matches: {
      timeMatch,
      spaceMatch,
      paradigmMatch,
    },
    reference: ref,
    submission: sub,
    deltas: {
      loopCount: sub.loopCount - ref.loopCount,
      nestedLoopCount: sub.nestedLoopCount - ref.nestedLoopCount,
      flags: {
        usesHashMap: { reference: ref.usesHashMap, submission: sub.usesHashMap },
        usesSorting: { reference: ref.usesSorting, submission: sub.usesSorting },
        recursionDetected: { reference: ref.recursionDetected, submission: sub.recursionDetected },
        memoizationOrDP: { reference: ref.memoizationOrDP, submission: sub.memoizationOrDP },
        hasLogLoop: { reference: ref.hasLogLoop, submission: sub.hasLogLoop },
        dividesInput: { reference: ref.dividesInput, submission: sub.dividesInput },
      },
    },
    equivalence: {
      logarithmicSearchClass: logSearchRef && logSearchSub,
      dynamicProgrammingClass: dpClassRef && dpClassSub,
    },
  };

  return comparison;
}

module.exports = {
  compareCodePair,
};
