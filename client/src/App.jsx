import React, { useState, useEffect, useRef } from 'react';
import { execute, askAI, submitCode } from './api';
import Home from './Home';
import questionsData from './questions.json';
import { useAuth } from './AuthContext';
import { db } from './firebase';
import {
  collection,
  addDoc,
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import {
  LoadingSpinner,
  Toast,
  TabSwitchWarning,
  EditorHeader,
  CodeEditor,
  OutputPanel,
  AIPanel,
  DiffModal,
  ExitConfirmModal,
  TestResultsModal,
  QuestionPanel,
  RefreshWarningModal,
  AuthModal,
  VerdictModal,
} from './components';

export default function App() {
  // Auth State
  const { user, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Page & Challenge State
  const [currentPage, setCurrentPage] = useState('home');
  const [currentQuestion, setCurrentQuestion] = useState(null);

  // Editor State
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python3');
  const [prompt, setPrompt] = useState(
    'Explain any issues in the code and suggest improvements.'
  );
  const [stdinInput, setStdinInput] = useState('');
  const [status, setStatus] = useState('idle');

  // Execution State
  const [stdout, setStdout] = useState('');
  const [stderr, setStderr] = useState('');
  const [exitCode, setExitCode] = useState(null);
  const [timeMs, setTimeMs] = useState(null);
  const [running, setRunning] = useState(false);
  const [testCaseResults, setTestCaseResults] = useState([]);
  const runCtrlRef = useRef(null);

  // AI State
  const [aiResponse, setAiResponse] = useState('');
  const [aiModel, setAiModel] = useState(null);
  const [suggestedCode, setSuggestedCode] = useState(null);
  const [asking, setAsking] = useState(false);
  const askCtrlRef = useRef(null);

  // Modal & UI State
  const [showDiff, setShowDiff] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [toast, setToast] = useState(null);
  const [tabSwitchWarning, setTabSwitchWarning] = useState(false);
  const [showRefreshWarning, setShowRefreshWarning] = useState(false);
  const allowRefreshRef = useRef(false);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [verdictResult, setVerdictResult] = useState(null);
  const [showVerdict, setShowVerdict] = useState(false);
  const [securityEvents, setSecurityEvents] = useState([]);
  const submitCtrlRef = useRef(null);

  // ============ HANDLERS ============

  function handleSelectQuestion(question) {
    console.log('[Navigation] Selected question:', question.id, question.title);
    setCurrentQuestion(question);
    setCurrentPage('compiler');

    // Load saved code from Firestore if user is logged in (async, non-blocking)
    let savedCode = '';
    let savedLanguage = question.languages.includes(language)
      ? language
      : question.languages[0];

    if (user && db) {
      // Load asynchronously without blocking UI
      getDoc(doc(db, 'users', user.uid, 'questions', String(question.id)))
        .then((docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const loadedCode = data.code || '';
            const loadedLanguage = question.languages.includes(data.language)
              ? data.language
              : savedLanguage;
            setCode(loadedCode);
            setLanguage(loadedLanguage);
            console.log(
              '[Storage] Loaded saved code for question',
              question.id
            );
            showToast('Loaded your last submission', 'success');
          }
        })
        .catch((error) => {
          console.error('Error loading saved code:', error);
        });
    }

    // Set defaults immediately (will be overridden if saved code exists)
    setCode(savedCode);
    setLanguage(savedLanguage);
    setStdout('');
    setStderr('');
    setAiResponse('');
    // Update URL to /codespace
    const params = new URLSearchParams();
    params.set('questionId', question.id);
    params.set('language', savedLanguage);
    const url = `/codespace?${params.toString()}`;
    console.log('[Navigation] Pushing URL:', url);
    window.history.pushState({}, '', url);
    // User can press Esc to manually enter fullscreen if desired
    console.log('[Navigation] Question loaded - Press Esc for fullscreen');
  }

  function handleExit() {
    setShowExitConfirm(true);
  }

  function confirmExit() {
    setShowExitConfirm(false);
    setCurrentPage('home');
    setCurrentQuestion(null);
    setTestResults(null);
    setCode('');
    setLanguage('python3');
    setStdout('');
    setStderr('');
    setAiResponse('');
    // Exit fullscreen when leaving the codespace
    exitFullscreenMode();
    // Navigate to home page
    window.history.pushState({}, '', '/');
  }

  async function enterFullscreenMode() {
    try {
      const elem = document.documentElement;

      // Check if already in fullscreen
      if (
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      ) {
        console.log('[Fullscreen] Already in fullscreen mode');
        return true;
      }

      console.log('[Fullscreen] Attempting to enter fullscreen...');

      // Try standard API first
      if (elem.requestFullscreen) {
        try {
          await elem.requestFullscreen();
          console.log('[Fullscreen] Standard API: Success ✓');
          return true;
        } catch (e) {
          console.log('[Fullscreen] Standard API failed:', e.message);
          // Continue to webkit
        }
      }

      // Try webkit (Safari, older Chrome)
      if (elem.webkitRequestFullscreen) {
        try {
          await elem.webkitRequestFullscreen();
          console.log('[Fullscreen] Webkit API: Success ✓');
          return true;
        } catch (e) {
          console.log('[Fullscreen] Webkit API failed:', e.message);
          // Continue to ms
        }
      }

      // Try ms (IE/Edge)
      if (elem.msRequestFullscreen) {
        try {
          await elem.msRequestFullscreen();
          console.log('[Fullscreen] MS API: Success ✓');
          return true;
        } catch (e) {
          console.log('[Fullscreen] MS API failed:', e.message);
        }
      }

      console.warn('[Fullscreen] No fullscreen API available');
      return false;
    } catch (e) {
      console.error('[Fullscreen] Unexpected error:', e);
      return false;
    }
  }

  async function exitFullscreenMode() {
    try {
      console.log('[Fullscreen] Attempting to exit fullscreen...');

      if (document.fullscreenElement) {
        await document.exitFullscreen();
        console.log('[Fullscreen] Standard API exit: Success ✓');
        return true;
      } else if (document.webkitFullscreenElement) {
        await document.webkitExitFullscreen();
        console.log('[Fullscreen] Webkit API exit: Success ✓');
        return true;
      } else if (document.msFullscreenElement) {
        await document.msExitFullscreen();
        console.log('[Fullscreen] MS API exit: Success ✓');
        return true;
      } else {
        console.log('[Fullscreen] Not currently in fullscreen mode');
        return false;
      }
    } catch (e) {
      console.error('[Fullscreen] Exit failed:', e.message);
      return false;
    }
  }

  function handleTabSwitchDismiss() {
    setTabSwitchWarning(false);
    // Re-enter fullscreen when dismissing the warning
    enterFullscreenMode();
  }

  function handleRefreshConfirm() {
    allowRefreshRef.current = true;
    window.location.reload();
  }

  function handleRefreshCancel() {
    setShowRefreshWarning(false);
  }

  async function onRun() {
    const controller = new AbortController();
    runCtrlRef.current = controller;
    setRunning(true);
    setStatus('running');
    setTestCaseResults([]);

    try {
      const sampleTests = currentQuestion?.sampleTestCases || [];
      const hiddenTests = currentQuestion?.hiddenTestCases || [];
      const hasCustomInput = stdinInput && stdinInput.trim() !== '';

      // Case 1: User provided custom input - run both user code and solution code
      if (hasCustomInput) {
        const solutionCode = currentQuestion?.solutions?.[language];

        // Run user's code
        const userRes = await execute({
          language,
          code,
          stdin: stdinInput,
          signal: controller.signal,
        });
        const userPayload = userRes && userRes.data ? userRes.data : userRes;

        let expectedOutput = '';
        let solutionError = '';

        // Run solution code to get expected output
        if (solutionCode) {
          try {
            const solRes = await execute({
              language,
              code: solutionCode,
              stdin: stdinInput,
              signal: controller.signal,
            });
            const solPayload = solRes && solRes.data ? solRes.data : solRes;
            expectedOutput = solPayload.stdout || '';
            solutionError = solPayload.stderr || '';
          } catch (e) {
            solutionError = String(e);
          }
        }

        if (userPayload.error === 'aborted') {
          setStdout('');
          setStderr('Execution cancelled');
          setStatus('idle');
          showToast('Execution cancelled', 'warning');
          setExitCode(null);
          setTimeMs(null);
          return;
        } else if (userPayload.error) {
          setStdout('');
          setStderr(userPayload.error || 'Unknown error');
          setStatus('error');
          showToast('Execution error', 'error');
          setExitCode(null);
          setTimeMs(null);
          return;
        }

        const actualOutput = userPayload.stdout || '';
        const passed = actualOutput.trim() === expectedOutput.trim();

        setTestCaseResults([
          {
            testNumber: 1,
            isHidden: false,
            input: stdinInput,
            expectedOutput: expectedOutput,
            actualOutput: actualOutput,
            stderr: userPayload.stderr || '',
            exitCode: userPayload.exitCode ?? null,
            timeMs: userPayload.timeMs ?? null,
            passed,
            isCustomInput: true,
          },
        ]);

        setStdout(actualOutput);
        setStderr(userPayload.stderr || '');
        setExitCode(userPayload.exitCode ?? null);
        setTimeMs(userPayload.timeMs ?? null);
        setStatus(passed ? 'success' : 'error');
        showToast(
          passed
            ? 'Output matches expected!'
            : 'Output does not match expected',
          passed ? 'success' : 'warning'
        );
        return;
      }

      // Case 2: No custom input - run visible test cases only
      if (sampleTests.length === 0) {
        // No test cases at all - just run with empty input
        const res = await execute({
          language,
          code,
          stdin: '',
          signal: controller.signal,
        });
        const payload = res && res.data ? res.data : res;

        if (payload.error === 'aborted') {
          setStdout('');
          setStderr('Execution cancelled');
          setStatus('idle');
          showToast('Execution cancelled', 'warning');
          setExitCode(null);
          setTimeMs(null);
        } else if (payload.error) {
          setStdout('');
          setStderr(payload.error || 'Unknown error');
          setStatus('error');
          showToast('Execution error', 'error');
          setExitCode(null);
          setTimeMs(null);
        } else {
          const out = payload.stdout || '';
          const err = payload.stderr || '';
          setStdout(out);
          setStderr(err);
          setExitCode(payload.exitCode ?? null);
          setTimeMs(payload.timeMs ?? null);
          setStatus(err ? 'error' : 'success');
          showToast(
            err ? 'Execution completed with errors' : 'Execution successful',
            err ? 'warning' : 'success'
          );
        }
        return;
      }

      // Run visible test cases + hidden test cases
      const allTests = [...sampleTests, ...hiddenTests];
      const results = [];

      for (let i = 0; i < allTests.length; i++) {
        const test = allTests[i];
        const isHidden = i >= sampleTests.length;
        const testInput = test.input === 'None' ? '' : test.input;

        try {
          const res = await execute({
            language,
            code,
            stdin: testInput,
            signal: controller.signal,
          });
          const payload = res && res.data ? res.data : res;

          if (payload.error === 'aborted') {
            results.push({
              testNumber: i + 1,
              isHidden,
              input: testInput,
              expectedOutput: test.output,
              actualOutput: '',
              stderr: 'Execution cancelled',
              passed: false,
              error: true,
            });
            break;
          } else if (payload.error) {
            results.push({
              testNumber: i + 1,
              isHidden,
              input: testInput,
              expectedOutput: test.output,
              actualOutput: '',
              stderr: payload.error || 'Unknown error',
              passed: false,
              error: true,
            });
          } else {
            const actualOutput = (payload.stdout || '').trim();
            const expectedOutput = test.output.trim();
            const passed = actualOutput === expectedOutput;

            results.push({
              testNumber: i + 1,
              isHidden,
              input: testInput,
              expectedOutput: test.output,
              actualOutput: payload.stdout || '',
              stderr: payload.stderr || '',
              exitCode: payload.exitCode ?? null,
              timeMs: payload.timeMs ?? null,
              passed,
            });
          }
        } catch (e) {
          results.push({
            testNumber: i + 1,
            isHidden,
            input: testInput,
            expectedOutput: test.output,
            actualOutput: '',
            stderr: String(e),
            passed: false,
            error: true,
          });
        }
      }

      setTestCaseResults(results);

      // Set overall status
      const allPassed = results.every((r) => r.passed);
      const anyError = results.some((r) => r.error);

      if (allPassed) {
        setStatus('success');
        showToast('All test cases passed!', 'success');
      } else if (anyError) {
        setStatus('error');
        showToast('Execution errors occurred', 'error');
      } else {
        setStatus('error');
        showToast('Some test cases failed', 'warning');
      }

      // Set stdout/stderr from first test case for backward compatibility
      if (results.length > 0) {
        setStdout(results[0].actualOutput);
        setStderr(results[0].stderr);
        setExitCode(results[0].exitCode ?? null);
        setTimeMs(results[0].timeMs ?? null);
      }
    } catch (e) {
      const msg = String(e);
      setStdout('');
      setStderr(msg);
      setStatus('error');
      showToast('Execution error', 'error');
      setExitCode(null);
      setTimeMs(null);
    } finally {
      setRunning(false);
    }
  }

  function extractSuggestedCode(text) {
    if (!text) return null;
    const t = String(text);
    const fence = /```[\s\S]*?\n([\s\S]*?)\n```/m.exec(t);
    if (fence && fence[1]) return fence[1].trim();
    const lines = t.split(/\r?\n/);
    if (lines.length > 1 && /[;{}()=<>]|def\s+|function\s+|#include\s+/.test(t))
      return t.trim();
    return null;
  }

  function handleEditorKeyDown(e) {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const ta = e.target;
    const value = code || '';
    const start = ta.selectionStart;
    const end = ta.selectionEnd;

    if (start !== end) {
      const selection = value.slice(start, end);
      const lines = selection.split(/\n/);
      if (e.shiftKey) {
        const newLines = lines.map((l) => l.replace(/^\t|^ {1,4}/, ''));
        const newValue =
          value.slice(0, start) + newLines.join('\n') + value.slice(end);
        setCode(newValue);
        requestAnimationFrame(() => {
          const newEnd = start + newLines.join('\n').length;
          ta.selectionStart = start;
          ta.selectionEnd = newEnd;
        });
      } else {
        const newLines = lines.map((l) => '\t' + l);
        const newValue =
          value.slice(0, start) + newLines.join('\n') + value.slice(end);
        setCode(newValue);
        requestAnimationFrame(() => {
          const newStart = start;
          const newEnd = start + newLines.join('\n').length;
          ta.selectionStart = newStart;
          ta.selectionEnd = newEnd;
        });
      }
      return;
    }

    if (e.shiftKey) {
      const before = value.slice(0, start);
      if (before.endsWith('\t')) {
        const newValue = value.slice(0, start - 1) + value.slice(end);
        setCode(newValue);
        requestAnimationFrame(() => {
          const pos = start - 1;
          ta.selectionStart = ta.selectionEnd = Math.max(0, pos);
        });
      } else if (before.endsWith('    ')) {
        const newValue = value.slice(0, start - 4) + value.slice(end);
        setCode(newValue);
        requestAnimationFrame(() => {
          const pos = start - 4;
          ta.selectionStart = ta.selectionEnd = Math.max(0, pos);
        });
      }
    } else {
      const tab = '\t';
      const newValue = value.slice(0, start) + tab + value.slice(end);
      setCode(newValue);
      requestAnimationFrame(() => {
        const pos = start + tab.length;
        ta.selectionStart = ta.selectionEnd = pos;
      });
    }
  }

  async function onAskWithPrompt(promptText) {
    const controller = new AbortController();
    askCtrlRef.current = controller;
    setAsking(true);
    setAiResponse('');
    try {
      const res = await askAI({
        prompt: promptText,
        code,
        stderr,
        signal: controller.signal,
      });
      const payload = res && res.data ? res.data : res;
      if (payload.error === 'aborted') {
        setAiResponse('AI request aborted');
        showToast('AI request aborted', 'warning');
        setAiModel(null);
      } else if (payload.error) {
        setAiResponse('Error: ' + payload.error);
        showToast('AI error', 'error');
        setAiModel(null);
      } else {
        const txt = payload.text || '';
        setAiResponse(txt);
        setAiModel(payload.model || null);
        const sc = extractSuggestedCode(txt);
        setSuggestedCode(sc);
      }
    } catch (e) {
      const msg = String(e);
      setAiResponse(msg);
      showToast('AI request failed', 'error');
      setAiModel(null);
    } finally {
      setAsking(false);
    }
  }

  function onAskPreset(kind) {
    if (kind === 'explain') {
      return onAskWithPrompt(
        'Explain the errors in the following code, why they occur, and provide step-by-step fixes. Include minimal code snippets to fix the issues.'
      );
    }
    if (kind === 'optimize') {
      return onAskWithPrompt(
        'Suggest performance and readability optimizations for the following code. Provide concrete code suggestions and explain complexity trade-offs.'
      );
    }
    if (kind === 'comments') {
      return onAskWithPrompt(
        'Add helpful comments to the following code to explain what each function and non-trivial block does. Output the commented code only.'
      );
    }
  }

  function cancelRun() {
    if (runCtrlRef.current) {
      runCtrlRef.current.abort();
      runCtrlRef.current = null;
      setRunning(false);
    }
  }

  function cancelAsk() {
    if (askCtrlRef.current) {
      askCtrlRef.current.abort();
      askCtrlRef.current = null;
      setAsking(false);
    }
  }

  function showToast(message, type = 'info') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  function onClear() {
    setCode('');
    setStdout('');
    setStderr('');
    setAiResponse('');
    setStatus('idle');
  }

  async function onSubmit() {
    // Require authentication
    if (!user) {
      setShowAuthModal(true);
      showToast('Please log in to submit', 'warning');
      return;
    }

    if (!currentQuestion || !code.trim()) {
      showToast('Please write some code first', 'warning');
      return;
    }

    const controller = new AbortController();
    submitCtrlRef.current = controller;
    setSubmitting(true);

    try {
      const derivedQuestionId = currentQuestion.questionId
        ? String(currentQuestion.questionId)
        : typeof currentQuestion.id === 'number'
          ? `Q${String(currentQuestion.id).padStart(3, '0')}`
          : String(currentQuestion.id);

      console.log('[Submit] Submitting code for evaluation...', {
        userId: user.uid,
        questionId: derivedQuestionId,
        language,
        codeLength: code.length,
        securityEventsCount: securityEvents.length,
      });

      const result = await submitCode({
        userId: user.uid,
        email: user.email || 'unknown@example.com',
        questionId: derivedQuestionId,
        language,
        code,
        securityEvents,
        signal: controller.signal,
      });

      if (!result.success) {
        console.error('[Submit] Submission failed:', result.data);
        showToast(
          'Submission failed: ' + (result.data.error || 'Unknown error'),
          'error'
        );
        return;
      }

      console.log('[Submit] Submission successful:', result.data);

      // Store verdict result and show modal
      setVerdictResult(result.data);
      setShowVerdict(true);

      // Save submission to Firestore if user is logged in
      if (user && db && result.data) {
        try {
          // Save full submission details including code
          const submissionsRef = collection(
            db,
            'users',
            user.uid,
            'submissions'
          );
          await addDoc(submissionsRef, {
            questionId: derivedQuestionId,
            questionTitle: currentQuestion.title,
            submissionTime: serverTimestamp(),
            language,
            code: code, // Save the actual code
            codeLength: code.length,
            verdict: result.data.finalVerdict,
            score: result.data.finalVerdict?.score || 0,
            decision: result.data.finalVerdict?.decision || 'UNKNOWN',
            trustScore: result.data.finalVerdict?.trustScore || 0,
            evaluationDurationMs: result.data.totalDurationMs || 0,
            securityEventsCount: securityEvents.length,
            testPassRate: result.data.testResults?.passRate || 0,
            completionRate: result.data.completionRate || 0,
          });
          console.log('[Submit] Submission saved to Firestore');

          // Also update the user's progress for this question
          const questionProgressRef = doc(
            db,
            'users',
            user.uid,
            'questions',
            derivedQuestionId
          );
          await setDoc(
            questionProgressRef,
            {
              code: code,
              language: language,
              lastUpdated: serverTimestamp(),
              lastScore: result.data.finalVerdict?.score || 0,
              lastDecision: result.data.finalVerdict?.decision || 'UNKNOWN',
              questionTitle: currentQuestion.title,
              attemptCount: (await getDoc(questionProgressRef)).exists()
                ? ((await getDoc(questionProgressRef)).data().attemptCount ||
                    0) + 1
                : 1,
            },
            { merge: true }
          );
          console.log('[Submit] Question progress updated');
        } catch (firebaseErr) {
          console.warn('[Submit] Failed to save to Firestore:', firebaseErr);
          // Don't fail the submission if Firestore save fails
        }
      }

      showToast('Code evaluated successfully!', 'success');
    } catch (err) {
      const msg = String(err);
      if (msg.includes('ERR_CANCELED')) {
        showToast('Submission cancelled', 'warning');
      } else {
        console.error('[Submit] Error:', err);
        showToast('Submission error: ' + msg, 'error');
      }
    } finally {
      setSubmitting(false);
      submitCtrlRef.current = null;
    }
  }

  function cancelSubmit() {
    if (submitCtrlRef.current) {
      submitCtrlRef.current.abort();
      submitCtrlRef.current = null;
    }
  }

  async function checkTestCases() {
    const results = [];
    let allPassed = true;

    for (let i = 0; i < currentQuestion.hiddenTestCases.length; i++) {
      const testCase = currentQuestion.hiddenTestCases[i];
      const res = await execute({
        language,
        code,
        stdin: testCase.input || '',
      });
      const actualOutput = (res.data.stdout || '').trim();
      const expectedOutput = (testCase.output || '').trim();
      const passed = actualOutput === expectedOutput;

      results.push({
        number: i + 1,
        passed,
      });
      if (!passed) allPassed = false;
    }

    // Don't show detailed test results, just show toast message
    showToast(
      `${results.filter((r) => r.passed).length}/${results.length} tests passed`,
      allPassed ? 'success' : 'warning'
    );

    // Save to Firestore if user is logged in
    if (user && currentQuestion) {
      try {
        const submissionData = {
          userId: user.uid,
          userEmail: user.email,
          questionId: currentQuestion.id,
          questionTitle: currentQuestion.title,
          language: language,
          code: code,
          testResults: {
            totalTests: results.length,
            passedTests: results.filter((r) => r.passed).length,
            allPassed: allPassed,
          },
          timestamp: serverTimestamp(),
          status: allPassed ? 'accepted' : 'failed',
        };

        // Save to submissions collection
        await addDoc(collection(db, 'submissions'), submissionData);

        // Also update user's latest submission for this question
        const userQuestionRef = doc(
          db,
          'users',
          user.uid,
          'questions',
          String(currentQuestion.id)
        );
        await setDoc(
          userQuestionRef,
          {
            questionId: currentQuestion.id,
            questionTitle: currentQuestion.title,
            language: language,
            code: code,
            lastSubmitted: serverTimestamp(),
            bestStatus: allPassed ? 'accepted' : 'failed',
            passedTests: results.filter((r) => r.passed).length,
            totalTests: results.length,
          },
          { merge: true }
        );

        console.log('Submission saved to Firestore');
      } catch (error) {
        console.error('Error saving submission:', error);
        // Don't show error to user, fail silently
      }
    }
  }

  // ============ EFFECTS ============

  // Initialize from URL or localStorage on mount
  useEffect(() => {
    const pathname = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const questionId = params.get('questionId');
    const savedCode = params.get('code');
    const savedLanguage = params.get('language');

    // Check if we're on /codespace route
    if (pathname === '/codespace' && questionId) {
      console.log('[Init] Restoring from codespace URL:', {
        questionId,
        savedLanguage,
      });
      // Restore from URL
      const question = questionsData.questions.find(
        (q) => q.id === parseInt(questionId)
      );
      if (question) {
        setCurrentQuestion(question);
        setCurrentPage('compiler');
        if (savedLanguage) setLanguage(savedLanguage);
        if (savedCode) {
          setCode(decodeURIComponent(savedCode));
        }
        // Don't auto-enter fullscreen - causes browser errors
        // User can press Esc if they want fullscreen
        console.log('[Init] Page restored from URL');
      }
    } else {
      console.log('[Init] Not in codespace, loading from localStorage');
      // Restore from localStorage if no URL params or on home page
      try {
        const localCode = localStorage.getItem('awc.code');
        const localLang = localStorage.getItem('awc.language');
        if (localCode) setCode(localCode);
        if (localLang) setLanguage(localLang);
      } catch (e) {}
      // Ensure we're on home page
      if (pathname !== '/') {
        window.history.replaceState({}, '', '/');
      }
    }
  }, []);

  // Update URL when code changes in compiler page
  useEffect(() => {
    if (currentPage === 'compiler' && currentQuestion) {
      try {
        localStorage.setItem('awc.code', code);
        localStorage.setItem('awc.language', language);
        // Update URL with current state
        const params = new URLSearchParams();
        params.set('questionId', currentQuestion.id);
        params.set('language', language);
        // Only add code to URL if it's different from the solution (to keep URL shorter)
        if (code !== currentQuestion.solutions[language]) {
          params.set('code', encodeURIComponent(code));
        }
        window.history.replaceState({}, '', `/codespace?${params.toString()}`);
      } catch (e) {}
    }
  }, [code, language, currentPage, currentQuestion]);

  useEffect(() => {
    // Ensure fullscreen stays active in compiler page and re-enter if exited unexpectedly
    if (currentPage !== 'compiler') return;

    console.log('[Fullscreen] Started persistence check (checks every 1s)');

    // Check every second if we're still in fullscreen, if not and we're still in compiler, try to re-enter
    const fullscreenCheckInterval = setInterval(() => {
      const isFullscreen =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement;

      if (!isFullscreen && currentPage === 'compiler') {
        console.log(
          '[Fullscreen] Fullscreen exited unexpectedly, re-entering...'
        );
        enterFullscreenMode();
      }
    }, 1000);

    return () => {
      console.log('[Fullscreen] Stopped persistence check');
      clearInterval(fullscreenCheckInterval);
    };
  }, [currentPage]);

  useEffect(() => {
    // Only track tab switches when inside the compiler (not on home page)
    if (currentPage !== 'compiler') return;

    // Automatically enter fullscreen when entering compiler
    enterFullscreenMode();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchWarning(true);
      } else {
        setTabSwitchWarning(true);
      }
    };

    const handleFullscreenChange = () => {
      // Treat fullscreen exit as a tab switch
      if (
        !document.fullscreenElement &&
        !document.webkitFullscreenElement &&
        !document.msFullscreenElement
      ) {
        setTabSwitchWarning(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener(
        'webkitfullscreenchange',
        handleFullscreenChange
      );
      document.removeEventListener(
        'msfullscreenchange',
        handleFullscreenChange
      );
    };
  }, [currentPage]);

  useEffect(() => {
    // Disable copy/paste in codespace
    if (currentPage !== 'compiler') return;

    const handleCopyPaste = (e) => {
      e.preventDefault();
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    // Disable keyboard shortcuts for copy (Ctrl+C), cut (Ctrl+X), paste (Ctrl+V)
    const handleKeyDown = (e) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'c' ||
          e.key === 'C' ||
          e.key === 'x' ||
          e.key === 'X' ||
          e.key === 'v' ||
          e.key === 'V')
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('cut', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('cut', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentPage]);

  // Intercept browser refresh (Ctrl+R, F5, etc.) and show custom popup
  useEffect(() => {
    if (currentPage !== 'compiler') return;

    const handleKeyDown = (e) => {
      // Detect refresh shortcuts: F5, Ctrl+R, Cmd+R
      if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key === 'r')) {
        if (allowRefreshRef.current) return;

        e.preventDefault();
        e.stopPropagation();
        setShowRefreshWarning(true);
      }
    };

    // Intercept beforeunload for other refresh methods (like clicking reload button)
    const handleBeforeUnload = (e) => {
      if (allowRefreshRef.current) return;

      // Prevent and show browser's native dialog only
      e.preventDefault();
      e.returnValue = ''; // Browser will show its dialog, but ours will show first if triggered by keyboard
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentPage]);

  // ============ RENDER ============

  return (
    <>
      <AuthModal show={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {currentPage === 'home' ? (
        <Home
          onSelectQuestion={handleSelectQuestion}
          user={user}
          logout={logout}
          onShowAuth={() => setShowAuthModal(true)}
        />
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-900 p-6">
          <EditorHeader
            currentQuestion={currentQuestion}
            onExit={handleExit}
            user={user}
            logout={logout}
            onShowAuth={() => setShowAuthModal(true)}
          />

          <LoadingSpinner running={running} asking={asking} />
          <Toast toast={toast} />
          <TabSwitchWarning
            show={tabSwitchWarning}
            onDismiss={handleTabSwitchDismiss}
          />

          <div className="max-w-full mx-auto">
            {/* Main Title */}
            <div className="mb-6 text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-2">
                🚀 AI Web Compiler
              </h1>
              <p className="text-purple-300/60 text-sm">
                Write code • Run it • Get AI suggestions
              </p>
            </div>

            {/* Main Content Grid - 3 Column Layout */}
            <div className="grid grid-cols-4 gap-6 h-auto">
              {/* Left Sidebar - Question Panel */}
              <div className="col-span-1">
                <QuestionPanel question={currentQuestion} />
              </div>

              {/* Right Content - Editor and Output */}
              <div className="col-span-3 flex flex-col gap-6">
                {/* Code Editor */}
                <CodeEditor
                  code={code}
                  setCode={setCode}
                  language={language}
                  setLanguage={setLanguage}
                  status={status}
                  running={running}
                  asking={asking}
                  currentQuestion={currentQuestion}
                  onRun={onRun}
                  onCancel={cancelRun}
                  onSubmit={checkTestCases}
                  onSubmitForEvaluation={onSubmit}
                  submitting={submitting}
                  onAsk={() => onAskWithPrompt(prompt)}
                  onClear={onClear}
                  onAskPreset={onAskPreset}
                  prompt={prompt}
                  setPrompt={setPrompt}
                  stdinInput={stdinInput}
                  setStdinInput={setStdinInput}
                  handleEditorKeyDown={handleEditorKeyDown}
                />

                {/* Output & AI Side by Side */}
                <div className="grid grid-cols-2 gap-6">
                  <OutputPanel
                    stdout={stdout}
                    stderr={stderr}
                    exitCode={exitCode}
                    timeMs={timeMs}
                    testCaseResults={testCaseResults}
                  />
                  <AIPanel
                    aiResponse={aiResponse}
                    aiModel={aiModel}
                    suggestedCode={suggestedCode}
                    onShowDiff={() => setShowDiff(true)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Modals */}
          <DiffModal
            show={showDiff}
            code={code}
            suggestedCode={suggestedCode}
            onClose={() => setShowDiff(false)}
            onApply={() => {
              setCode(suggestedCode || '');
              setShowDiff(false);
              showToast('Applied suggestion', 'success');
            }}
          />

          <VerdictModal
            show={showVerdict}
            verdict={verdictResult}
            onClose={() => setShowVerdict(false)}
          />

          <ExitConfirmModal
            show={showExitConfirm}
            onConfirm={confirmExit}
            onCancel={() => setShowExitConfirm(false)}
          />

          <TestResultsModal
            testResults={testResults}
            onClose={() => setTestResults(null)}
          />

          <RefreshWarningModal
            show={showRefreshWarning}
            onConfirm={handleRefreshConfirm}
            onCancel={handleRefreshCancel}
          />
        </div>
      )}
    </>
  );
}
