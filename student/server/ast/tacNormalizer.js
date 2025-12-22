// TAC Normalizer: canonicalize TAC for equivalence comparison
// - Renames variables to v1, v2, ... in first-occurrence order
// - Renames temps t? to t1, t2 order
// - Renames labels to L1, L2 order
// - Normalizes commutative BINOP (+, *) by sorting operands

const COMMUTATIVE = new Set(['+', '*', '&&', '||']);

function normalizeIdentifiers(instructions) {
  const varMap = new Map();
  const tempMap = new Map();
  const labelMap = new Map();
  let vCount = 0;
  let tCount = 0;
  let lCount = 0;

  function normVal(x) {
    if (x == null) return x;
    if (/^t\d+$/.test(x)) {
      if (!tempMap.has(x)) tempMap.set(x, `t${++tCount}`);
      return tempMap.get(x);
    }
    if (/^L[A-Za-z]*\d+$/.test(x)) {
      if (!labelMap.has(x)) labelMap.set(x, `L${++lCount}`);
      return labelMap.get(x);
    }
    if (/^\d+$/.test(x)) return x;
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(x)) {
      if (!varMap.has(x)) varMap.set(x, `v${++vCount}`);
      return varMap.get(x);
    }
    return x;
  }

  const out = [];
  for (const ins of instructions) {
    if (ins.op === 'BINOP') {
      let op = ins.operator;
      let a = normVal(ins.a);
      let b = normVal(ins.b);

      // Canonicalize relational direction: > -> <, >= -> <=
      if (op === '>' || op === '>=') {
        op = op === '>' ? '<' : '<=';
        [a, b] = [b, a];
      }

      // Normalize commutative ops by sorting operands
      if (COMMUTATIVE.has(op) && a > b) {
        [a, b] = [b, a];
      }

      out.push({ op: 'BINOP', dst: normVal(ins.dst), a, b, operator: op });
    } else if (ins.op === 'ASSIGN') {
      out.push({ op: 'ASSIGN', dst: normVal(ins.dst), src: normVal(ins.src) });
    } else if (ins.op === 'CJUMP') {
      out.push({ op: 'CJUMP', cond: normVal(ins.cond), ifTrue: normVal(ins.ifTrue), ifFalse: normVal(ins.ifFalse) });
    } else if (ins.op === 'LABEL') {
      out.push({ op: 'LABEL', name: normVal(ins.name) });
    } else if (ins.op === 'GOTO') {
      out.push({ op: 'GOTO', target: normVal(ins.target) });
    } else if (ins.op === 'RETURN') {
      out.push({ op: 'RETURN', src: normVal(ins.src) });
    } else if (ins.op === 'CALL') {
      out.push({ op: 'CALL', name: ins.name });
    } else {
      out.push({ ...ins });
    }
  }

  return out;
}

function stringifyTAC(instructions) {
  return instructions
    .map((ins) => {
      switch (ins.op) {
        case 'BINOP':
          return `BINOP ${ins.dst} = ${ins.a} ${ins.operator} ${ins.b}`;
        case 'ASSIGN':
          return `ASSIGN ${ins.dst} = ${ins.src}`;
        case 'CJUMP':
          return `CJUMP ${ins.cond} ? ${ins.ifTrue} : ${ins.ifFalse}`;
        case 'LABEL':
          return `LABEL ${ins.name}`;
        case 'GOTO':
          return `GOTO ${ins.target}`;
        case 'RETURN':
          return `RETURN ${ins.src ?? ''}`.trim();
        case 'CALL':
          return `CALL ${ins.name}`;
        default:
          return JSON.stringify(ins);
      }
    })
    .join('\n');
}

module.exports = { normalizeIdentifiers, stringifyTAC };
