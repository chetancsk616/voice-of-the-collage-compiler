// AST Extractor Adapter
// Provides a unified interface that returns the same feature vector shape

const { getParser } = require('./parserRegistry');
const { createDefaultFeatures, validateFeatures } = require('./featureVectorSchema');
const { estimateTimeComplexityAST, estimateSpaceComplexityAST } = require('./complexityEstimator');

function normalizeLanguage(language) {
  const map = { javascript: 'javascript', js: 'javascript', node: 'javascript', python: 'python', py: 'python', python3: 'python', cpp: 'cpp', 'c++': 'cpp', c: 'cpp', java: 'java' };
  const key = String(language || '').toLowerCase();
  return map[key] || 'python';
}

function extractFeaturesAST(code, language) {
  if (typeof code !== 'string' || !code.trim()) return createDefaultFeatures();

  const lang = normalizeLanguage(language);
  const parser = getParser(lang);
  if (!parser) return createDefaultFeatures();

  try {
    const ast = parser.parse(code);
    let features = createDefaultFeatures();

    // Dispatch to language-specific extractor
    switch (lang) {
      case 'javascript': {
        const js = require('../extractors/javascriptExtractor');
        features = js.extractFromAST(ast, code);
        break;
      }
      case 'python': {
        const py = require('../extractors/pythonExtractor');
        features = py.extractFromAST(ast, code);
        break;
      }
      case 'java': {
        const j = require('../extractors/javaExtractor');
        features = j.extractFromAST(ast, code);
        break;
      }
      case 'cpp':
      case 'c++':
      case 'c': {
        const cc = require('../extractors/cppExtractor');
        features = cc.extractFromAST(ast, code);
        break;
      }
      default:
        features = createDefaultFeatures();
    }

    return validateFeatures(features);
  } catch (err) {
    return createDefaultFeatures();
  }
}

module.exports = {
  extractFeaturesAST,
  normalizeLanguage,
  estimateTimeComplexityAST,
  estimateSpaceComplexityAST,
};