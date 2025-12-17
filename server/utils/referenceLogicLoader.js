const fs = require('fs');
const path = require('path');

// In-memory cache for loaded reference logic
const logicCache = new Map();

// Directory containing reference logic files
const LOGIC_DIR = path.join(__dirname, '..', 'logic');

/**
 * Validates required fields in reference logic object
 * @param {Object} logic - The logic object to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validateReferenceLogic(logic) {
  const requiredFields = [
    'questionId',
    'expectedAlgorithm',
    'allowedApproaches',
    'expectedTimeComplexity',
    'expectedSpaceComplexity',
    'disallowedPatterns',
  ];

  for (const field of requiredFields) {
    if (!Object.prototype.hasOwnProperty.call(logic, field)) {
      console.error(`[ReferenceLogicLoader] Missing required field: ${field}`);
      return false;
    }
  }

  // Validate types
  if (typeof logic.questionId !== 'string') {
    console.error('[ReferenceLogicLoader] questionId must be a string');
    return false;
  }

  if (typeof logic.expectedAlgorithm !== 'string') {
    console.error('[ReferenceLogicLoader] expectedAlgorithm must be a string');
    return false;
  }

  if (!Array.isArray(logic.allowedApproaches)) {
    console.error('[ReferenceLogicLoader] allowedApproaches must be an array');
    return false;
  }

  if (!Array.isArray(logic.disallowedPatterns)) {
    console.error('[ReferenceLogicLoader] disallowedPatterns must be an array');
    return false;
  }

  if (typeof logic.expectedTimeComplexity !== 'string') {
    console.error(
      '[ReferenceLogicLoader] expectedTimeComplexity must be a string'
    );
    return false;
  }

  if (typeof logic.expectedSpaceComplexity !== 'string') {
    console.error(
      '[ReferenceLogicLoader] expectedSpaceComplexity must be a string'
    );
    return false;
  }

  return true;
}

/**
 * Normalize logic object to enforce schema and add safe defaults
 * @param {Object} logic - Parsed logic object
 * @param {string} sourceLabel - File path or identifier for logging
 * @returns {Object} - Normalized logic
 */
function normalizeLogicSchema(logic, sourceLabel) {
  if (!logic || typeof logic !== 'object') return logic;

  // Safe defaults for complexities if missing
  let warned = false;
  if (!Object.prototype.hasOwnProperty.call(logic, 'expectedTimeComplexity')) {
    logic.expectedTimeComplexity = 'O(1)';
    warned = true;
  }
  if (!Object.prototype.hasOwnProperty.call(logic, 'expectedSpaceComplexity')) {
    logic.expectedSpaceComplexity = 'O(1)';
    warned = true;
  }

  if (warned) {
    const id = logic.questionId || path.basename(sourceLabel).replace('.json', '');
    console.warn(
      `[ReferenceLogicLoader] Missing complexity fields for ${id}. Applied SAFE DEFAULTS (Time: O(1), Space: O(1)). Source: ${sourceLabel}`
    );
  }

  return logic;
}

/**
 * Loads reference logic from file system
 * @param {string} questionId - The question ID (e.g., 'Q001')
 * @returns {Object|null} - The reference logic object or null if not found/invalid
 */
function loadReferenceLogicFromFile(questionId) {
  const filePath = path.join(LOGIC_DIR, `${questionId}.json`);

  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.warn(`[ReferenceLogicLoader] File not found: ${filePath}`);
      return null;
    }

    // Read and parse JSON file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    let logic = JSON.parse(fileContent);

    // Normalize with safe defaults before validation
    logic = normalizeLogicSchema(logic, filePath);

    // Validate the loaded logic
    if (!validateReferenceLogic(logic)) {
      console.error(
        `[ReferenceLogicLoader] Invalid logic format in ${filePath}`
      );
      return null;
    }

    console.log(
      `[ReferenceLogicLoader] Successfully loaded logic for ${questionId}`
    );
    return logic;
  } catch (error) {
    console.error(
      `[ReferenceLogicLoader] Error loading ${filePath}:`,
      error.message
    );
    return null;
  }
}

