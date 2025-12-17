const axios = require('axios');
require('dotenv').config();
const {
  extractFirstCodeBlock,
  extractAllCodeBlocks,
} = require('../utils/extractCodeBlock');

const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions';

const TIMEOUT_MS = 15_000;
const MAX_RETRIES = 3;

function truncate(str, maxBytes) {
  if (!str) return '';
  // maxBytes refers to characters here; for most ASCII it'll be close to bytes
  if (str.length <= maxBytes) return str;
  return str.slice(0, maxBytes) + '\n...[truncated]';
}

/**
 * askGroq(prompt, code?, stderr?, language?, model?)
 * Returns: { text, model, tokensUsed? } or { error }
 */
async function askGroq(
  prompt,
  code = '',
  stderr = '',
  language = '',
  model = 'llama-3.1-8b-instant'
) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return { error: 'Missing API key' };

  // truncate context sizes
  const codeCtx = truncate(code, 8 * 1024); // ~8KB
  const stderrCtx = truncate(stderr, 2 * 1024); // ~2KB

  const systemMessage = {
    role: 'system',
    content:
      'You are an AI code assistant helping the user debug or improve code.',
  };

  let userContent = prompt || '';
  userContent += '\n\n---\nContext:\n';
  if (language) userContent += `Language: ${language}\n`;
  if (codeCtx) {
    userContent += `Code (first ${codeCtx.length} chars):\n${codeCtx}\n`;
  }
  if (stderrCtx) {
    userContent += `Stderr (first ${stderrCtx.length} chars):\n${stderrCtx}\n`;
  }
  userContent += '---\n';

  const body = {
    model: model || 'llama-3.1-8b-instant',
    messages: [systemMessage, { role: 'user', content: userContent }],
    // a reasonable limit; callers can tune if needed
    max_tokens: 1024,
  };

  let attempt = 0;
  let lastErr = null;
  const promptSize = userContent.length;

  while (attempt < MAX_RETRIES) {
    attempt += 1;
    const start = Date.now();
    try {
      const res = await axios.post(GROQ_API, body, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: TIMEOUT_MS,
      });

      const duration = Date.now() - start;
      const data = res.data || {};

      // extract text from choices
      let text = '';
      if (Array.isArray(data.choices) && data.choices.length > 0) {
        const first = data.choices[0];
        if (first.message && first.message.content)
          text = first.message.content;
        else if (first.text) text = first.text;
        else text = JSON.stringify(first);
      } else if (data.output) {
        text = Array.isArray(data.output)
          ? data.output.map((o) => o.content || o).join('\n')
          : String(data.output);
      }

      const used =
        data.usage &&
        (data.usage.total_tokens || data.usage.totalToken || data.usage.tokens);

      // structured log
      console.info(
        JSON.stringify({
          event: 'groq_response',
          model: data.model || model,
          durationMs: duration,
          promptSize,
        })
      );

      // Extract code blocks from the response
      const codeBlocks = extractAllCodeBlocks(text);
      const firstCodeBlock = extractFirstCodeBlock(text);

      return {
        text,
        model: data.model || model,
        tokensUsed: used,
        codeBlocks,
        firstCodeBlock,
      };
    } catch (err) {
      lastErr = err;
      const duration = Date.now() - start;

      // decide if retryable: 429 or timeout/network
      const status = err && err.response && err.response.status;
      const isTimeout =
        err &&
        (err.code === 'ECONNABORTED' ||
          String(err.message).toLowerCase().includes('timeout'));
      const isRate = status === 429;

      console.error(
        JSON.stringify({
          event: 'groq_error',
          attempt,
          model,
          durationMs: duration,
          promptSize,
          status: status || null,
          message: String(err && err.message),
        })
      );

      if (isRate || isTimeout) {
        if (attempt < MAX_RETRIES) {
          const backoff = 500 * Math.pow(2, attempt - 1);
          await new Promise((r) => setTimeout(r, backoff));
          continue;
        }
      }

      // If model not found for this account, try a fallback model once
      if (err && err.response && err.response.data) {
        const bodyErr = err.response.data;
        const code = bodyErr.error && bodyErr.error.code;
        if (code === 'model_not_found' && model === 'llama-3.1-8b-instant') {
          console.warn(
            JSON.stringify({
              event: 'groq_fallback',
              message:
                'llama-3.1-8b-instant not available, retrying with mixtral-8x7b',
            })
          );
          // retry immediately with mixtral-8x7b (do not count against MAX_RETRIES loop)
          model = 'mixtral-8x7b';
          // reset attempt counter so we still have MAX_RETRIES attempts for the fallback
          attempt = 0;
          continue;
        }
        const stat = err.response.status;
        return { error: `HTTP ${stat}: ${JSON.stringify(bodyErr)}` };
      }
      return { error: String(err) };
    }
  }

  return { error: String(lastErr) };
}

module.exports = { askGroq };
