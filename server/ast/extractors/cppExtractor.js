// C/C++ AST extractor (Tree-sitter normalized nodes)
const { createDefaultFeatures } = require('../core/featureVectorSchema');

function extractFromAST(ast, code) {
  const features = createDefaultFeatures();
  if (!ast) return features;

  const loopTypes = new Set(['for_statement', 'while_statement', 'do_statement', 'range_based_for_statement']);
  const conditionalTypes = new Set(['if_statement']);

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

    if (node.text) {
      const t = node.text;
      if (/(unordered_)?map\s*<|unordered_set\s*<|\bset\s*</.test(t)) features.usesHashMap = true;
      if (/\bstack\s*<|\.push\(|\.pop\(/.test(t)) features.usesStack = true;
      if (/\bqueue\s*<|\bdeque\s*<|\.push_back\(|\.pop_front\(/.test(t)) features.useQueue = true;
      if (/\bdp\s*\[|\bmemo\b|\bcache\b/.test(t)) features.memoizationOrDP = true;
      if (/(?:\/\s*2|>>\s*1)/.test(t)) features.hasLogLoop = features.hasLogLoop || true;
    }
    return true;
  });

  features.dividesInput = !!features.hasLogLoop;
  features.lineCount = (code || '').split('\n').length;
  features.characterCount = (code || '').length;
  return features;
}

module.exports = { extractFromAST };
