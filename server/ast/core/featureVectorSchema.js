// Canonical feature vector schema (backward compatible)
// Keep fields and safe defaults identical to legacy extractor

function createDefaultFeatures() {
  return {
    loopCount: 0,
    nestedLoopCount: 0,
    conditionalCount: 0,
    recursionDetected: false,

    usesSorting: false,
    usesHashMap: false,
    usesStack: false,
    useQueue: false,
    arrayManipulation: false,

    graphTraversal: false,
    dynamicProgramming: false,
    twoPointers: false,
    slidingWindow: false,

    constantOnlyOutput: false,
    inputDependentLogic: false,
    hardcodingDetected: false,

    estimatedTimeComplexity: 'O(1)',
    estimatedSpaceComplexity: 'O(1)',

    paradigm: 'Simple Logic',

    lineCount: 0,
    characterCount: 0,
  };
}

function validateFeatures(features) {
  const defaults = createDefaultFeatures();
  const result = { ...defaults, ...(features || {}) };
  // Ensure type safety for known fields
  result.loopCount = Number.isFinite(result.loopCount) ? result.loopCount : 0;
  result.nestedLoopCount = Number.isFinite(result.nestedLoopCount) ? result.nestedLoopCount : 0;
  result.conditionalCount = Number.isFinite(result.conditionalCount) ? result.conditionalCount : 0;
  result.recursionDetected = !!result.recursionDetected;
  return result;
}

module.exports = {
  createDefaultFeatures,
  validateFeatures,
};