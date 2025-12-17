// Parser Registry: deterministic AST parsers per language
// Prefer pure-JS or web-tree-sitter for portability and determinism

let esprima = null;
try {
  esprima = require('esprima');
} catch (e) {
  esprima = null;
}

let treeSitterAdapter = null;
try {
  treeSitterAdapter = require('./treeSitterAdapter');
} catch (e) {
  treeSitterAdapter = null;
}

function getParser(language) {
  const lang = String(language || '').toLowerCase();
  switch (lang) {
    case 'javascript':
    case 'js':
      if (!esprima) return null;
      return {
        astKind: 'estree',
        parse: (code) => esprima.parseScript(code, { range: true, tolerant: true }),
      };
    case 'python':
    case 'py':
      if (!treeSitterAdapter) return null;
      return {
        astKind: 'tree-sitter',
        parse: (code) => {
          const res = treeSitterAdapter.parseToAST(code, 'python');
          return res && res.ok ? res.ast : null;
        },
      };
    case 'cpp':
    case 'c++':
    case 'c':
      if (!treeSitterAdapter) return null;
      return {
        astKind: 'tree-sitter',
        parse: (code) => {
          const res = treeSitterAdapter.parseToAST(code, 'cpp');
          return res && res.ok ? res.ast : null;
        },
      };
    case 'java':
      if (!treeSitterAdapter) return null;
      return {
        astKind: 'tree-sitter',
        parse: (code) => {
          const res = treeSitterAdapter.parseToAST(code, 'java');
          return res && res.ok ? res.ast : null;
        },
      };
    default:
      return null;
  }
}

module.exports = {
  getParser,
};