const axios = require('axios');

async function runWithPiston(language, code, stdin = '') {
  const url = 'https://emkc.org/api/v2/piston/execute';

  // Map frontend language to Piston language and version
  const langMap = {
    python3: { language: 'python', version: '3.10' },
    python: { language: 'python', version: '3.10' },
    node: { language: 'javascript', version: '18.15' },
    javascript: { language: 'javascript', version: '18.15' },
    c: { language: 'c', version: '10.2' },
    cpp: { language: 'cpp', version: '10.2' },
    java: { language: 'java', version: '15.0' },
  };

  const langConfig = langMap[language] || { language: language, version: '*' };

  const payload = {
    language: langConfig.language,
    version: langConfig.version,
    files: [
      {
        content: code,
      },
    ],
    stdin: stdin || '',
  };

  try {
    const response = await axios.post(url, payload, { timeout: 20000 });
    const data = response.data;

    // Transform Piston response to match expected format
    return {
      stdout: data.run?.stdout || '',
      stderr: data.run?.stderr || '',
      exitCode: data.run?.code || 0,
      output: data.run?.output || '',
      language: data.language,
      version: data.version,
    };
  } catch (err) {
    console.error('Piston API Error:', err.message);
    if (err.response?.data) {
      console.error('Piston API Response:', err.response.data);
    }
    return {
      error: err.message,
      details: err.response?.data,
      stdout: '',
      stderr: err.response?.data?.message || err.message,
      exitCode: 1,
    };
  }
}

module.exports = { runWithPiston };
