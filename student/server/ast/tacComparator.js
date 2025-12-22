// TAC Comparator: deterministic equivalence and similarity metrics
// - Exact match on normalized linearized TAC
// - Similarity via line-level Jaccard and LCS length ratio

const { normalizeIdentifiers, stringifyTAC } = require('./tacNormalizer');

function lcs(a, b) {
  const m = a.length; const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

function compareTAC(aInstr, bInstr) {
  const A = normalizeIdentifiers(aInstr || []);
  const B = normalizeIdentifiers(bInstr || []);
  const aLines = stringifyTAC(A).split('\n');
  const bLines = stringifyTAC(B).split('\n');

  const setA = new Set(aLines);
  const setB = new Set(bLines);
  const inter = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  const jaccard = union.size === 0 ? 1 : inter.size / union.size;

  const lcsLen = lcs(aLines, bLines);
  const lcsRatio = (aLines.length + bLines.length) === 0 ? 1 : (2 * lcsLen) / (aLines.length + bLines.length);

  const similarity = Number(((jaccard * 0.5) + (lcsRatio * 0.5)).toFixed(4));
  const tacMatch = similarity === 1;

  // Mismatch reasons: list differing lines in A not in B and vice versa
  const missingInB = aLines.filter((ln) => !setB.has(ln));
  const missingInA = bLines.filter((ln) => !setA.has(ln));

  const mismatchReasons = [];
  if (missingInB.length) mismatchReasons.push({ side: 'studentOnly', count: missingInB.length, sample: missingInB.slice(0, 5) });
  if (missingInA.length) mismatchReasons.push({ side: 'referenceOnly', count: missingInA.length, sample: missingInA.slice(0, 5) });

  return { tacMatch, similarity, mismatchReasons, aLines, bLines };
}

module.exports = { compareTAC };
