# Reference Logic Loader

Local file-based reference logic system for instructor-defined algorithm validation.

## 📁 Directory Structure

```
server/
├── logic/
│   ├── Q001.json    # Reference logic for question 1
│   ├── Q002.json    # Reference logic for question 2
│   ├── Q003.json    # Reference logic for question 3
│   └── index.json   # Index of all questions (optional)
└── utils/
    └── referenceLogicLoader.js  # Loader module
```

## 📄 JSON Format

Each question's reference logic file must contain:

```json
{
  "questionId": "Q001",
  "expectedAlgorithm": "Prefix Sum",
  "allowedApproaches": ["prefix_sum"],
  "expectedTimeComplexity": "O(n)",
  "disallowedPatterns": ["hardcoding", "nested_loops"],
  "referenceCode": "for i in range(n): sum += arr[i]"
}
```

### Required Fields

- `questionId` (string): Unique identifier (e.g., "Q001")
- `expectedAlgorithm` (string): Name of expected algorithm
- `allowedApproaches` (array): List of valid approaches
- `expectedTimeComplexity` (string): Expected time complexity
- `disallowedPatterns` (array): Patterns to flag as incorrect

### Optional Fields

- `referenceCode` (string): Example reference implementation
- `hints` (array): Hints for students
- `commonMistakes` (array): Common errors to check for

## 🚀 Usage

### Basic Usage

```javascript
const { getReferenceLogic } = require('./utils/referenceLogicLoader');

// Load by question ID string
const logic = getReferenceLogic('Q001');

// Load by numeric ID (converted to Q00X format)
const logic2 = getReferenceLogic(1);  // Same as 'Q001'
const logic3 = getReferenceLogic('1');  // Same as 'Q001'

if (logic) {
  console.log('Expected Algorithm:', logic.expectedAlgorithm);
  console.log('Time Complexity:', logic.expectedTimeComplexity);
  console.log('Allowed Approaches:', logic.allowedApproaches);
}
```

### Preload All Logic (Server Startup)

```javascript
const { preloadAllLogic } = require('./utils/referenceLogicLoader');

// Preload all reference logic into memory at server startup
const count = preloadAllLogic();
console.log(`Loaded ${count} reference logic files`);
```

### Get All Available Questions

```javascript
const { getAllQuestionIds } = require('./utils/referenceLogicLoader');

const questionIds = getAllQuestionIds();
console.log('Available questions:', questionIds);
// Output: ['Q001', 'Q002', 'Q003']
```

### Clear Cache (for testing)

```javascript
const { clearCache } = require('./utils/referenceLogicLoader');

clearCache();
console.log('Cache cleared - next loads will read from disk');
```

## 🔧 Integration Example

### In Express Route

```javascript
const { getReferenceLogic } = require('./utils/referenceLogicLoader');

app.post('/api/validate-logic', (req, res) => {
  const { questionId, userCode } = req.body;
  
  // Get reference logic
  const refLogic = getReferenceLogic(questionId);
  
  if (!refLogic) {
    return res.status(404).json({ error: 'Question logic not found' });
  }
  
  // Perform validation (example)
  const validation = {
    expectedAlgorithm: refLogic.expectedAlgorithm,
    timeComplexity: refLogic.expectedTimeComplexity,
    allowedApproaches: refLogic.allowedApproaches,
    // Add your validation logic here
  };
  
  res.json(validation);
});
```

## 📝 Adding New Questions

1. Create a new JSON file in `server/logic/` directory:
   ```
   server/logic/Q004.json
   ```

2. Add the reference logic:
   ```json
   {
     "questionId": "Q004",
     "expectedAlgorithm": "Dynamic Programming",
     "allowedApproaches": ["memoization", "tabulation"],
     "expectedTimeComplexity": "O(n)",
     "disallowedPatterns": ["recursion_without_memo", "nested_loops"],
     "referenceCode": "dp[i] = dp[i-1] + dp[i-2]"
   }
   ```

3. (Optional) Update `server/logic/index.json`:
   ```json
   {
     "questions": [
       ...
       {
         "questionId": "Q004",
         "title": "Fibonacci",
         "file": "Q004.json"
       }
     ]
   }
   ```

4. Reference logic is automatically available via `getReferenceLogic('Q004')`

## 🧪 Testing

Run the test file:

```bash
node server/utils/test-referenceLogicLoader.js
```

Expected output:
```
=== Testing Reference Logic Loader ===

Test 1: Load Q001
[ReferenceLogicLoader] Successfully loaded logic for Q001
Result: { questionId: 'Q001', ... }

Test 2: Load question 2 (numeric)
[ReferenceLogicLoader] Successfully loaded logic for Q002
Result: { questionId: 'Q002', ... }

...
```

## ⚡ Performance

- **In-memory caching**: Logic files are cached after first load
- **Fast lookups**: O(1) cache retrieval
- **Lazy loading**: Files loaded on-demand
- **Preload option**: Load all at startup for best performance

## 🔒 Security Notes

- ✅ Local file system only (no remote database)
- ✅ No user input in file paths (prevents path traversal)
- ✅ Validation ensures data integrity
- ✅ Read-only access to logic files
- ✅ No external dependencies (uses Node.js fs module only)

## 📊 Cache Statistics

The module maintains an in-memory cache:
- Cache is persistent across requests
- Cache cleared only on server restart or manual `clearCache()`
- Null results are NOT cached (allows retry on file creation)

## 🐛 Error Handling

The module handles:
- ✅ Missing files (returns null)
- ✅ Invalid JSON (returns null, logs error)
- ✅ Missing required fields (returns null, logs error)
- ✅ Invalid data types (returns null, logs error)

All errors are logged to console for debugging.

## 📦 Module Exports

```javascript
module.exports = {
  getReferenceLogic,    // Main function to get logic by ID
  clearCache,           // Clear in-memory cache
  preloadAllLogic,      // Load all logic files at once
  getAllQuestionIds     // Get list of available question IDs
};
```
