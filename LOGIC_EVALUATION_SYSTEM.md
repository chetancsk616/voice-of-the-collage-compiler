# Logic Evaluation System Documentation

## Overview
The logic evaluation system analyzes student code submissions and compares them against reference solutions to determine code quality, algorithm correctness, and complexity efficiency.

---

## System Architecture

### Evaluation Pipeline (5 Stages)

```
1. Load Reference Logic → 2. Extract Code Features → 3. TAC Logic Compare → 4. Execute Tests → 5. Generate Verdict
```

---

## Stage 1: Load Reference Logic

### Input Structure
```javascript
// Reference logic JSON (e.g., Q002.json for "Sum of Numbers")
{
  "questionId": "Q002",
  "title": "Sum of Numbers",
  "difficulty": "Easy",  // Easy, Medium, or Hard
  "expectedAlgorithm": "Basic Addition",
  "algorithmDescription": "Read two integers and compute their arithmetic sum",
  "allowedApproaches": ["direct_addition", "arithmetic_operation"],
  "disallowedPatterns": ["hardcoding", "ignoring_input"],
  "expectedTimeComplexity": "O(1)",
  "expectedSpaceComplexity": "O(1)",
  "paradigm": "Simple Logic",
  "constraints": {
    "minLineCount": 3,
    "maxLineCount": 10,
    "shouldReadInput": true,
    "shouldUseLoops": false,
    "shouldUseRecursion": false
  },
  "testCases": [
    {
      "input": "5\\n3",
      "expectedOutput": "8",
      "description": "Basic addition: 5 + 3 = 8"
    }
  ]
}
```

---

## Stage 2: Extract Code Features

### Student Code Example (Python)
```python
a = int(input())
b = int(input())
c = a+b
print(c)
```

### Extracted Features
```javascript
{
  "loopCount": 0,                    // No loops detected
  "nestedLoopCount": 0,              // No nested loops
  "conditionalCount": 0,             // No if statements
  "recursionDetected": false,        // No recursive calls
  "usesSorting": false,              // No sorting operations
  "usesHashMap": false,              // No hash maps/dictionaries used
  "usesStack": false,                // No stack operations
  "useQueue": false,                 // No queue operations
  "arrayManipulation": false,        // No array operations
  "inputDependentLogic": true,       // Uses input() - reads data
  "hardcodingDetected": false,       // No hardcoded values
  "paradigm": "Simple Logic",        // Classification
  "estimatedTimeComplexity": "O(1)", // No loops → constant time
  "estimatedSpaceComplexity": "O(1)", // No data structures → constant space
  "lineCount": 4                     // 4 lines of code
}
```

### Feature Extraction Process
1. **AST Parsing**: Code is parsed into Abstract Syntax Tree
2. **Pattern Detection**: Identifies loops, conditions, function calls
3. **Complexity Estimation**: Analyzes loops and recursion for time/space complexity
4. **Paradigm Classification**: Categorizes approach (Simple Logic, Iterative, Recursive, etc.)

---

## Stage 3: TAC Logic Comparison (Primary)

The PRIMARY logic evaluation is deterministic TAC equivalence:

- AST parse → TAC generation → TAC normalization → TAC comparison
- No AI heuristics. No runtime-based logic judging.
- Outputs:
  - `tacMatch` (boolean)
  - `similarityScore` (0–1)
  - `mismatchReasons` (deterministic, line-based)

Logic score is TAC-only: `logicScore = round(similarityScore * 100)`.

### Comparison Process (secondary feature checks retained for reporting)

