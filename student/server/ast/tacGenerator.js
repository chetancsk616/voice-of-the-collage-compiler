// TAC Generator: produces deterministic Three Address Code from source code
// Design goals:
// - Language-agnostic (best-effort using tokens + AST hints)
// - Deterministic temp/label allocation
// - Minimal instruction set: ASSIGN, BINOP, CJUMP, LABEL, GOTO, RETURN, CALL

const { parse, normalizeLanguage } = require('./astParser');

// Helpers for temp and label allocation
function makeAllocators() {
  let t = 0;
  let l = 0;
  return {
    newTemp() { t += 1; return `t${t}`; },
    newLabel(prefix = 'L') { l += 1; return `${prefix}${l}`; },
    counters() { return { temps: t, labels: l }; },
  };
}

// Very small tokenizer for expressions to flatten into BINOP/ASSIGN
function tokenizeExpression(expr) {
  const tokens = [];
  const re = /[A-Za-z_][A-Za-z0-9_]*|\d+|==|!=|>=|<=|&&|\|\||[+\-*/%<>=()]/g;
  let m;
  while ((m = re.exec(expr))) tokens.push(m[0]);
  return tokens;
}

// Shunting-yard to RPN for infix expressions
const PRECEDENCE = { '||':1, '&&':2, '==':3, '!=':3, '<':4, '>':4, '<=':4, '>=':4, '+':5, '-':5, '*':6, '/':6, '%':6 };
const RIGHT_ASSOC = new Set();

function toRPN(tokens) {
  const out = [];
  const st = [];
  for (const tok of tokens) {
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(tok) || /^\d+$/.test(tok)) {
      out.push(tok);
    } else if (tok === '(') {
      st.push(tok);
    } else if (tok === ')') {
      while (st.length && st[st.length - 1] !== '(') out.push(st.pop());
      st.pop();
    } else {
      const p = PRECEDENCE[tok] || 0;
      while (st.length) {
        const top = st[st.length - 1];
        const pt = PRECEDENCE[top] || 0;
        if (top !== '(' && (pt > p || (pt === p && !RIGHT_ASSOC.has(tok)))) {
          out.push(st.pop());
        } else break;
      }
      st.push(tok);
    }
  }
  while (st.length) out.push(st.pop());
  return out;
}

// Build TAC from RPN
function rpnToTAC(rpn, alloc) {
  const instr = [];
  const st = [];
  for (const tok of rpn) {
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(tok) || /^\d+$/.test(tok)) {
      st.push(tok);
      continue;
    }
    // Operator
    const b = st.pop();
    const a = st.pop();
    const t = alloc.newTemp();
    instr.push({ op: 'BINOP', dst: t, a, b, operator: tok });
    st.push(t);
  }
  return { instr, result: st.pop() };
}

function normalizeWhitespaceLines(code) {
  return String(code || '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

// Normalize increment-like syntax into canonical assignments
function normalizeIncText(text) {
  let s = String(text || '').trim().replace(/;$/, '');
  // Remove JS declarations in init context
  s = s.replace(/^(?:let|var|const)\s+/, '');
  // i++ / ++i
  if (/^[A-Za-z_][A-Za-z0-9_]*\s*\+\+$/i.test(s) || /^\+\+\s*[A-Za-z_][A-Za-z0-9_]*$/i.test(s)) {
    const v = s.replace(/\+/g, '').trim();
    return `${v} = ${v} + 1`;
  }
  // i-- / --i
  if (/^[A-Za-z_][A-Za-z0-9_]*\s*--$/i.test(s) || /^--\s*[A-Za-z_][A-Za-z0-9_]*$/i.test(s)) {
    const v = s.replace(/-/g, '').trim();
    return `${v} = ${v} - 1`;
  }
  // i += k / i -= k
  if (/^([A-Za-z_][A-Za-z0-9_]*)\s*\+=\s*(.+)$/.test(s)) {
    const m = s.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*\+=\s*(.+)$/);
    return `${m[1]} = ${m[1]} + ${m[2]}`;
  }
  if (/^([A-Za-z_][A-Za-z0-9_]*)\s*-=\s*(.+)$/.test(s)) {
    const m = s.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*-=\s*(.+)$/);
    return `${m[1]} = ${m[1]} - ${m[2]}`;
  }
  // i = expr (already assignment) or plain expr
  return s;
}