/**
 * Gets reference logic for a question (with caching)
 * @param {string} questionId - The question ID (e.g., 'Q001', '1', or 1)
 * @returns {Object|null} - The reference logic object or null if not found
 */
function getReferenceLogic(questionId) {
  // Normalize questionId to string format (Q001, Q002, etc.)
  let normalizedId;

  if (typeof questionId === 'number') {
    // Convert number to Q00X format
    normalizedId = `Q${String(questionId).padStart(3, '0')}`;
  } else if (typeof questionId === 'string') {
    // If already in Q00X format, use as is
    if (questionId.match(/^Q\d{3}$/)) {
      normalizedId = questionId;
    } else if (questionId.match(/^\d+$/)) {
      // If numeric string, convert to Q00X format
      normalizedId = `Q${questionId.padStart(3, '0')}`;
    } else {
      normalizedId = questionId;
    }
  } else {
    console.error('[ReferenceLogicLoader] Invalid questionId type');
    return null;
  }

  // Check cache first
  if (logicCache.has(normalizedId)) {
    console.log(`[ReferenceLogicLoader] Cache hit for ${normalizedId}`);
    return logicCache.get(normalizedId);
  }

  // Load from file
  const logic = loadReferenceLogicFromFile(normalizedId);

  // Cache the result (even if null, to avoid repeated file reads)
  if (logic !== null) {
    logicCache.set(normalizedId, logic);
    console.log(`[ReferenceLogicLoader] Cached logic for ${normalizedId}`);
  }

  return logic;
}

/**
 * Clears the cache (useful for testing or reloading)
 */
function clearCache() {
  logicCache.clear();
  console.log('[ReferenceLogicLoader] Cache cleared');
}

/**
 * Preloads all reference logic files into cache
 * @returns {number} - Number of files successfully loaded
 */
function preloadAllLogic() {
  try {
    const indexPath = path.join(LOGIC_DIR, 'index.json');

    if (!fs.existsSync(indexPath)) {
      console.warn(
        '[ReferenceLogicLoader] index.json not found, scanning directory...'
      );

      // Fallback: scan directory for JSON files
      const files = fs
        .readdirSync(LOGIC_DIR)
        .filter((file) => file.endsWith('.json') && file !== 'index.json');

      let loadedCount = 0;
      for (const file of files) {
        const questionId = file.replace('.json', '');
        if (getReferenceLogic(questionId)) {
          loadedCount++;
        }
      }

      console.log(
        `[ReferenceLogicLoader] Preloaded ${loadedCount} reference logic files`
      );
      return loadedCount;
    }

    // Load using index.json
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    const index = JSON.parse(indexContent);

    let loadedCount = 0;
    for (const entry of index.questions || []) {
      if (getReferenceLogic(entry.questionId)) {
        loadedCount++;
      }
    }

    console.log(
      `[ReferenceLogicLoader] Preloaded ${loadedCount} reference logic files from index`
    );
    return loadedCount;
  } catch (error) {
    console.error(
      '[ReferenceLogicLoader] Error preloading logic:',
      error.message
    );
    return 0;
  }
}

/**
 * Gets all available question IDs
 * @returns {Array<string>} - Array of question IDs
 */
function getAllQuestionIds() {
  try {
    const files = fs
      .readdirSync(LOGIC_DIR)
      .filter((file) => file.endsWith('.json') && file !== 'index.json')
      .map((file) => file.replace('.json', ''));

    return files;
  } catch (error) {
    console.error(
      '[ReferenceLogicLoader] Error reading logic directory:',
      error.message
    );
    return [];
  }
}

/**
 * Compares student logic features against reference logic
 * @param {Object} studentFeatures - Extracted student code features
 * @param {string} questionId - Question ID
 * @returns {Object} - Comprehensive comparison results
 */