```javascript
function compareLogic(studentFeatures, referenceLogic) {
  const comparison = {
    matched: true,
    issues: [],        // High/Medium severity problems
    warnings: [],      // Low severity issues
    successes: [],     // What the code does well
    logicScore: 0,      // Set from TAC only
    algorithmMatch: 'FULL'  // FULL, PARTIAL, or NONE
  };

  // 1. Check Time Complexity
  if (studentFeatures.estimatedTimeComplexity === referenceLogic.expectedTimeComplexity) {
    comparison.successes.push('✓ Time complexity matches: O(1)');
    comparison.timeComplexityMatch = true;
  } else {
    comparison.issues.push({
      severity: 'high',
      message: 'Time complexity mismatch'
    });
  }

  // 2. Check Space Complexity
  if (studentFeatures.estimatedSpaceComplexity === referenceLogic.expectedSpaceComplexity) {
    comparison.successes.push('✓ Space complexity matches: O(1)');
    comparison.spaceComplexityMatch = true;
  }

  // 3. Check Paradigm
  if (studentFeatures.paradigm === referenceLogic.paradigm) {
    comparison.successes.push('✓ Algorithm paradigm correct: Simple Logic');
  } else {
    comparison.warnings.push({
      severity: 'low',
      message: 'Paradigm mismatch'
    });
  }

  // 4. Check Constraints
  if (referenceLogic.constraints.shouldReadInput && studentFeatures.inputDependentLogic) {
    comparison.successes.push('✓ Input is properly read and processed');
  }

  if (referenceLogic.constraints.shouldUseLoops === false && studentFeatures.loopCount === 0) {
    comparison.successes.push('✓ No unnecessary loops (O(1) solution)');
  }

  // 5. Check Disallowed Patterns
  if (studentFeatures.hardcodingDetected) {
    comparison.issues.push({
      severity: 'high',
      message: 'Hardcoded values detected'
    });
  }

  // 6. Check Allowed Approaches
  for (const approach of referenceLogic.allowedApproaches) {
    if (approach.includes('addition') && studentFeatures.paradigm === 'Simple Logic') {
      comparison.successes.push('✓ Approach matches: arithmetic_operation');
    }
  }

  // TAC comparison happens in the evaluation engine and sets logicScore/tacMatch
  return comparison;
}
```

### Logic Score Calculation (TAC-only)

`logicScore = round(similarityScore * 100)` derived purely from TAC comparison.
Difficulty does not modify logicScore. Feature-based similarity is secondary and not used for scoring.

## Stage 3B: AST Intermediate Representation (Secondary)

### What is Stored in the Database
- Each question now supports **sampleCode** and **expectedCode** fields (optional but recommended)
- On load, the server builds an **intermediate representation (IR)** using the AST pipeline:
  - Language normalized (defaults to Python)
  - AST feature vector extracted (loops, recursion, DP, stacks/queues, paradigms, complexity hints)
  - Cached on the reference logic object as `sampleIntermediate` / `expectedIntermediate`

### AST Similarity Check
- AST similarity is for diagnostics only; it does not affect logicScore.
- Similarity thresholds are difficulty-aware:
  - Easy: high ≥ 0.50, warning ≥ 0.30
  - Medium: high ≥ 0.65, warning ≥ 0.45
  - Hard: high ≥ 0.75, warning ≥ 0.55
- Outcomes: annotations only (e.g., `ast_similarity_high`), no scoring impact.

### Sample/Expected Code Structure in Logic JSON
```json
{
  "questionId": "Q002",
  "title": "Sum of Numbers",
  "difficulty": "Easy",
  "expectedAlgorithm": "Basic Addition",
  "sampleLanguage": "python",
  "sampleCode": "a = int(input())\nb = int(input())\nprint(a+b)",
  "expectedCode": "a = int(input())\nb = int(input())\nprint(a+b)"
}
```

### Intermediate Representation Example (abridged)
```json
{
  "language": "python",
  "features": {
    "loopCount": 0,
    "nestedLoopCount": 0,
    "conditionalCount": 0,
    "recursionDetected": false,
    "usesSorting": false,
    "usesHashMap": false,
    "inputDependentLogic": true,
    "paradigm": "Simple Logic",
    "estimatedTimeComplexity": "O(1)",
    "estimatedSpaceComplexity": "O(1)"
  }
}
```


#### Current Formula (TAC)
```javascript
const logicScore = Math.round(similarityScore * 100); // TAC-only
```

#### Algorithm Match Level
```javascript
if (comparison.issues.length === 0) {
  comparison.algorithmMatch = 'FULL';
} else if (difficulty === 'easy' && comparison.issues.length <= 3 && criticalIssues.length === 0) {
  comparison.algorithmMatch = 'PARTIAL';  // Forgiving for easy
} else if (comparison.issues.length <= 2) {
  comparison.algorithmMatch = 'PARTIAL';
} else {
  comparison.algorithmMatch = 'NONE';
}
```

---

## Stage 4: Test Execution

### Test Results Structure
```javascript
{
  "totalTests": 16,      // Base tests (4) + Hidden tests (12)
  "passedTests": 16,     // All passed
  "failedTests": 0,
  "passRate": 100,       // 16/16 = 100%
  "testResults": [
    {
      "testNumber": 1,
      "input": "5\\n3",
      "expectedOutput": "8",
      "actualOutput": "8",
      "passed": true,
      "generated": false  // Base test case
    },
    {
      "testNumber": 5,
      "input": "7  \\n 2",  // Hidden test with whitespace
      "expectedOutput": "9",
      "actualOutput": "9",
      "passed": true,
      "generated": true   // Hidden test case
    }
  ]
}
```

---

## Stage 5: Generate Final Verdict

