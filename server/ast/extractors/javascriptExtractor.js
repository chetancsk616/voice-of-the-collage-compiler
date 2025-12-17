// JavaScript AST extractor (Esprima ESTree)
const { createDefaultFeatures } = require('../core/featureVectorSchema');

function extractFromAST(ast, code) {
  const features = createDefaultFeatures();

  function walk(node, fn) {
    if (!node || typeof node !== 'object') return;
    if (fn(node) === false) return;
    for (const key of Object.keys(node)) {
      const child = node[key];
      if (Array.isArray(child)) child.forEach((c) => walk(c, fn));
      else if (child && typeof child.type === 'string') walk(child, fn);
    }
  }

  const loopTypes = new Set(['ForStatement', 'WhileStatement', 'DoWhileStatement', 'ForInStatement', 'ForOfStatement']);
  const conditionalTypes = new Set(['IfStatement']);
  const identifiers = new Set();
  const functions = [];
  const callsByFunction = new Map();
  let hasLogLoop = false;

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

  walk(ast, (node) => {
    if (node.type === 'FunctionDeclaration') {
      const name = node.id && node.id.name ? node.id.name : null;
      if (name) {
        functions.push({ name, node });
        callsByFunction.set(name, new Set());
      }
    }
    if (loopTypes.has(node.type)) {
      features.loopCount++;
      const body = node.body || node.left || node.right || node;
      if (body && subtreeHasLoop(body)) features.nestedLoopCount++;

      // Detect logarithmic loop behavior: halving via division by 2 or bit shift
      // Heuristic: look for assignment where RHS involves '/ 2' or '>> 1'
      // Keeps determinism and avoids reliance on identifier names
      const checkHalving = (n) => {
        let found = false;
        walk(n, (m) => {
          // Any BinaryExpression halving indicates logarithmic reduction
          if (m.type === 'BinaryExpression') {
            if ((m.operator === '/' && m.right && m.right.type === 'Literal' && m.right.value === 2)) {
              found = true; return false;
            }
            if ((m.operator === '>>' && m.right && m.right.type === 'Literal' && m.right.value === 1)) {
              found = true; return false;
            }
          }
          return true;
        });
        return found;
      };

      if (checkHalving(body)) hasLogLoop = true;
    }
    if (conditionalTypes.has(node.type)) features.conditionalCount++;

    if (node.type === 'Identifier') identifiers.add(node.name);

    if (node.type === 'CallExpression') {
      let funcText = '';
      if (node.callee.type === 'MemberExpression') {
        const obj = node.callee.object.type === 'Identifier' ? node.callee.object.name : '';
        const prop = node.callee.property.type === 'Identifier' ? node.callee.property.name : '';
        funcText = `${obj}.${prop}(`;
      } else if (node.callee.type === 'Identifier') {
        funcText = `${node.callee.name}(`;
      }
      if (/\.sort\s*\(/.test(funcText)) features.usesSorting = true;
      if (/\bMath\.(max|min)\s*\(/.test(funcText)) features.usesSorting = features.usesSorting || true;

      if (/\breadline\s*\(|\bprompt\s*\(|process\.stdin/.test(funcText)) {
        // refined later with logic presence
        features.inputDependentLogic = true;
      }

      if (/console\.log\s*\(/.test(funcText)) {
        const args = node.arguments || [];
        if (args.length === 1 && args[0].type === 'Literal') {
          if (typeof args[0].value === 'string' || typeof args[0].value === 'number') {
            features.constantOnlyOutput = true;
          }
        }
      }

      if (/\.(push|pop|splice|slice|insert|remove)\s*\(/.test(funcText)) {
        features.arrayManipulation = true;
        if (/\.push\s*\(|\.pop\s*\(/.test(funcText)) features.usesStack = true;
        if (/\.shift\s*\(|\.unshift\s*\(/.test(funcText)) features.useQueue = true;
      }
      // Record function calls for recursion detection
      if (node.callee.type === 'Identifier') {
        const calledName = node.callee.name;
        const currentFn = functions[functions.length - 1];
        if (currentFn) callsByFunction.get(currentFn.name)?.add(calledName);
      }
    }

    if (node.type === 'NewExpression') {
      const name = node.callee && node.callee.type === 'Identifier' ? node.callee.name : '';
      if (name === 'Map' || name === 'Set') features.usesHashMap = true;
    }
  });

  // Direct recursion detection
  for (const fn of functions) {
    const called = callsByFunction.get(fn.name) || new Set();
    if (called.has(fn.name)) {
      features.recursionDetected = true;
      break;
    }
  }

  // Expose extended AST features used by the AST complexity estimator
  features.hasLogLoop = hasLogLoop;
  if (features.recursionDetected) {
    let halving = false;
    walk(ast, (m) => {
      if (m.type === 'BinaryExpression') {
        if ((m.operator === '/' && m.right && m.right.type === 'Literal' && m.right.value === 2)) { halving = true; return false; }
        if ((m.operator === '>>' && m.right && m.right.type === 'Literal' && m.right.value === 1)) { halving = true; return false; }
      }
      return true;
    });
    features.dividesInput = halving;
  }

  // Refine input-dependent logic
  if (features.inputDependentLogic) {
    features.inputDependentLogic = features.loopCount > 0 || features.conditionalCount > 0;
  }

  const identsLower = [...identifiers].map((s) => s.toLowerCase());
  const twoNames = ['left', 'right', 'start', 'end', 'fast', 'slow'];
  const hasTwoPointerNames = twoNames.some((k) => identsLower.includes(k));
  features.twoPointers = hasTwoPointerNames && features.loopCount === 1;
  features.slidingWindow = (identsLower.includes('window') || hasTwoPointerNames) && features.loopCount >= 1;
  features.dynamicProgramming = identsLower.includes('dp');
  features.memoizationOrDP = features.dynamicProgramming || identsLower.includes('memo') || identsLower.includes('cache');
  features.graphTraversal = identsLower.some((id) => /^(dfs|bfs|adjacency|graph)$/.test(id));

  // Hardcoding heuristic
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
  const hasLogic = features.loopCount > 0 || features.conditionalCount > 0;
  if (totalLiterals > 10 && !hasLogic) features.hardcodingDetected = true;

  // Complexity & paradigm are determined upstream by existing estimators; keep defaults here
  features.lineCount = code.split('\n').length;
  features.characterCount = code.length;

  return features;
}

module.exports = {
  extractFromAST,
};