// Tree-sitter adapter: deterministic AST parsing with safe fallbacks
// Requirements: tree-sitter core and language grammars installed (e.g., tree-sitter-javascript, tree-sitter-python, tree-sitter-cpp, tree-sitter-java)
// If a grammar or parser is unavailable, this module returns a safe fallback instead of throwing.

let TreeSitter = null;
try {
  TreeSitter = require('tree-sitter');
} catch (err) {
  TreeSitter = null;
}

const grammarLoaders = {
  javascript: safeRequire('tree-sitter-javascript'),
  js: safeRequire('tree-sitter-javascript'),
  node: safeRequire('tree-sitter-javascript'),
  python: safeRequire('tree-sitter-python'),
  py: safeRequire('tree-sitter-python'),
  python3: safeRequire('tree-sitter-python'),
  cpp: safeRequire('tree-sitter-cpp'),
  'c++': safeRequire('tree-sitter-cpp'),
  c: safeRequire('tree-sitter-cpp'),
  java: safeRequire('tree-sitter-java'),
};

function safeRequire(name) {
  try {
    // eslint-disable-next-line global-require
    return require(name);
  } catch (err) {
    return null;
  }
}

function normalizeLanguage(language) {
  const key = String(language || '').toLowerCase();
  if (grammarLoaders[key]) return key;
  // default to javascript for safety
  return 'javascript';
}

function normalizeNode(node, code) {
  return {
    type: node.type,
    startIndex: node.startIndex,
    endIndex: node.endIndex,
    hasError: node.hasError?.() || false,
    text: typeof code === 'string' && Number.isFinite(node.startIndex) && Number.isFinite(node.endIndex)
      ? code.slice(node.startIndex, node.endIndex)
      : undefined,
    children: node.namedChildren.map((c) => normalizeNode(c, code)),
  };
}

function parseToAST(code, language) {
  if (typeof code !== 'string') {
    return {
      ok: false,
      error: 'Code must be a string',
      ast: null,
    };
  }

  if (!TreeSitter) {
    return {
      ok: false,
      error: 'tree-sitter core is not installed',
      ast: null,
    };
  }

  const langKey = normalizeLanguage(language);
  const grammar = grammarLoaders[langKey];

  if (!grammar) {
    return {
      ok: false,
      error: `No grammar available for language: ${langKey}`,
      ast: null,
    };
  }

  try {
    const parser = new TreeSitter();
    parser.setLanguage(grammar);
    const source = code || '';
    const tree = parser.parse(source);
    const ast = normalizeNode(tree.rootNode, source);
    return {
      ok: true,
      error: null,
      ast,
    };
  } catch (err) {
    return {
      ok: false,
      error: err.message || 'Tree-sitter parse failed',
      ast: null,
    };
  }
}

module.exports = {
  parseToAST,
  normalizeLanguage,
};
