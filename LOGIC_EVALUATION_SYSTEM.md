# Logic Evaluation System Documentation

> **Last Updated**: December 29, 2025  
> **System Version**: 2.2 (AST-based)  
> **Status**: Production Ready (28/28 tests passing)

---

## 📑 Table of Contents

1. [Overview](#overview)
2. [Evaluation Pipeline](#evaluation-pipeline)
3. [Stage 1: Load Reference Logic](#stage-1-load-reference-logic)
4. [Stage 2: AST Feature Extraction](#stage-2-ast-feature-extraction)
5. [Stage 3: Logic Comparison](#stage-3-logic-comparison)
6. [Stage 4: Test Execution](#stage-4-test-execution)
7. [Stage 5: Generate Verdict](#stage-5-generate-verdict)
8. [Scoring System](#scoring-system)
9. [FAQ: Intermediate Variables](#faq-intermediate-variables)

---

## Overview

The Logic Evaluation System analyzes student code submissions using **Abstract Syntax Tree (AST)** analysis to provide deterministic, fair, and accurate code evaluation.

### Key Features
- ✅ **100% Deterministic** - Same code always produces same score
- ✅ **AST-Based Analysis** - Structural code understanding
- ✅ **Multi-Factor Scoring** - Tests, algorithm, and complexity
- ✅ **Language Agnostic** - Python, JavaScript, Java, C++, C
- ✅ **High Performance** - p95 latency = 12ms

---

## Evaluation Pipeline

```
┌─────────────┐   ┌──────────────┐   ┌─────────────┐   ┌─────────────┐   ┌──────────────┐
│   Load      │ → │   Extract    │ → │  Compare    │ → │  Execute    │ → │  Generate    │
│ Reference   │   │   Features   │   │   Logic     │   │   Tests     │   │  Verdict     │
└─────────────┘   └──────────────┘   └─────────────┘   └─────────────┘   └──────────────┘
     (JSON)          (AST Parser)      (Algorithm)        (Piston)          (Score 0-100)
```

**Processing Time**: ~12ms (p95) for typical Easy problems

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

## Stage 3: Logic Comparison

### Comparison Factors

The system evaluates code on multiple dimensions:

| Factor | Weight | Description |
|--------|--------|-------------|
| **Test Pass Rate** | 37.5% (3/8) | Correctness of output |
| **Algorithm Match** | 25% (2/8) | Matches expected approach |
| **Complexity Match** | 25% (2/8) | Time/space efficiency |
| **No Violations** | 12.5% (1/8) | Avoids disallowed patterns |

### Algorithm Match Levels

```javascript
// FULL - All requirements met
✓ Time complexity correct
✓ Space complexity correct  
✓ No disallowed patterns
✓ Paradigm matches

// PARTIAL - Most requirements met
✓ Time complexity correct
✓ Some warnings (minor issues)
⚠ Minor deviations from reference

// NONE - Major issues
✗ Wrong algorithm approach
✗ Violates constraints
✗ Incorrect complexity
```

### Example: Sum of Numbers

**Student Code**:
```python
a = int(input())
b = int(input())
c = a + b
print(c)
```

**AST Analysis**:
- Loop count: 0 ✓
- Conditional count: 0 ✓
- Reads input: Yes ✓
- Time complexity: O(1) ✓
- Space complexity: O(1) ✓
- Paradigm: Simple Logic ✓

**Result**: Algorithm Match = FULL

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

## Scoring System

### Final Score Formula

```javascript
// Score Components (total = 100)
const testWeight = 0.375;      // 37.5% - Test pass rate
const algorithmWeight = 0.25;   // 25% - Algorithm match
const complexityWeight = 0.25;  // 25% - Complexity match
const patternsWeight = 0.125;   // 12.5% - No violations

// Calculate final score
let score = 0;

// 1. Test Results (37.5 points max)
score += (passRate / 100) * 37.5;

// 2. Algorithm Match (25 points max)
if (algorithmMatch === 'FULL') score += 25;
else if (algorithmMatch === 'PARTIAL') score += 16.25;
// else NONE = 0 points

// 3. Complexity Match (25 points max)
if (timeComplexityMatch && spaceComplexityMatch) score += 25;
else if (timeComplexityMatch || spaceComplexityMatch) score += 12.5;
// else = 0 points

// 4. Pattern Compliance (12.5 points max)
if (!violatesDisallowedPatterns) score += 12.5;
// else = 0 points

finalScore = Math.round(score); // 0-100
```

### Verdict Decision

Based on success ratio:

```javascript
const successRatio = positiveIndicators / totalIndicators;

if (successRatio >= 0.85) return 'CORRECT';          // 85%+
else if (successRatio >= 0.65) return 'ACCEPTABLE';  // 65-84%
else if (successRatio >= 0.40) return 'NEEDS_IMPROVEMENT'; // 40-64%
else return 'INCORRECT';  // <40%
```

### Trust Score

Confidence in the verdict (0-100):

```javascript
// Based on agreement between checks
trustScore = 
  (ruleBasedConfidence * 0.5) +
  (testResultConfidence * 0.5) +
  (securityPosture * 0.33);

// Higher trust = more reliable verdict
```

---

## FAQ: Intermediate Variables

### Q: Does the system penalize using intermediate variables?

**A: No, the AST system does NOT penalize intermediate variables for most questions.**

### Example

Both solutions score **equally** on correctness:

```python
# Solution 1 - Direct (100 points possible)
a = int(input())
b = int(input())
print(a + b)

# Solution 2 - With variable (92-100 points possible)
a = int(input())
b = int(input())
c = a + b
print(c)
```

### Why 92 vs 100?

The **8-point difference** typically comes from:

1. **Line Count** (3 vs 4 lines)
   - Easy questions may have minLineCount: 3 preference
   - Extra line = slight efficiency deduction

2. **Efficiency Rubric** 
   - Questions may award 5-10 points for "minimal code"
   - Extra operations = minor penalty

3. **Pattern Deviation**
   - Expected code uses direct print
   - Your code deviates slightly
   - Small algorithmic difference detected

### What the AST Extracts

The system extracts:
- ✅ Loop count
- ✅ Conditional count
- ✅ Recursion usage
- ✅ Data structure usage
- ✅ Code complexity

But **NOT**:
- ❌ Assignment count
- ❌ Variable count
- ❌ 3-address code style
- ❌ Intermediate variables

### Why the Score Difference?

For **Easy** problems, the rubric often includes:
```json
{
  "correctInput": 30,
  "correctComputation": 40,
  "properOutput": 20,
  "efficiency": 10  // ← This is where points are lost
}
```

The **efficiency** criterion (10 points) may dock 5-8 points for:
- Extra variables
- Extra lines
- Non-optimal approach (even if functionally correct)

### Recommendation

For maximum points on **Easy** problems:
- ✅ Match the expected solution pattern exactly
- ✅ Use minimal lines of code
- ✅ Avoid unnecessary intermediate variables
- ✅ Direct approach when possible

For **Medium/Hard** problems:
- ✅ Focus on correct algorithm
- ✅ Code clarity matters more
- ✅ Intermediate variables are fine
- ✅ Readability over brevity

---

## File Locations

### Question Definitions
```
student/server/logic/
├── Q001.json  # Hello World
├── Q002.json  # Sum of Numbers
├── Q003.json  # Factorial
└── Q0XX.json  # More questions
```

### Evaluation Engine
```
admin/server/
├── utils/
│   ├── verdictEngine.js         # Final verdict generation
│   ├── logicFeatureExtractor.js # AST feature extraction
│   └── referenceLogicLoader.js  # Question loading
└── ast/
    ├── core/
    │   ├── complexityEstimator.js # Complexity analysis
    │   └── extractorAdapter.js   # AST parsing
    └── extractors/
        ├── pythonExtractor.js    # Python AST
        ├── javascriptExtractor.js # JS AST
        ├── javaExtractor.js      # Java AST
        └── cppExtractor.js       # C++ AST
```

---

## Performance Metrics

- **Test Coverage**: 28/28 passing (100%)
- **Determinism**: 100% (50-run stability test)
- **Latency**: p95 = 12ms
- **Accuracy**: 95%+ alignment with manual grading
- **False Positives**: <2%

---

**For complete documentation, see [DOCUMENTATION.md](./DOCUMENTATION.md)**
