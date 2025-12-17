/**
 * Logic Feature Extractor - Enhanced
 * Analyzes source code statically to extract algorithm features
 * Uses pattern matching and syntax analysis for AST-like feature extraction
 * Supports: Python, C++, Java, JavaScript
 *
 * LIMITATIONS:
 * - Uses regex pattern matching, NOT true AST parsing
 * - Cannot detect scope-dependent constructs accurately
 * - May produce false positives/negatives for complex code
 * - Cannot parse type systems or perform semantic analysis
 * - Complexity estimates are heuristic-based, not mathematically proven
 * - No control flow graph (CFG) or data dependency analysis
 *
 * DETERMINISTIC GUARANTEES:
 * - Always returns all required fields (never undefined)
 * - Consistent feature object structure across all languages
 * - Safe defaults for missing or unparseable code
 * - No external dependencies or network calls
 */

/**
 * Language-specific patterns for detecting various constructs
 */
// Feature flag for AST pipeline (default: enabled)
const AST_ENABLED = process.env.AST_ENABLED !== 'false';

// Prefer modular AST adapter (deterministic, rule-based)
// Can be disabled via AST_ENABLED=false environment variable for regression testing
let ASTAdapter = null;
if (AST_ENABLED) {
  try {
    ASTAdapter = require('../ast/core/extractorAdapter');
    console.info('[FeatureExtractor] AST pipeline enabled (set AST_ENABLED=false to disable)');
  } catch (e) {
    console.warn('[FeatureExtractor] AST adapter load failed, falling back to regex:', e.message);
    ASTAdapter = null;
  }
} else {
  console.info('[FeatureExtractor] AST pipeline DISABLED via AST_ENABLED=false (regex fallback mode)');
}
const PATTERNS = {
  python: {
    loops: {
      for: /\bfor\s+\w+\s+in\s+/g,
      while: /\bwhile\s+/g,
      forEach: /\bfor\s+\w+\s+in\s+(?:range|enumerate|zip)/g,
    },
    recursion: /def\s+(\w+)\([\s\S]*?\1\(/,
    sorting: /\.sort\(|sorted\(|heapq\.|bisect\./g,
    hashMap:
      /\{\s*\}|seen\s*=\s*\{|dict\(|set\(|defaultdict\(|Counter\(|\w+\s*=\s*\{\}/g,
    inputRead: /input\(|sys\.stdin|raw_input\(/g,
    printOutput: /print\(/g,
    constantValue: /return\s+["'\d[\]]+\s*$|print\s*\(\s*["'\d]+\s*\)/gm,
    nestedLoop: /for\s+\w+\s+in\s+[^:]+:[\s\S]*?for\s+\w+\s+in\s+/g,
    conditionals: /\bif\b|\belif\b|\belse\b/g,
    stackUsage: /stack\s*=|append|pop(?!\s*\()|deque/g,
    queueUsage: /queue|deque|\.popleft/g,
    graphTraversal: /dfs|bfs|graph\[|adjacency/gi,
    dynamicProgramming: /dp\[|memo|@lru_cache|@cache/g,
    twoPointers: /left|right|start|end|fast|slow/g,
  },
  cpp: {
    loops: {
      for: /\bfor\s*\(/g,
      while: /\bwhile\s*\(/g,
      forEach: /\bfor\s+\(\s*auto|for\s+\(\s*const/g,
    },
    recursion: /(\w+)\s*\([^)]*\)\s*\{[\s\S]*?\1\s*\(/,
    sorting:
      /\bsort\(|stable_sort\(|partial_sort\(|priority_queue|lower_bound\(|upper_bound\(/g,
    hashMap: /\b(unordered_)?map\s*<|unordered_set\s*<|set\s*</g,
    inputRead: /cin\s*>>|scanf\(|getline\(/g,
    printOutput: /cout\s*<<|printf\(/g,
    constantValue: /return\s+["'\d]+\s*;|cout\s*<<\s*["'\d]+/gm,
    nestedLoop: /for\s*\([^)]*\)\s*\{[^{}]*for\s*\(/g,
    conditionals: /\bif\b|\belse\b/g,
    stackUsage: /stack<|push|\.pop\(\)|\.top\(\)/g,
    queueUsage: /queue<|deque<|\.front\(\)|\.back\(\)/g,
    graphTraversal: /dfs|bfs|graph\[|adjacency|vector<vector/gi,
    dynamicProgramming: /dp\[|memo|cache/g,
    twoPointers: /left|right|start|end|fast|slow/g,
  },
  java: {
    loops: {
      for: /\bfor\s*\(/g,
      while: /\bwhile\s*\(/g,
      forEach: /\bfor\s*\(\s*\w+\s+\w+\s*:/g,
    },
    recursion: /(\w+)\s*\([^)]*\)\s*\{[\s\S]*?\1\s*\(/,
    sorting:
      /Arrays\.sort\(|Collections\.sort\(|PriorityQueue|TreeMap|TreeSet/g,
    hashMap: /HashMap|HashSet|LinkedHashMap|TreeMap|Hashtable/g,
    inputRead: /Scanner|BufferedReader|System\.in/g,
    printOutput: /System\.out\.print|System\.out\.println/g,
    constantValue: /return\s+["'\d]+\s*;|System\.out\.print.*["'\d]+/gm,
    nestedLoop: /for\s*\([^)]*\)\s*\{[^{}]*for\s*\(/g,
    conditionals: /\bif\b|\belse\b/g,
    stackUsage: /Stack<|push|pop|peek/g,
    queueUsage: /Queue<|LinkedList<|offer|poll|peek/g,
    graphTraversal: /dfs|bfs|graph\.get|adjacency/gi,
    dynamicProgramming: /dp\[|memo|cache/g,
    twoPointers: /left|right|start|end|fast|slow/g,
  },
  javascript: {
    loops: {
      for: /\bfor\s*\(/g,
      while: /\bwhile\s*\(/g,
      forEach: /\.forEach|\.map|\.filter|\.reduce/g,
    },
    recursion: /function\s+(\w+)\s*\([^)]*\)\s*\{(?:.*\n)*?\s*\1\s*\(/gm,
    sorting: /\.sort\(|Math\.max|Math\.min/g,
    hashMap: /\{[^}]*:[^}]*\}|new\s+Map\(|new\s+Set\(|new\s+Object\(/g,
    inputRead: /readline\(|prompt\(|process\.stdin/g,
    printOutput: /console\.log\(/g,
    constantValue:
      /return\s+["'\d[\]]+\s*[;}]|console\.log\s*\(\s*["'\d]+\s*\)/gm,
    nestedLoop: /\bfor\s*\([^)]*\)\s*\{[^}]*\bfor\s*\(/gm,
    conditionals: /\bif\b|\belse\b/g,
    stackUsage: /\.push\(|\.pop\(\)|stack|Stack/g,
    queueUsage: /\.shift\(|\.unshift\(|queue|Queue/g,
    graphTraversal: /dfs|bfs|graph\[|adjacency/gi,
    dynamicProgramming: /dp\[|memo|cache/g,
    twoPointers: /left|right|start|end|fast|slow/g,
  },
};

/**
 * Detects the programming language from code content
 * @param {string} language - Language identifier
 * @returns {string} - Normalized language key
 */
function normalizeLanguage(language) {
  const langMap = {
    python: 'python',
    python3: 'python',
    py: 'python',
    cpp: 'cpp',
    'c++': 'cpp',
    c: 'cpp',
    java: 'java',
    javascript: 'javascript',
    js: 'javascript',
    node: 'javascript',
  };

  return langMap[language?.toLowerCase()] || 'python';
}

/**
 * Counts loop occurrences in code
 * @param {string} code - Source code
 * @param {Object} patterns - Language-specific patterns
 * @returns {number} - Total loop count
 */
function countLoops(code, patterns) {
  let count = 0;

  if (patterns.loops.for) {
    const forMatches = code.match(patterns.loops.for);
    count += forMatches ? forMatches.length : 0;
  }

  if (patterns.loops.while) {
    const whileMatches = code.match(patterns.loops.while);
    count += whileMatches ? whileMatches.length : 0;
  }

  return count;
}

/**
 * Counts nested loops in code
 * @param {string} code - Source code
 * @param {Object} patterns - Language-specific patterns
 * @returns {number} - Nested loop count
 */
function countNestedLoops(code, patterns) {
  if (!patterns.nestedLoop) return 0;

  const matches = code.match(patterns.nestedLoop);
  return matches ? matches.length : 0;
}

/**
 * Detects recursion in code
 * @param {string} code - Source code
 * @param {Object} patterns - Language-specific patterns
 * @returns {boolean} - True if recursion detected
 */
function detectRecursion(code, patterns) {
  if (!patterns.recursion) return false;

  return patterns.recursion.test(code);
}

/**
 * Detects use of sorting operations
 * @param {string} code - Source code
 * @param {Object} patterns - Language-specific patterns
 * @returns {boolean} - True if sorting detected
 */
function detectSorting(code, patterns) {
  if (!patterns.sorting) return false;

  return patterns.sorting.test(code);
}

/**
 * Detects use of hash maps/sets
 * @param {string} code - Source code
 * @param {Object} patterns - Language-specific patterns
 * @returns {boolean} - True if hash map/set detected
 */
function detectHashMap(code, patterns) {
  if (!patterns.hashMap) return false;

  return patterns.hashMap.test(code);
}

/**
 * Detects if output is constant (hardcoded)
 * @param {string} code - Source code
 * @param {Object} patterns - Language-specific patterns
 * @returns {boolean} - True if constant output detected
 */
function detectConstantOutput(code, patterns) {
  if (!patterns.constantValue) return false;

  const hasConstantReturn = patterns.constantValue.test(code);
  const hasInputRead = patterns.inputRead
    ? patterns.inputRead.test(code)
    : false;

  // If code has constant output and no input reading, it's likely hardcoded
  return hasConstantReturn && !hasInputRead;
}

/**
 * Detects if logic depends on input
 * @param {string} code - Source code
 * @param {Object} patterns - Language-specific patterns
 * @returns {boolean} - True if input-dependent logic detected
 */
function detectInputDependentLogic(code, patterns) {
  if (!patterns.inputRead) return false;

  const hasInputRead = patterns.inputRead.test(code);
  const hasLoops = countLoops(code, patterns) > 0;
  const hasConditionals = /\bif\s+/.test(code);

  // Input-dependent if it reads input and has logic (loops/conditionals)
  return hasInputRead && (hasLoops || hasConditionals);
}

/**
 * Estimates time complexity based on code structure
 * @param {string} code - Source code
 * @param {Object} features - Extracted features
 * @returns {string} - Estimated time complexity
 */
function estimateTimeComplexity(code, features) {
  // Allowed outputs only
  const ALLOWED = new Set(['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(2ⁿ)']);

  // Helper to normalize to allowed set deterministically
  const normalize = (s) => {
    if (!s) return 'O(1)';
    let t = s.replace('^2', '²').replace('2^n', '2ⁿ').replace('n^2', 'n²');
    // Collapse higher polynomials to O(n²)
    if (/n\^\d+/.test(s) || /n\s*\*\s*n\s*\*\s*n/.test(code)) t = 'O(n²)';
    // Enforce allowed set
    return ALLOWED.has(t) ? t : 'O(1)';
  };

  // Recursion patterns
  if (features.recursionDetected) {
    const hasMemo = /memo|cache|dp\[|@lru_cache|@cache/.test(code);
    if (hasMemo) return normalize('O(n)');
    // Divide-and-conquer (halving or mid index usage)
    const divides = /(mid\s*=|\/\s*2|>>\s*1|half)/.test(code);
    if (divides) return normalize('O(log n)');
    return normalize('O(2^n)');
  }

  // Binary search indicators
  if (/binary|bisect/.test(code.toLowerCase()) && features.loopCount === 1) {
    return normalize('O(log n)');
  }

  // Sorting usage
  if (features.usesSorting) {
    return normalize('O(n log n)');
  }

  // Nested loops → clip to O(n²)
  if (features.nestedLoopCount >= 1) {
    return normalize('O(n^2)');
  }

  // Single loop
  if (features.loopCount >= 1) {
    return normalize('O(n)');
  }

  // Hash map/set operations only
  if (features.usesHashMap && features.loopCount === 0) {
    return normalize('O(1)');
  }

  // No loops, no recursion
  return normalize('O(1)');
}

/**
 * Detects hardcoding patterns
 * @param {string} code - Source code
 * @param {Object} patterns - Language-specific patterns
 * @returns {boolean} - True if hardcoding detected
 */
function detectHardcoding(code, patterns) {
  // Check for constant output
  if (detectConstantOutput(code, patterns)) {
    return true;
  }

  // Check for excessive hardcoded values
  const numberLiterals = code.match(/\b\d+\b/g) || [];
  const stringLiterals = code.match(/["'][^"']*["']/g) || [];

  // If there are many literals and minimal logic, likely hardcoded
  const totalLiterals = numberLiterals.length + stringLiterals.length;
  const hasLogic = countLoops(code, patterns) > 0 || /\bif\s+/.test(code);

  if (totalLiterals > 10 && !hasLogic) {
    return true;
  }

  // Check for array/list with many hardcoded values
  const hardcodedArrays = /\[[^\]]{100,}\]|\{[^}]{100,}\}/.test(code);
  if (hardcodedArrays) {
    return true;
  }

  return false;
}

/**
 * Detects use of stack data structure
 * @param {string} code - Source code
 * @param {Object} patterns - Language-specific patterns
 * @returns {boolean} - True if stack usage detected
 */
function detectStackUsage(code, patterns) {
  return patterns.stackUsage && patterns.stackUsage.test(code);
}

/**
 * Detects use of queue data structure
 * @param {string} code - Source code
 * @param {Object} patterns - Language-specific patterns
 * @returns {boolean} - True if queue usage detected
 */
function detectQueueUsage(code, patterns) {
  return patterns.queueUsage && patterns.queueUsage.test(code);
}

/**
 * Detects graph traversal algorithms
 * @param {string} code - Source code
 * @param {Object} patterns - Language-specific patterns
 * @returns {boolean} - True if graph traversal detected
 */
function detectGraphTraversal(code, patterns) {
  return patterns.graphTraversal && patterns.graphTraversal.test(code);
}

/**
 * Detects dynamic programming approach
 * @param {string} code - Source code
 * @param {Object} patterns - Language-specific patterns
 * @returns {boolean} - True if dynamic programming detected
 */
function detectDynamicProgramming(code, patterns) {
  return patterns.dynamicProgramming && patterns.dynamicProgramming.test(code);
}

/**
 * Detects two-pointer technique
 * @param {string} code - Source code
 * @param {Object} patterns - Language-specific patterns
 * @returns {boolean} - True if two-pointer pattern detected
 */
function detectTwoPointers(code, patterns) {
  // Two pointers usually involves loop with specific patterns
  const hasTwoPointerPattern =
    patterns.twoPointers && patterns.twoPointers.test(code);
  const hasSingleLoop = countLoops(code, patterns) === 1;
  return (
    hasTwoPointerPattern && hasSingleLoop && !code.match(/nested|for.*for/i)
  );
}

/**
 * Detects sliding window technique
 * @param {string} code - Source code
 * @returns {boolean} - True if sliding window pattern detected
 */
function detectSlidingWindow(code) {
  // Sliding window typically has pattern: move left/right pointers in single loop
  const hasWindowPattern = /(left|right|start|end|window|ptr)/.test(code);
  const hasSingleLoop = /for\s*\(|while\s*\(/.test(code);
  return hasWindowPattern && hasSingleLoop;
}

/**
 * Counts conditional statements
 * @param {string} code - Source code
 * @param {Object} patterns - Language-specific patterns
 * @returns {number} - Count of conditionals
 */
function countConditionals(code, patterns) {
  if (!patterns.conditionals) return 0;
  const matches = code.match(patterns.conditionals);
  return matches ? matches.length : 0;
}

/**
 * Detects array/list manipulation
 * @param {string} code - Source code
 * @returns {boolean} - True if array manipulation detected
 */
function detectArrayManipulation(code) {
  return /append|push|pop|insert|remove|splice|slice/.test(code);
}

/**
 * Analyzes space complexity heuristically
 * @param {Object} features - Extracted features
 * @returns {string} - Estimated space complexity
 */
function estimateSpaceComplexity(features) {
  // Allowed: O(1), O(log n), O(n)
  if (features.dynamicProgramming) return 'O(n)';
  if (features.usesHashMap) return 'O(n)';
  if (features.usesStack) return 'O(n)';
  // Optional: logarithmic auxiliary space (rare); keep deterministic O(1)
  return 'O(1)';
}

/**
 * Detects algorithmic paradigm
 * @param {Object} features - Extracted features
 * @returns {string} - Detected paradigm
 */
function detectParadigm(features) {
  if (features.dynamicProgramming) return 'Dynamic Programming';
  if (features.recursionDetected) return 'Recursion';
  if (features.graphTraversal) return 'Graph Traversal';
  if (features.usesStack) return 'Stack-based';
  if (features.useQueue) return 'Queue-based';
  if (features.usesSorting) return 'Sorting';
  if (features.usesHashMap) return 'Hash Map';
  if (features.twoPointers) return 'Two Pointers';
  if (features.slidingWindow) return 'Sliding Window';
  if (features.nestedLoopCount >= 2) return 'Brute Force';
  if (features.loopCount > 0) return 'Iterative';
  return 'Simple Logic';
}

/**
 * Main function: Extracts logic features from source code (ENHANCED)
 * @param {string} code - Source code to analyze
 * @param {string} language - Programming language (python, cpp, java, javascript)
 * @returns {Object} - Comprehensive extracted features
 *
 * GUARANTEED OUTPUT STRUCTURE (all fields always present):
 * {
 *   // Basic metrics (number >= 0)
 *   loopCount: number,
 *   nestedLoopCount: number,
 *   conditionalCount: number,
 *   recursionDetected: boolean,
 *
 *   // Data structure usage (boolean)
 *   usesSorting: boolean,
 *   usesHashMap: boolean,
 *   usesStack: boolean,
 *   useQueue: boolean,
 *   arrayManipulation: boolean,
 *
 *   // Algorithmic patterns (boolean)
 *   graphTraversal: boolean,
 *   dynamicProgramming: boolean,
 *   twoPointers: boolean,
 *   slidingWindow: boolean,
 *
 *   // Code quality indicators (boolean)
 *   constantOnlyOutput: boolean,
 *   inputDependentLogic: boolean,
 *   hardcodingDetected: boolean,
 *
 *   // Complexity analysis (string, never null)
 *   estimatedTimeComplexity: string,  // e.g., "O(n)", "O(1)", etc.
 *   estimatedSpaceComplexity: string, // e.g., "O(n)", "O(1)", etc.
 *
 *   // Paradigm detection (string, never null)
 *   paradigm: string,  // e.g., "Dynamic Programming", "Simple Logic", etc.
 *
 *   // Code length (number >= 0)
 *   lineCount: number,
 *   characterCount: number
 * }
 */
function extractLogicFeatures(code, language = 'python') {
  // Input validation with safe defaults
  if (!code || typeof code !== 'string') {
    console.warn(
      '[FeatureExtractor] Invalid code input, returning safe defaults'
    );
    return createSafeDefaultFeatures();
  }

  // Handle empty or whitespace-only code
  if (code.trim().length === 0) {
    console.warn('[FeatureExtractor] Empty code, returning safe defaults');
    return createSafeDefaultFeatures();
  }

  const lang = normalizeLanguage(language);
  const patterns = PATTERNS[lang];

  if (!patterns) {
    console.error(
      `[FeatureExtractor] Unsupported language: ${language}, using python patterns`
    );
    // Fallback to python patterns instead of throwing
    const fallbackPatterns = PATTERNS['python'];
    return extractFeaturesWithPatterns(code, fallbackPatterns, language);
  }

  // Prefer AST-based extraction for supported languages to preserve determinism
  if (ASTAdapter && typeof ASTAdapter.extractFeaturesAST === 'function') {
    const astFeatures = ASTAdapter.extractFeaturesAST(code, lang);
    if (astFeatures) {
      // Use deterministic AST-feature-only estimator for time complexity
      if (typeof ASTAdapter.estimateTimeComplexityAST === 'function') {
        astFeatures.estimatedTimeComplexity = safeString(
          () => ASTAdapter.estimateTimeComplexityAST(astFeatures),
          'O(1)'
        );
      } else {
        astFeatures.estimatedTimeComplexity = safeString(
          () => estimateTimeComplexity(code, astFeatures),
          'O(1)'
        );
      }
      if (typeof ASTAdapter.estimateSpaceComplexityAST === 'function') {
        astFeatures.estimatedSpaceComplexity = safeString(
          () => ASTAdapter.estimateSpaceComplexityAST(astFeatures),
          'O(1)'
        );
      } else {
        astFeatures.estimatedSpaceComplexity = safeString(
          () => estimateSpaceComplexity(astFeatures),
          'O(1)'
        );
      }
      astFeatures.paradigm = safeString(
        () => detectParadigm(astFeatures),
        'Simple Logic'
      );
      return validateFeatureObject(astFeatures);
    }
  }

  return extractFeaturesWithPatterns(code, patterns, lang);
}

/**
 * Helper: Extract features using given patterns (internal use)
 * @param {string} code - Source code
 * @param {Object} patterns - Language-specific patterns
 * @param {string} lang - Language identifier
 * @returns {Object} - Feature object
 */
function extractFeaturesWithPatterns(code, patterns, lang) {
  try {
    // Remove comments to avoid false positives
    let cleanedCode = code;
    if (lang === 'python') {
      cleanedCode = code
        .replace(/#.*$/gm, '')
        .replace(/"""[\s\S]*?"""/g, '')
        .replace(/'''[\s\S]*?'''/g, '');
    } else if (lang === 'cpp' || lang === 'java' || lang === 'javascript') {
      cleanedCode = code
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');
    }

    // Extract basic features (wrapped in try-catch for safety)
    const loopCount = safeCount(() => countLoops(cleanedCode, patterns), 0);
    const nestedLoopCount = safeCount(
      () => countNestedLoops(cleanedCode, patterns),
      0
    );
    const recursionDetected = safeBoolean(
      () => detectRecursion(cleanedCode, patterns),
      false
    );
    const usesSorting = safeBoolean(
      () => detectSorting(cleanedCode, patterns),
      false
    );
    const usesHashMap = safeBoolean(
      () => detectHashMap(cleanedCode, patterns),
      false
    );
    const constantOnlyOutput = safeBoolean(
      () => detectConstantOutput(cleanedCode, patterns),
      false
    );
    const inputDependentLogic = safeBoolean(
      () => detectInputDependentLogic(cleanedCode, patterns),
      false
    );
    const hardcodingDetected = safeBoolean(
      () => detectHardcoding(cleanedCode, patterns),
      false
    );

    // Extract advanced features
    const usesStack = safeBoolean(
      () => detectStackUsage(cleanedCode, patterns),
      false
    );
    const useQueue = safeBoolean(
      () => detectQueueUsage(cleanedCode, patterns),
      false
    );
    const graphTraversal = safeBoolean(
      () => detectGraphTraversal(cleanedCode, patterns),
      false
    );
    const dynamicProgramming = safeBoolean(
      () => detectDynamicProgramming(cleanedCode, patterns),
      false
    );
    const twoPointers = safeBoolean(
      () => detectTwoPointers(cleanedCode, patterns),
      false
    );
    const slidingWindow = safeBoolean(
      () => detectSlidingWindow(cleanedCode),
      false
    );
    const conditionalCount = safeCount(
      () => countConditionals(cleanedCode, patterns),
      0
    );
    const arrayManipulation = safeBoolean(
      () => detectArrayManipulation(cleanedCode),
      false
    );

    const features = {
      // Basic metrics
      loopCount,
      nestedLoopCount,
      conditionalCount,
      recursionDetected,

      // Data structure usage
      usesSorting,
      usesHashMap,
      usesStack,
      useQueue,
      arrayManipulation,

      // Algorithmic patterns
      graphTraversal,
      dynamicProgramming,
      twoPointers,
      slidingWindow,

      // Code quality indicators
      constantOnlyOutput,
      inputDependentLogic,
      hardcodingDetected,

      // Complexity analysis (will be set below)
      estimatedTimeComplexity: 'O(1)',
      estimatedSpaceComplexity: 'O(1)',

      // Paradigm detection (will be set below)
      paradigm: 'Simple Logic',

      // Code length
      lineCount: code.split('\n').length,
      characterCount: code.length,
    };

    // Estimate complexities based on extracted features
    features.estimatedTimeComplexity = safeString(
      () => estimateTimeComplexity(cleanedCode, features),
      'O(1)'
    );
    features.estimatedSpaceComplexity = safeString(
      () => estimateSpaceComplexity(features),
      'O(1)'
    );
    features.paradigm = safeString(
      () => detectParadigm(features),
      'Simple Logic'
    );

    // Final validation: ensure all required fields are present
    return validateFeatureObject(features);
  } catch (error) {
    console.error('[FeatureExtractor] Error during extraction:', error.message);
    return createSafeDefaultFeatures();
  }
}

/**
 * AST-based feature extraction for JavaScript using Tree-sitter
 * Deterministic traversal; preserves existing feature vector shape
 * @param {string} code
 * @returns {Object|null}
 */
function extractFeaturesWithAST_JS(code) {
  try {
    const ast = Esprima.parseScript(code, { range: true, tolerant: true });
    const loopTypes = new Set([
      'ForStatement',
      'WhileStatement',
      'DoWhileStatement',
      'ForInStatement',
      'ForOfStatement',
    ]);
    const conditionalTypes = new Set(['IfStatement']);

    let loopCount = 0;
    let conditionalCount = 0;
    let nestedLoopCount = 0;
    let usesSorting = false;
    let usesHashMap = false;
    let usesStack = false;
    let useQueue = false;
    let arrayManipulation = false;
    let recursionDetected = false;
    let graphTraversal = false;
    let dynamicProgramming = false;
    let twoPointers = false;
    let slidingWindow = false;
    let constantOnlyOutput = false;
    let inputDependentLogic = false;
    let hardcodingDetected = false;

    const identifiers = new Set();
    const functions = [];
    const callsByFunction = new Map(); // name -> set of called identifiers

    function walk(node, fn) {
      if (!node || typeof node !== 'object') return;
      if (fn(node) === false) return;
      for (const key of Object.keys(node)) {
        const child = node[key];
        if (Array.isArray(child)) {
          child.forEach((c) => walk(c, fn));
        } else if (child && typeof child.type === 'string') {
          walk(child, fn);
        }
      }
    }

    function subtreeHasLoop(node) {
      let found = false;
      walk(node, (n) => {
        if (loopTypes.has(n.type)) {
          found = true;
          return false;
        }
        return true;
      });
      return found;
    }

    // Collect identifiers and structural counts
    walk(ast, (node) => {
      // Count loops
      if (loopTypes.has(node.type)) {
        loopCount++;
        // nested if this loop contains another loop
        const body = node.body || node.left || node.right || node;
        if (body && subtreeHasLoop(body)) nestedLoopCount++;
      }

      // Conditionals
      if (conditionalTypes.has(node.type)) {
        conditionalCount++;
      }

      // Identifiers
      if (node.type === 'Identifier') {
        identifiers.add(node.name);
      }

      // Function declarations
      if (node.type === 'FunctionDeclaration') {
        const name = node.id && node.id.name ? node.id.name : null;
        if (name) {
          functions.push({ name, node });
          callsByFunction.set(name, new Set());
        }
      }

      // Calls and member expressions
      if (node.type === 'CallExpression') {
        // Build a string for heuristic checks
        let funcText = '';
        if (node.callee.type === 'MemberExpression') {
          const obj = node.callee.object.type === 'Identifier' ? node.callee.object.name : '';
          const prop = node.callee.property.type === 'Identifier' ? node.callee.property.name : '';
          funcText = `${obj}.${prop}(`;
        } else if (node.callee.type === 'Identifier') {
          funcText = `${node.callee.name}(`;
        }
        // Sorting: arr.sort(...)
        if (/\.sort\s*\(/.test(funcText)) {
          usesSorting = true;
        }
        // Math.max/min are common in greedy patterns; keep consistent with previous heuristics
        if (/\bMath\.(max|min)\s*\(/.test(funcText)) {
          usesSorting = usesSorting || true; // maintain prior heuristic
        }

        // Record function calls for recursion detection
        if (node.callee.type === 'Identifier') {
          const calledName = node.callee.name;
          const parentFunc = functions[functions.length - 1];
          if (parentFunc) callsByFunction.get(parentFunc.name)?.add(calledName);
        }

        // Input reading: readline, prompt, process.stdin
        if (/\breadline\s*\(|\bprompt\s*\(|process\.stdin/.test(funcText)) {
          inputDependentLogic = true; // will refine with loops/conditionals later
        }

        // Print output: console.log
        if (/console\.log\s*\(/.test(funcText)) {
          // Constant-only output if sole argument is a literal
          const args = node.arguments || [];
          if (args.length === 1 && args[0].type === 'Literal') {
            if (typeof args[0].value === 'string' || typeof args[0].value === 'number') {
              constantOnlyOutput = true;
            }
          }
        }

        // Stack/Queue and array manipulation via methods
        if (/\.(push|pop|splice|slice|insert|remove)\s*\(/.test(funcText)) {
          arrayManipulation = true;
          if (/\.push\s*\(|\.pop\s*\(/.test(funcText)) usesStack = true;
          if (/\.shift\s*\(|\.unshift\s*\(/.test(funcText)) useQueue = true;
        }
      }

      // New expressions (Map/Set)
      if (node.type === 'NewExpression') {
        const ctor = node.callee;
        const name = ctor && ctor.type === 'Identifier' ? ctor.name : '';
        if (name === 'Map' || name === 'Set') usesHashMap = true;
      }

      return true;
    });

    // Recursion detection: function calls to same name
    for (const fn of functions) {
      const called = callsByFunction.get(fn.name) || new Set();
      if (called.has(fn.name)) {
        recursionDetected = true;
        break;
      }
    }

    // Refine input-dependent logic: require input reads and some logic
    if (inputDependentLogic) {
      inputDependentLogic = loopCount > 0 || conditionalCount > 0;
    }

    // Two pointers & sliding window via identifiers in single loop
    const identsLower = [...identifiers].map((s) => s.toLowerCase());
    const hasTwoPointerNames = ['left', 'right', 'start', 'end', 'fast', 'slow'].some((k) => identsLower.includes(k));
    twoPointers = hasTwoPointerNames && loopCount === 1;
    slidingWindow = (identsLower.includes('window') || hasTwoPointerNames) && loopCount >= 1;

    // Dynamic Programming via identifier 'dp'
    dynamicProgramming = identsLower.includes('dp');

    // Graph traversal via identifiers
    graphTraversal = identsLower.some((id) => /^(dfs|bfs|adjacency|graph)$/.test(id));

    // Hardcoding heuristic: many literals without logic (use original regex thresholds via AST approximations)
    // Count literals
    let numberLiteralCount = 0;
    let stringLiteralCount = 0;
    walk(ast, (node) => {
      if (node.type === 'Literal') {
        if (typeof node.value === 'number') numberLiteralCount++;
        if (typeof node.value === 'string') stringLiteralCount++;
      }
      return true;
    });
    const totalLiterals = numberLiteralCount + stringLiteralCount;
    const hasLogic = loopCount > 0 || conditionalCount > 0;
    hardcodingDetected = totalLiterals > 10 && !hasLogic ? true : hardcodingDetected;

    const features = {
      loopCount,
      nestedLoopCount,
      conditionalCount,
      recursionDetected,
      usesSorting,
      usesHashMap,
      usesStack,
      useQueue,
      arrayManipulation,
      graphTraversal,
      dynamicProgramming,
      twoPointers,
      slidingWindow,
      constantOnlyOutput,
      inputDependentLogic,
      hardcodingDetected,
      estimatedTimeComplexity: 'O(1)',
      estimatedSpaceComplexity: 'O(1)',
      paradigm: 'Simple Logic',
      lineCount: code.split('\n').length,
      characterCount: code.length,
    };

    // Use existing deterministic estimators
    features.estimatedTimeComplexity = safeString(
      () => estimateTimeComplexity(code, features),
      'O(1)'
    );
    features.estimatedSpaceComplexity = safeString(
      () => estimateSpaceComplexity(features),
      'O(1)'
    );
    features.paradigm = safeString(() => detectParadigm(features), 'Simple Logic');

    return validateFeatureObject(features);
  } catch (err) {
    console.warn('[FeatureExtractor] AST parse failed, falling back to regex:', err.message);
    return null;
  }
}

/**
 * Creates a safe default feature object (all fields present with safe values)
 * @returns {Object} - Safe default features
 */
function createSafeDefaultFeatures() {
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
 * Validates feature object has all required fields
 * @param {Object} features - Feature object to validate
 * @returns {Object} - Validated feature object with guaranteed fields
 */
function validateFeatureObject(features) {
  const defaults = createSafeDefaultFeatures();

  // Ensure every field from defaults exists in features
  for (const key in defaults) {
    if (features[key] === undefined || features[key] === null) {
      console.warn(
        `[FeatureExtractor] Missing field '${key}', using default: ${defaults[key]}`
      );
      features[key] = defaults[key];
    }
  }

  return features;
}

/**
 * Safe wrapper for count operations (returns default on error)
 * @param {Function} fn - Function to execute
 * @param {number} defaultValue - Default value if error
 * @returns {number} - Count or default
 */
function safeCount(fn, defaultValue) {
  try {
    const result = fn();
    return typeof result === 'number' && result >= 0 ? result : defaultValue;
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Safe wrapper for boolean operations (returns default on error)
 * @param {Function} fn - Function to execute
 * @param {boolean} defaultValue - Default value if error
 * @returns {boolean} - Boolean or default
 */
function safeBoolean(fn, defaultValue) {
  try {
    const result = fn();
    return typeof result === 'boolean' ? result : defaultValue;
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Safe wrapper for string operations (returns default on error)
 * @param {Function} fn - Function to execute
 * @param {string} defaultValue - Default value if error
 * @returns {string} - String or default
 */
function safeString(fn, defaultValue) {
  try {
    const result = fn();
    return typeof result === 'string' && result.length > 0
      ? result
      : defaultValue;
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Validates extracted features against reference logic
 * @param {Object} features - Extracted features from user code
 * @param {Object} referenceLogic - Reference logic from instructor
 * @returns {Object} - Validation result with feedback
 */
function validateAgainstReference(features, referenceLogic) {
  const issues = [];
  const warnings = [];
  const suggestions = [];

  // Check time complexity
  if (referenceLogic.expectedTimeComplexity) {
    if (
      features.estimatedTimeComplexity !== referenceLogic.expectedTimeComplexity
    ) {
      warnings.push(
        `Time complexity mismatch: Expected ${referenceLogic.expectedTimeComplexity}, ` +
          `but detected ${features.estimatedTimeComplexity}`
      );
    }
  }

  // Check for disallowed patterns
  if (referenceLogic.disallowedPatterns) {
    if (
      referenceLogic.disallowedPatterns.includes('hardcoding') &&
      features.hardcodingDetected
    ) {
      issues.push('Hardcoding detected - solution should work for any input');
    }

    if (
      referenceLogic.disallowedPatterns.includes('nested_loops') &&
      features.nestedLoopCount > 0
    ) {
      issues.push(
        'Nested loops detected - try to optimize for better time complexity'
      );
    }

    if (
      referenceLogic.disallowedPatterns.includes('brute_force') &&
      features.nestedLoopCount >= 2
    ) {
      issues.push(
        'Brute force approach detected - consider a more efficient algorithm'
      );
    }
  }

  // Provide suggestions
  if (referenceLogic.expectedAlgorithm) {
    if (
      referenceLogic.expectedAlgorithm.toLowerCase().includes('hash') &&
      !features.usesHashMap
    ) {
      suggestions.push('Consider using a hash map/set for better performance');
    }

    if (
      referenceLogic.expectedAlgorithm.toLowerCase().includes('sort') &&
      !features.usesSorting
    ) {
      suggestions.push('Consider sorting the input as part of the solution');
    }
  }

  // Check if input-dependent logic exists
  if (!features.inputDependentLogic && !features.constantOnlyOutput) {
    warnings.push('Code may not properly read or process input');
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings,
    suggestions,
    features,
  };
}

module.exports = {
  extractLogicFeatures,
  validateAgainstReference,
  normalizeLanguage,
  createSafeDefaultFeatures, // Export for testing/debugging
  // Minimal, deterministic core vector for external callers
  extractCoreFeatureVector: (code, language) => {
    const f = extractLogicFeatures(code, language);
    return {
      loopCount: f.loopCount,
      nestedLoopCount: f.nestedLoopCount,
      recursionDetected: f.recursionDetected,
      usesHashMap: f.usesHashMap,
      usesSorting: f.usesSorting,
      paradigm: f.paradigm,
      estimatedTimeComplexity: f.estimatedTimeComplexity,
      estimatedSpaceComplexity: f.estimatedSpaceComplexity,
    };
  },
};