### Score Calculation Formula

```javascript
// Final Score = Tests (70%) + Logic (20%) + Complexity (10%)

const testMarks = Math.round(passRate * 0.7);      // 100% * 0.7 = 70/70
const logicMarks = Math.round(logicScore * 0.2);   // 78 * 0.2 = 15.6 → 16/20
const complexityMarks = logicComparison.complexityMarks; // 10/10

const finalScore = testMarks + logicMarks + complexityMarks;
// = 70 + 16 + 10 = 96/100
```

### Complexity Marks (Fixed)
```javascript
if (timeComplexityMatch && spaceComplexityMatch) {
  complexityMarks = 10;  // Perfect match
} else if (timeComplexityMatch || spaceComplexityMatch) {
  complexityMarks = 5;   // Partial match
} else {
  complexityMarks = 0;   // No match
}
```

---

## Example Walkthrough: "Sum of Numbers"

### Student Code
```python
a = int(input())
b = int(input())
c = a+b
print(c)
```

### Step-by-Step Evaluation

#### Step 1: Feature Extraction
```
✓ No loops (loopCount: 0)
✓ No recursion
✓ Reads input (inputDependentLogic: true)
✓ No hardcoding
✓ Estimated O(1) time
✓ Estimated O(1) space
✓ Paradigm: Simple Logic
✓ 4 lines of code
```

#### Step 2: TAC Logic Comparison
```
TAC:
  tacMatch: true
  similarityScore: 1.0
  mismatchReasons: []

Logic Score (TAC-only): round(1.0 * 100) = 100
```

#### Step 3: Test Execution
```
Base Tests: 4/4 passed
Hidden Tests: 12/12 passed
Total: 16/16 = 100%
```

#### Step 4: Final Score
```
Test Marks:    100% * 0.7 = 70/70
Logic Marks:   100 * 0.2 = 20/20  ← Should be this!
Complexity:    10/10

Total: 100/100 ✓
```

---

## Current Issue Analysis

### Why You're Getting 96/100

Based on your screenshot:
- Logic Score: 78/100 (not 100/100)
- Algorithm: PARTIAL (not FULL)

This means **something is triggering warnings or issues**.

### Possible Causes

1. **Warnings Being Detected**
   - Line count warnings (too short/too long)
   - Paradigm mismatch warnings
   - Constraint warnings

2. **Issues Being Detected**
   - Some pattern detection false positive

3. **Easy Mode Boost Not Applying**
   - Difficulty might not be "Easy" (check case sensitivity)
   - Boost conditions not fully met

---

## Debugging Your Evaluation

### Check Server Logs

Look for these log entries after evaluation:
```
Stage 3: Logic Comparison
  ✓ Time Complexity: O(1) matches O(1)
  ✓ Space Complexity: O(1) matches O(1)
  ✓ Detected Successes: [...]
  ⚠ Detected Warnings: [...]  ← CHECK THIS
  ✗ Detected Issues: [...]    ← CHECK THIS
  
  Logic Score: 78/100
  Algorithm Match: PARTIAL
  Difficulty: Easy
```

### Files to Check

1. **Reference Logic**: `student/server/logic/Q002.json`
   - Verify difficulty is "Easy" (case-sensitive)
   - Check constraints match your code

2. **Logic Comparison**: `student/server/utils/referenceLogicLoader.js` (line 660-720)
   - Add console logs to see what's being detected

3. **Feature Extraction**: `student/server/utils/logicFeatureExtractor.js`
   - Check if features are extracted correctly

---

## Expected Behavior for Easy Problems

### Grade Distribution

| Difficulty | Logic Score | Deductions |
|------------|-------------|------------|
| Easy       | 90-100      | Minimal - ignore warnings if code works |
| Medium     | 70-90       | Moderate - consider warnings |
| Hard       | 50-80       | Strict - all issues matter |

### Easy Problem Philosophy
"If the code works correctly and complexity is right, give full or near-full marks regardless of style preferences."

---

## Next Steps

1. **Enable Debug Logging**: Add logs to see exact comparison results
2. **Check Difficulty Case**: Ensure "Easy" not "easy" in reference logic
3. **Identify Warnings**: Find what warnings are being triggered
4. **Adjust Thresholds**: May need to be even more lenient for Easy

---

## File Locations

- Reference Logic: `student/server/logic/Q002.json`
- Feature Extractor: `student/server/utils/logicFeatureExtractor.js`
- Logic Comparator: `student/server/utils/referenceLogicLoader.js`
- Verdict Engine: `student/server/utils/verdictEngine.js`
- Main Evaluator: `student/server/index.js`
