/**
 * Extracts the first code block from markdown text that may contain multiple code blocks.
 * Handles both fenced code blocks with and without language identifiers.
 *
 * @param {string} text - The markdown text containing code blocks
 * @returns {object|null} - { code: string, language: string|null } or null if no code block found
 *
 * @example
 * const result = extractFirstCodeBlock("Here's some code:\n```python\nprint('hello')\n```\nAnd more:\n```js\nconsole.log('hi')\n```")
 * // Returns: { code: "print('hello')", language: "python" }
 */
function extractFirstCodeBlock(text) {
  if (!text || typeof text !== 'string') {
    return null;
  }

  // Match first code block with optional language identifier
  // Pattern: ``` or ```language followed by code, then closing ```
  // Uses non-greedy match and handles newlines properly
  const codeBlockRegex = /```(\w+)?\s*\n([\s\S]*?)\n```/;

  const match = text.match(codeBlockRegex);

  if (!match) {
    return null;
  }

  const language = match[1] || null; // Language identifier (e.g., "python", "javascript", "js")
  const code = match[2] || ''; // The actual code content

  return {
    code: code.trim(),
    language,
  };
}

/**
 * Extracts all code blocks from markdown text.
 *
 * @param {string} text - The markdown text containing code blocks
 * @returns {Array<object>} - Array of { code: string, language: string|null }
 *
 * @example
 * const results = extractAllCodeBlocks("```python\nprint('hello')\n```\nText\n```js\nconsole.log('hi')\n```")
 * // Returns: [{ code: "print('hello')", language: "python" }, { code: "console.log('hi')", language: "js" }]
 */
function extractAllCodeBlocks(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const codeBlockRegex = /```(\w+)?\s*\n([\s\S]*?)\n```/g;
  const blocks = [];
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    blocks.push({
      code: (match[2] || '').trim(),
      language: match[1] || null,
    });
  }

  return blocks;
}

/**
 * Extracts the first code block and returns just the code string.
 * Convenience wrapper for extractFirstCodeBlock.
 *
 * @param {string} text - The markdown text containing code blocks
 * @returns {string|null} - The code content or null if no code block found
 */
function extractFirstCode(text) {
  const result = extractFirstCodeBlock(text);
  return result ? result.code : null;
}

module.exports = {
  extractFirstCodeBlock,
  extractAllCodeBlocks,
  extractFirstCode,
};