function emitAssignmentOrExpr(text, alloc, instr) {
  const s = normalizeIncText(text);
  // x = expr
  const m = s.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/);
  if (m) {
    const lhs = m[1];
    const rhs = m[2].trim();
    const rpn = toRPN(tokenizeExpression(rhs));
    const { instr: seq, result } = rpnToTAC(rpn, alloc);
    instr.push(...seq);
    instr.push({ op: 'ASSIGN', dst: lhs, src: result });
    return;
  }
  // bare expression → evaluate for side effects
  if (s.length) {
    const rpn = toRPN(tokenizeExpression(s));
    const { instr: seq } = rpnToTAC(rpn, alloc);
    instr.push(...seq);
  }
}

// Heuristic block detector for if/while/for and returns
function generateFromCodeText(code, alloc) {
  const lines = normalizeWhitespaceLines(code);
  const instr = [];
  const stack = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    // Return
    const mRet = line.match(/^return\s+(.+);?$|^print\((.+)\)\s*;?$/);
    if (mRet) {
      const expr = (mRet[1] || mRet[2] || '').trim();
      if (expr) {
        const rpn = toRPN(tokenizeExpression(expr));
        const { instr: seq, result } = rpnToTAC(rpn, alloc);
        instr.push(...seq);
        instr.push({ op: 'RETURN', src: result });
      } else {
        instr.push({ op: 'RETURN' });
      }
      continue;
    }

    // If condition
    let m = line.match(/^if\s*\((.*)\)\s*:?$|^if\s+(.+):$/);
    if (m) {
      const cond = (m[1] || m[2] || '').trim();
      const rpn = toRPN(tokenizeExpression(cond));
      const { instr: seq, result } = rpnToTAC(rpn, alloc);
      instr.push(...seq);
      const lTrue = alloc.newLabel('LT');
      const lFalse = alloc.newLabel('LF');
      instr.push({ op: 'CJUMP', cond: result, ifTrue: lTrue, ifFalse: lFalse });
      instr.push({ op: 'LABEL', name: lTrue });
      stack.push({ kind: 'if', falseLabel: lFalse });
      continue;
    }

    // Else
    if (/^else\b/.test(line)) {
      const top = stack[stack.length - 1];
      if (top && top.kind === 'if') {
        const lEnd = alloc.newLabel('LE');
        instr.push({ op: 'GOTO', target: lEnd });
        instr.push({ op: 'LABEL', name: top.falseLabel });
        top.endLabel = lEnd;
      }
      continue;
    }

    // End block heuristics (upon detecting dedent or closing brace on next lines not available here) — noop

    // While loop
    m = line.match(/^while\s*\((.*)\)\s*:?$|^while\s+(.+):$/);
    if (m) {
      const cond = (m[1] || m[2] || '').trim();
      const lStart = alloc.newLabel('LW');
      const lBody = alloc.newLabel('LB');
      const lEnd = alloc.newLabel('LE');
      instr.push({ op: 'LABEL', name: lStart });
      const rpn = toRPN(tokenizeExpression(cond));
      const { instr: seq, result } = rpnToTAC(rpn, alloc);
      instr.push(...seq);
      instr.push({ op: 'CJUMP', cond: result, ifTrue: lBody, ifFalse: lEnd });
      instr.push({ op: 'LABEL', name: lBody });
      stack.push({ kind: 'while', start: lStart, end: lEnd });
      continue;
    }

    // For: two forms supported → (init; cond; inc) and Python range()
    m = line.match(/^for\s*\((.*);(.*);(.*)\)\s*\{?\s*$|^for\s+(\w+)\s+in\s+range\((.*)\):$/);
    if (m) {
      let initText = '';
      let condText = '';
      let incText = '';
      if (m[1] !== undefined) {
        // C-like for(init; cond; inc)
        initText = (m[1] || '').trim();
        condText = (m[2] || '').trim();
        incText = (m[3] || '').trim();
      } else {
        // Python for i in range(N)
        const v = (m[4] || '').trim();
        const rangeArg = (m[5] || '').trim();
        if (v && rangeArg) {
          initText = `${v} = 0`;
          condText = `${v} < ${rangeArg}`;
          incText = `${v} = ${v} + 1`;
        }
      }

      // Emit init before loop start for canonicalization
      if (initText) emitAssignmentOrExpr(initText, alloc, instr);

      const lStart = alloc.newLabel('LFOR');
      const lBody = alloc.newLabel('LB');
      const lEnd = alloc.newLabel('LE');

      instr.push({ op: 'LABEL', name: lStart });
      if (condText) {
        const rpn = toRPN(tokenizeExpression(condText));
        const { instr: seq, result } = rpnToTAC(rpn, alloc);
        instr.push(...seq);
        instr.push({ op: 'CJUMP', cond: result, ifTrue: lBody, ifFalse: lEnd });
      } else {
        instr.push({ op: 'GOTO', target: lBody });
      }
      instr.push({ op: 'LABEL', name: lBody });
      stack.push({ kind: 'for', start: lStart, end: lEnd, incText: incText || '' });
      continue;
    }

    // Closing braces hint end of block (C-like)
    if (/^}\s*;?$/.test(line)) {
      const top = stack.pop();
      if (top?.kind === 'if') {
        if (top.endLabel) instr.push({ op: 'LABEL', name: top.endLabel });
        else instr.push({ op: 'LABEL', name: top.falseLabel });
      } else if (top?.kind === 'while' || top?.kind === 'for') {
        if (top.kind === 'for' && top.incText) {
          emitAssignmentOrExpr(top.incText, alloc, instr);
        }
        instr.push({ op: 'GOTO', target: top.start });
        instr.push({ op: 'LABEL', name: top.end });
      }
      continue;
    }

    // Simple assignment: x = expr
    m = line.match(/^(\w[\w\d_]*)\s*=\s*(.+)$/);
    if (m) {
      const lhs = m[1];
      const rhs = m[2].replace(/;$/, '').trim();
      const rpn = toRPN(tokenizeExpression(rhs));
      const { instr: seq, result } = rpnToTAC(rpn, alloc);
      instr.push(...seq);
      instr.push({ op: 'ASSIGN', dst: lhs, src: result });
      continue;
    }

    // Function call side-effect
    m = line.match(/^(?:\w[\w\d_]*)?\s*\(.*\)\s*;?$/);
    if (m) {
      instr.push({ op: 'CALL', name: line.replace(/\s*;?$/, '') });
      continue;
    }
  }

  // Close any open blocks conservatively
  while (stack.length) {
    const top = stack.pop();
    if (top.kind === 'if') {
      instr.push({ op: 'LABEL', name: top.endLabel || top.falseLabel });
    } else if (top.kind === 'while' || top.kind === 'for') {
      if (top.kind === 'for' && top.incText) {
        emitAssignmentOrExpr(top.incText, alloc, instr);
      }
      instr.push({ op: 'GOTO', target: top.start });
      instr.push({ op: 'LABEL', name: top.end });
    }
  }

  return instr;
}

function generateTAC(code, language) {
  const lang = normalizeLanguage(language);
  // We parse for future extension; currently we mainly use text-based deterministic lowering
  const alloc = makeAllocators();
  const instructions = generateFromCodeText(code || '', alloc);
  return { language: lang, instructions, meta: alloc.counters() };
}

module.exports = { generateTAC };
