// Python AST extractor (Tree-sitter normalized nodes)
const { createDefaultFeatures } = require('../core/featureVectorSchema');

function extractFromAST(ast, code) {
  const features = createDefaultFeatures();
  if (!ast) return features;

  const loopTypes = new Set(['for_statement', 'while_statement']);
  const conditionalTypes = new Set(['if_statement', 'elif_clause', 'else_clause']);

  function walk(node, fn) {
    if (!node || typeof node !== 'object') return;
    if (fn(node) === false) return;
    const children = node.children || [];
    for (const c of children) walk(c, fn);
  }

  function subtreeHasLoop(node) {
    let found = false;
    walk(node, (n) => {
      if (loopTypes.has(n.type)) { found = true; return false; }
      return true;
    });
    return found;
  }

  walk(ast, (node) => {
    if (loopTypes.has(node.type)) {
      features.loopCount++;
      if (node && node.children && node.children.length && subtreeHasLoop(node)) {
        features.nestedLoopCount++;
      }
    }
    if (conditionalTypes.has(node.type)) features.conditionalCount++;

    // Hash-like DS heuristics via code text
    if (node.text) {
      const t = node.text;
      if (/\bdict\s*\(|\bset\s*\(|\{\s*[^}]*:\s*[^}]*\}/.test(t)) features.usesHashMap = true;
      if (/\bdeque\s*\(|\bqueue\s*\(/.test(t)) features.useQueue = true;
      if (/\bstack\b|\.append\(|\.pop\(/.test(t)) features.usesStack = features.usesStack || /stack\b/.test(t);
      if (/\bdp\s*\[|\bmemo\b|\bcache\b/.test(t)) features.memoizationOrDP = true;
      if (/(?:\/\s*2|>>\s*1)/.test(t)) features.hasLogLoop = features.hasLogLoop || true;
    }
    return true;
  });

  // Recursive divide-and-conquer hint: halving anywhere combined with recursion detection (external)
  // We only set dividesInput here; recursionDetected remains to upstream detectors.
  features.dividesInput = !!features.hasLogLoop;

  features.lineCount = (code || '').split('\n').length;
  features.characterCount = (code || '').length;
  return features;
}

module.exports = { extractFromAST };
