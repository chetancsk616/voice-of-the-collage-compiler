import axios from 'axios';

// execute: run code in the sandbox
// options can include an AbortSignal as `signal`
export async function execute({ language, code, stdin, signal } = {}) {
  try {
    const res = await axios.post(
      '/api/execute',
      { language, code, stdin },
      { signal }
    );
    return { data: res.data };
  } catch (err) {
    // axios uses code === 'ERR_CANCELED' when aborted via AbortController
    if (err && err.code === 'ERR_CANCELED')
      return { data: { error: 'aborted' } };
    if (err && err.response) return { data: err.response.data };
    return { data: { error: String(err) } };
  }
}

// askAI: query the AI helper
// supports AbortSignal via options.signal
export async function askAI({
  prompt,
  code,
  stderr,
  language,
  model,
  signal,
} = {}) {
  try {
    const res = await axios.post(
      '/api/ask-ai',
      { prompt, code, stderr, language, model },
      { signal }
    );
    return { data: res.data };
  } catch (err) {
    if (err && err.code === 'ERR_CANCELED')
      return { data: { error: 'aborted' } };
    if (err && err.response) return { data: err.response.data };
    return { data: { error: String(err) } };
  }
}

// submitCode: submit code for evaluation pipeline
// returns full verdict with logic analysis and AI verification
export async function submitCode({
  userId,
  email,
  questionId,
  language,
  code,
  securityEvents,
  signal,
} = {}) {
  try {
    const res = await axios.post(
      '/api/submit',
      {
        userId,
        email,
        questionId,
        language,
        code,
        securityEvents: securityEvents || [],
      },
      { signal }
    );
    return { data: res.data, success: true };
  } catch (err) {
    if (err && err.code === 'ERR_CANCELED')
      return { data: { error: 'aborted' }, success: false };
    if (err && err.response) return { data: err.response.data, success: false };
    return { data: { error: String(err) }, success: false };
  }
}

// backward-compatible alias used by some components
export const runCode = (language, code, stdin, signal) =>
  execute({ language, code, stdin, signal });

export default { execute, askAI, submitCode, runCode };
