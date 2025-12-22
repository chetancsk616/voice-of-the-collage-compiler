// Unified AST Parser wrapper
// Deterministic: returns { kind, ast, language }

const { getParser } = require('./core/parserRegistry');

function normalizeLanguage(language) {
  const map = { javascript: 'javascript', js: 'javascript', node: 'javascript', python: 'python', py: 'python', python3: 'python', cpp: 'cpp', 'c++': 'cpp', c: 'cpp', java: 'java' };
  const key = String(language || '').toLowerCase();
  return map[key] || 'python';
}

function parse(code, language) {
  const lang = normalizeLanguage(language);
  const parser = getParser(lang);
  if (!parser) {
    return { ok: false, kind: null, ast: null, language: lang, error: `No parser for ${lang}` };
  }
  try {
    const ast = parser.parse(code || '');
    return { ok: Boolean(ast), kind: parser.astKind || 'unknown', ast: ast || null, language: lang, error: ast ? null : 'Parse returned null' };
  } catch (err) {
    return { ok: false, kind: parser.astKind || 'unknown', ast: null, language: lang, error: err?.message || 'Parse failed' };
  }
}

module.exports = { parse, normalizeLanguage };