/**
 * Compares student code features against reference logic
 * @param {Object} studentFeatures - Extracted features from student code
 * @param {string} questionId - Question identifier (e.g., "Q001")
 * @returns {Object} - Comparison result with matched status, issues, warnings, successes
 *
 * SAFE HANDLING:
 * - Validates studentFeatures structure before comparison
 * - Uses safe defaults for missing fields
 * - Never throws errors, returns structured feedback
 * - Computes logicScore (0-100) for deterministic scoring
 */
function compareAgainstReference(studentFeatures, questionId) {
  // Input validation
  if (!studentFeatures || typeof studentFeatures !== 'object') {
    console.error('[Comparator] Invalid studentFeatures, using safe defaults');
    studentFeatures = createSafeFeatureDefaults();
  }

  const referenceLogic = getReferenceLogic(questionId);

  if (!referenceLogic) {
    return {
      success: false,
      error: `Reference logic not found for question ${questionId}`,
      matched: false,
      algorithmMatch: 'NONE',
      complexityMatch: false,
      violatesDisallowedPatterns: false,
      logicScore: 0,
      issues: [],
      warnings: [],
      successes: [],
    };
  }

  const comparison = {
    questionId,
    referenceAlgorithm: referenceLogic.expectedAlgorithm,
    matched: true,
    algorithmMatch: 'FULL', // FULL, PARTIAL, NONE
    complexityMatch: false,
    timeComplexityMatch: false,
    spaceComplexityMatch: false,
    violatesDisallowedPatterns: false,
    logicScore: 100, // Start at 100, deduct for issues
    issues: [],
    warnings: [],
    successes: [],
    details: {},
    // Phase 5 fields (initialized; populated below)
    detectedTimeComplexity: studentFeatures.estimatedTimeComplexity,
    expectedTimeComplexity: referenceLogic.expectedTimeComplexity,
    detectedSpaceComplexity: studentFeatures.estimatedSpaceComplexity,
    expectedSpaceComplexity: referenceLogic.expectedSpaceComplexity,
    complexityMarks: 0,
  };

  // Check time complexity
  const acceptable = Array.isArray(referenceLogic.acceptableComplexities)
    ? referenceLogic.acceptableComplexities
    : [];
  const timeMatchesExpected =
    studentFeatures.estimatedTimeComplexity ===
    referenceLogic.expectedTimeComplexity;
  const timeMatchesAcceptable = acceptable.includes(
    studentFeatures.estimatedTimeComplexity
  );

  if (!(timeMatchesExpected || timeMatchesAcceptable)) {
    comparison.issues.push({
      type: 'complexity_mismatch',
      severity: 'high',
      expected: referenceLogic.expectedTimeComplexity,
      actual: studentFeatures.estimatedTimeComplexity,
      message: `Time complexity mismatch: expected ${referenceLogic.expectedTimeComplexity}, got ${studentFeatures.estimatedTimeComplexity}`,
    });
    comparison.matched = false;
  } else {
    comparison.successes.push({
      type: 'complexity_match',
      message: timeMatchesExpected
        ? `Time complexity matches expected: ${referenceLogic.expectedTimeComplexity}`
        : `Time complexity matches acceptable set: ${studentFeatures.estimatedTimeComplexity}`,
    });
    comparison.details.complexityMatch = true;
    comparison.timeComplexityMatch = true;
  }

  // Check space complexity if defined
  if (referenceLogic.expectedSpaceComplexity) {
    const spaceMatchesExpected =
      studentFeatures.estimatedSpaceComplexity ===
      referenceLogic.expectedSpaceComplexity;
    if (!spaceMatchesExpected) {
      comparison.warnings.push({
        type: 'space_complexity_mismatch',
        severity: 'medium',
        expected: referenceLogic.expectedSpaceComplexity,
        actual: studentFeatures.estimatedSpaceComplexity,
      });
    } else {
      comparison.successes.push({
        type: 'space_complexity_match',
        message: `Space complexity matches: ${referenceLogic.expectedSpaceComplexity}`,
      });
      comparison.spaceComplexityMatch = true;
    }
  }

  // Check paradigm if defined
  if (
    referenceLogic.paradigm &&
    studentFeatures.paradigm !== referenceLogic.paradigm
  ) {
    comparison.warnings.push({
      type: 'paradigm_mismatch',
      severity: 'low',
      expected: referenceLogic.paradigm,
      actual: studentFeatures.paradigm,
      message: `Expected ${referenceLogic.paradigm} approach but detected ${studentFeatures.paradigm}`,
    });
  } else if (referenceLogic.paradigm) {
    comparison.successes.push({
      type: 'paradigm_match',
      message: `Algorithm paradigm correct: ${referenceLogic.paradigm}`,
    });
  }

  // Check constraints if defined
  if (referenceLogic.constraints) {
    const constraints = referenceLogic.constraints;

    if (constraints.shouldReadInput && !studentFeatures.inputDependentLogic) {
      comparison.issues.push({
        type: 'missing_input_handling',
        severity: 'high',
        message: 'Solution must read input but does not',
      });
      comparison.matched = false;
    } else if (
      constraints.shouldReadInput &&
      studentFeatures.inputDependentLogic
    ) {
      comparison.successes.push({
        type: 'input_handling_correct',
        message: 'Input is properly read and processed',
      });
    }

    if (constraints.shouldUseLoops && studentFeatures.loopCount === 0) {
      comparison.warnings.push({
        type: 'missing_loops',
        severity: 'medium',
        message: 'Solution should use loops for efficiency',
      });
    } else if (constraints.shouldUseLoops && studentFeatures.loopCount > 0) {
      comparison.successes.push({
        type: 'loops_used',
        message: `Solution correctly uses ${studentFeatures.loopCount} loop(s)`,
      });
    }

    if (constraints.shouldUseRecursion && !studentFeatures.recursionDetected) {
      comparison.warnings.push({
        type: 'missing_recursion',
        severity: 'medium',
        message: 'Solution should use recursion',
      });
    } else if (
      constraints.shouldUseRecursion &&
      studentFeatures.recursionDetected
    ) {
      comparison.successes.push({
        type: 'recursion_used',
        message: 'Recursion correctly implemented',
      });
    }

    if (!constraints.shouldUseLoops && studentFeatures.loopCount > 0) {
      comparison.warnings.push({
        type: 'unnecessary_loops',
        severity: 'low',
        message: `Solution has loops but doesn't require them (O(1) solution expected)`,
      });
    }

    if (!constraints.shouldUseRecursion && studentFeatures.recursionDetected) {
      comparison.warnings.push({
        type: 'unnecessary_recursion',
        severity: 'low',
        message: 'Recursive solution not needed',
      });
    }

    // Check line count constraints
    if (
      constraints.minLineCount &&
      studentFeatures.lineCount < constraints.minLineCount
    ) {
      comparison.warnings.push({
        type: 'too_short',
        severity: 'low',
        message: `Solution is very short (${studentFeatures.lineCount} lines vs ${constraints.minLineCount} minimum)`,
      });
    }

    if (
      constraints.maxLineCount &&
      studentFeatures.lineCount > constraints.maxLineCount
    ) {
      comparison.warnings.push({
        type: 'too_long',
        severity: 'low',
        message: `Solution seems verbose (${studentFeatures.lineCount} lines vs ${constraints.maxLineCount} maximum)`,
      });
    }
  }

  // Check disallowed patterns
  if (referenceLogic.disallowedPatterns) {
    for (const pattern of referenceLogic.disallowedPatterns) {
      const patternLower = pattern.toLowerCase();

      if (
        patternLower.includes('hardcod') &&
        studentFeatures.hardcodingDetected
      ) {
        comparison.issues.push({
          type: 'hardcoding_detected',
          severity: 'high',
          pattern: pattern,
          message: 'Hardcoded values detected - solution must handle any input',
        });
        comparison.matched = false;
      }

      if (
        patternLower.includes('nested') &&
        studentFeatures.nestedLoopCount > 0
      ) {
        comparison.issues.push({
          type: 'nested_loops_detected',
          severity: 'high',
          pattern: pattern,
          message: `Nested loops detected (${studentFeatures.nestedLoopCount}) - optimize to single loop`,
        });
        comparison.matched = false;
      }

      if (
        patternLower.includes('brute') &&
        studentFeatures.nestedLoopCount >= 2
      ) {
        comparison.issues.push({
          type: 'brute_force_detected',
          severity: 'high',
          pattern: pattern,
          message:
            'Brute force approach detected - use more efficient algorithm',
        });
        comparison.matched = false;
      }

      if (
        patternLower.includes('recursion') &&
        !patternLower.includes('without') &&
        studentFeatures.recursionDetected
      ) {
        comparison.issues.push({
          type: 'recursion_detected',
          severity: 'medium',
          pattern: pattern,
          message: 'Recursive solution not allowed',
        });
      }

      if (
        patternLower.includes('linear') &&
        studentFeatures.estimatedTimeComplexity === 'O(n)' &&
        studentFeatures.loopCount === 1
      ) {
        comparison.issues.push({
          type: 'linear_search_detected',
          severity: 'high',
          pattern: pattern,
          message: 'Linear search detected - use more efficient approach',
        });
        comparison.matched = false;
      }
    }
  }

  // Check allowed approaches
  if (referenceLogic.allowedApproaches) {
    let foundApproach = false;
    const possibleApproaches = [];

    for (const approach of referenceLogic.allowedApproaches) {
      const approachLower = approach.toLowerCase();

      if (approachLower.includes('hash') && studentFeatures.usesHashMap) {
        foundApproach = true;
        possibleApproaches.push('hash_map');
      }
      if (approachLower.includes('sort') && studentFeatures.usesSorting) {
        foundApproach = true;
        possibleApproaches.push('sorting');
      }
      if (
        approachLower.includes('two_pointer') &&
        studentFeatures.twoPointers
      ) {
        foundApproach = true;
        possibleApproaches.push('two_pointers');
      }
      if (
        approachLower.includes('binary') &&
        (
          studentFeatures.estimatedTimeComplexity === 'O(log n)' ||
          studentFeatures.hasLogLoop === true ||
          studentFeatures.dividesInput === true
        )
      ) {
        foundApproach = true;
        possibleApproaches.push('binary_search');
      }
      if (
        approachLower.includes('dp') &&
        (studentFeatures.dynamicProgramming || studentFeatures.memoizationOrDP)
      ) {
        foundApproach = true;
        possibleApproaches.push('dynamic_programming');
      }
      if (
        approachLower.includes('greedy') &&
        studentFeatures.paradigm === 'Simple Logic'
      ) {
        foundApproach = true;
        possibleApproaches.push('greedy');
      }
      if (
        approachLower.includes('print') &&
        studentFeatures.loopCount === 0 &&
        !studentFeatures.inputDependentLogic
      ) {
        foundApproach = true;
        possibleApproaches.push('simple_output');
      }
      if (
        approachLower.includes('addition') &&
        studentFeatures.paradigm === 'Simple Logic'
      ) {
        foundApproach = true;
        possibleApproaches.push('arithmetic_operation');
      }
    }

    if (foundApproach && possibleApproaches.length > 0) {
      comparison.successes.push({
        type: 'approach_match',
        message: `Approach matches allowed methods: ${possibleApproaches.join(', ')}`,
      });
      comparison.details.detectedApproaches = possibleApproaches;
    } else if (!foundApproach && studentFeatures.paradigm === 'Simple Logic') {
      comparison.successes.push({
        type: 'approach_match',
        message: `Simple approach matches allowed: ${referenceLogic.allowedApproaches.join(', ')}`,
      });
    }
  }

  // Calculate logic score (0-100) based on comparison results
  // Start at 100, deduct for issues
  let logicScore = 100;

  // Deduct for critical issues
  const criticalIssues = comparison.issues.filter((i) => i.severity === 'high');
  logicScore -= criticalIssues.length * 20; // -20 per critical issue

  // Deduct for medium issues
  const mediumIssues = comparison.issues.filter((i) => i.severity === 'medium');
  logicScore -= mediumIssues.length * 10; // -10 per medium issue

  // Deduct for warnings
  logicScore -= comparison.warnings.length * 5; // -5 per warning

  // Ensure score is between 0-100
  logicScore = Math.max(0, Math.min(100, logicScore));

  // Set algorithmMatch level
  if (comparison.issues.length === 0) {
    comparison.algorithmMatch = 'FULL';
  } else if (comparison.issues.length <= 2) {
    comparison.algorithmMatch = 'PARTIAL';
  } else {
    comparison.algorithmMatch = 'NONE';
  }

  // Set complexity match flag
  comparison.complexityMatch =
    comparison.timeComplexityMatch && comparison.spaceComplexityMatch;

  // Phase 5: compute fixed complexity marks (0/5/10)
  if (comparison.timeComplexityMatch && comparison.spaceComplexityMatch) {
    comparison.complexityMarks = 10;
  } else if (
    comparison.timeComplexityMatch || comparison.spaceComplexityMatch
  ) {
    comparison.complexityMarks = 5;
  } else {
    comparison.complexityMarks = 0;
  }

  // Set disallowed patterns flag
  comparison.violatesDisallowedPatterns = comparison.issues.some(
    (i) =>
      i.type === 'hardcoding_detected' ||
      i.type === 'nested_loops_detected' ||
      i.type === 'brute_force_detected'
  );

  // Add logic score
  comparison.logicScore = logicScore;

  // Add summary reasons for verdict engine
  comparison.reasons = [];
  if (comparison.complexityMatch) {
    comparison.reasons.push(
      `✓ Time complexity matches: ${referenceLogic.expectedTimeComplexity}`
    );
  }
  if (comparison.algorithmMatch === 'FULL') {
    comparison.reasons.push('✓ Algorithm fully matches expected approach');
  }
  if (comparison.violatesDisallowedPatterns) {
    comparison.reasons.push('✗ Uses disallowed patterns or approaches');
  }

  return comparison;
}

/**
 * Helper: Creates safe default features (used when student features are invalid)
 * @returns {Object} - Safe default feature object
 */
function createSafeFeatureDefaults() {
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

/**
 * Gets hints for a question
 * @param {string} questionId - Question ID
 * @returns {Array<string>} - Array of hint strings
 */
function getHints(questionId) {
  const logic = getReferenceLogic(questionId);
  return logic && logic.hints ? logic.hints : [];
}

/**
 * Gets common mistakes for a question
 * @param {string} questionId - Question ID
 * @returns {Array<string>} - Array of common mistake descriptions
 */
function getCommonMistakes(questionId) {
  const logic = getReferenceLogic(questionId);
  return logic && logic.commonMistakes ? logic.commonMistakes : [];
}

/**
 * Gets solution approach description
 * @param {string} questionId - Question ID
 * @returns {string} - Approach description
 */
function getSolutionApproach(questionId) {
  const logic = getReferenceLogic(questionId);
  return logic && logic.solutionApproach
    ? logic.solutionApproach
    : 'No approach documented';
}

/**
 * Gets grading rubric
 * @param {string} questionId - Question ID
 * @returns {Object} - Rubric with criteria and weights
 */
function getGradingRubric(questionId) {
  const logic = getReferenceLogic(questionId);
  return logic && logic.rubric ? logic.rubric : {};
}

/**
 * Gets question metadata
 * @param {string} questionId - Question ID
 * @returns {Object|null} - Question metadata
 */
function getQuestionMetadata(questionId) {
  const logic = getReferenceLogic(questionId);
  if (!logic) return null;

  return {
    questionId: logic.questionId,
    title: logic.title || 'Untitled',
    difficulty: logic.difficulty || 'Unknown',
    description: logic.detailedDescription || 'No description',
    algorithm: logic.expectedAlgorithm,
    complexity: logic.expectedTimeComplexity,
    paradigm: logic.paradigm,
  };
}

module.exports = {
  getReferenceLogic,
  compareAgainstReference,
  getHints,
  getCommonMistakes,
  getSolutionApproach,
  getGradingRubric,
  getQuestionMetadata,
  preloadAllLogic,
  clearCache,
  getAllQuestionIds,
};
