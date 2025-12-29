# AI Web Compiler - Complete Documentation

> **Last Updated**: December 29, 2025  
> **Version**: 2.2  
> **Status**: Production Ready

---

## 📑 Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Quick Start](#quick-start)
4. [Features](#features)
5. [Authentication System](#authentication-system)
6. [Logic Evaluation System](#logic-evaluation-system)
7. [Development Guide](#development-guide)
8. [Deployment](#deployment)
9. [API Reference](#api-reference)
10. [Troubleshooting](#troubleshooting)

---

## Overview

AI Web Compiler is a comprehensive web-based code compiler and learning platform featuring:
- **Unified Authentication** - Single login portal with role-based routing
- **Multi-Language Support** - Python, JavaScript, Java, C++, C
- **AI-Powered Assistance** - Groq AI for code debugging and suggestions
- **AST-Based Evaluation** - Advanced code analysis using Abstract Syntax Trees
- **Admin Dashboard** - Complete management interface for questions and submissions
- **Student Portal** - Interactive coding environment with real-time execution

### Key Statistics
- ✅ **28/28 Tests Passing** (100%)
- ✅ **AST Pipeline Performance**: p95 = 12ms
- ✅ **100% Deterministic** Evaluation (50-run stability verified)
- 🎯 **Production Ready** with canary rollout capability

---

## System Architecture

### High-Level Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    http://localhost:3000                     │
│                    UNIFIED LOGIN PORTAL                       │
│                   (Firebase Authentication)                   │
└────────────┬─────────────────────────────────┬───────────────┘
             │                                 │
     ┌───────▼────────┐              ┌────────▼───────┐
     │  ADMIN PORTAL  │              │ STUDENT PORTAL │
     │  /admin/       │              │  /student/     │
     │  Port 3001     │              │   Port 3002    │
     └───────┬────────┘              └────────┬───────┘
             │                                │
     ┌───────▼────────┐              ┌────────▼───────┐
     │ ADMIN SERVER   │              │ STUDENT SERVER │
     │  Port 4100     │              │   Port 5001    │
     │ /admin/api/*   │              │ /student/api/* │
     └────────────────┘              └────────────────┘
```

### Technology Stack

#### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **TailwindCSS** - Styling
- **React Router** - Client-side routing
- **Firebase SDK** - Authentication

#### Backend
- **Node.js + Express** - Server framework
- **Piston API** - Code execution engine
- **Tree-sitter** - AST parsing for code analysis
- **Groq AI** - AI-powered code assistance
- **Firebase Admin** - User management and custom claims

#### Database & Storage
- **Firebase Realtime Database** - Question storage
- **Firestore** - User submissions and progress tracking
- **Firebase Authentication** - User management

---

## Quick Start

### Prerequisites
```bash
Node.js >= 18.0.0
npm >= 9.0.0
Firebase account with Admin SDK
Groq API key
```

### One-Command Installation

```bash
# 1. Install all dependencies
npm run install:all

# 2. Configure environment variables (see below)

# 3. Start everything
npm run dev
```

### Environment Configuration

#### Login App (`login/.env`)
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

#### Admin Server (`admin/server/.env`)
```env
PORT=4100
GROQ_API_KEY=gsk_your_groq_api_key
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
GOOGLE_APPLICATION_CREDENTIALS=../../aicompiler-45c59-firebase-adminsdk.json
```

#### Student Server (`student/server/.env`)
```env
PORT=5001
GROQ_API_KEY=gsk_your_groq_api_key
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
GOOGLE_APPLICATION_CREDENTIALS=../../aicompiler-45c59-firebase-adminsdk.json
```

### Access URLs

- **Login Portal**: http://localhost:3000
- **Student App**: http://localhost:3000/student/ (auto-redirect after login)
- **Admin Panel**: http://localhost:3000/admin/ (requires admin role)

---

## Features

### 1. Unified Login Portal

**Location**: `http://localhost:3000`

- ✅ Email/Password authentication
- ✅ Google OAuth integration
- ✅ Role-based automatic routing
- ✅ Persistent session management
- ✅ Custom logout confirmation modal

**User Flow**:
1. User visits `http://localhost:3000`
2. Selects role (Student/Admin) from dropdown
3. Signs in with email/password or Google
4. Automatically redirected to appropriate portal:
   - Students → `/student/`
   - Admins → `/admin/`

### 2. Student Portal

**Features**:
- 📝 **Code Editor** - Multi-language support with syntax highlighting
- ▶️ **Run Code** - Execute code with custom input via Piston API
- 🧪 **Test Cases** - Validate against visible test cases
- 📊 **Submit for Evaluation** - Full AST-based logic evaluation
- 🤖 **AI Assistant** - Get code explanations and debugging help
- 💾 **Auto-Save** - Progress saved to Firestore
- 🔐 **Security** - Copy/paste restrictions, fullscreen enforcement

**Supported Languages**:
- Python 3
- JavaScript (Node.js)
- Java
- C++
- C

### 3. Admin Panel

**Features**:
- 📋 **Question Manager** - Create, edit, delete programming questions
- 👥 **User Manager** - View and manage student accounts
- 📊 **Submission Viewer** - Review student submissions with detailed verdicts
- 🔧 **Question Configuration** - Set test cases, rubrics, and constraints
- 🎯 **Real-time Updates** - Firebase Realtime Database integration

### 4. AI-Powered Code Assistance

**Capabilities**:
- 🔍 **Error Explanation** - Detailed analysis of code errors
- 💡 **Code Optimization** - Suggestions for performance improvements
- 📝 **Code Comments** - Automatic documentation generation
- 🎓 **Learning Support** - Hints and educational guidance

**Models Used**:
- Primary: `llama-3.3-70b-versatile`
- Fallback: `mixtral-8x7b-32768`

---

## Authentication System

### Firebase Authentication Integration

The system uses Firebase Authentication with custom claims for role-based access control.

#### Authentication Flow

```javascript
// 1. User signs in
await signInWithEmailAndPassword(auth, email, password);

// 2. Custom claims loaded
const idTokenResult = await getIdTokenResult(user, true);
const isAdmin = idTokenResult.claims.admin === true;

// 3. Route based on role
if (isAdmin) {
  window.location.href = '/admin/';
} else {
  window.location.href = '/student/';
}
```

#### Protected Routes

**Admin Routes** - Require `admin: true` custom claim:
- `/admin/` - Question Manager
- `/admin/questions` - Question Management
- `/admin/submissions` - Submission Viewer
- `/admin/users` - User Management

**Student Routes** - Require authenticated user:
- `/student/` - Home page with question list
- `/student/codespace` - Code editor and execution environment

#### Setting Admin Role

```bash
# Run the admin role script
node setAdminRole.js your-email@example.com
```

### Session Management

- **Persistent Sessions** - Users remain logged in across browser restarts
- **Logout Confirmation** - Custom modal prevents accidental logout
- **Token Refresh** - Automatic token renewal for long sessions
- **Cross-Tab Sync** - Firebase auth state synced across browser tabs

---

## Logic Evaluation System

The Logic Evaluation System uses AST (Abstract Syntax Tree) analysis to provide deterministic, accurate code evaluation.

### Evaluation Pipeline (5 Stages)

```
┌─────────────┐   ┌──────────────┐   ┌─────────────┐   ┌─────────────┐   ┌──────────────┐
│   Load      │ → │   Extract    │ → │  Compare    │ → │  Execute    │ → │  Generate    │
│ Reference   │   │   Features   │   │   Logic     │   │   Tests     │   │  Verdict     │
└─────────────┘   └──────────────┘   └─────────────┘   └─────────────┘   └──────────────┘
```

### Stage 1: Load Reference Logic

Each question has a JSON configuration file defining:
```json
{
  "questionId": "Q002",
  "title": "Sum of Numbers",
  "expectedAlgorithm": "Basic Addition",
  "allowedApproaches": ["direct_addition"],
  "disallowedPatterns": ["hardcoding"],
  "expectedTimeComplexity": "O(1)",
  "testCases": [...],
  "rubric": {
    "correctInput": 30,
    "correctComputation": 40,
    "properOutput": 20,
    "efficiency": 10
  }
}
```

### Stage 2: Extract Features (AST Analysis)

Uses Tree-sitter to parse code and extract features:
- Loop count and nesting depth
- Conditional statements
- Function calls and recursion
- Data structure usage (hash maps, queues, stacks)
- Code complexity metrics

**Example Python AST Extraction**:
```javascript
// Extracts from Python code
{
  loopCount: 2,
  nestedLoopCount: 1,
  conditionalCount: 3,
  usesHashMap: true,
  lineCount: 25,
  characterCount: 450
}
```

### Stage 3: Compare Logic

Compares student code features against reference:
- **Algorithm Match**: FULL, PARTIAL, or NONE
- **Complexity Match**: Validates time/space complexity
- **Pattern Violations**: Checks for disallowed patterns

### Stage 4: Execute Tests

Runs code against test cases using Piston API:
- Visible test cases (shown to students)
- Hidden test cases (for final evaluation)
- Execution time and memory tracking
- Error and output capture

### Stage 5: Generate Verdict

Combines all analyses into a comprehensive verdict based on deterministic scoring rules.

```javascript
{
  decision: "CORRECT" | "ACCEPTABLE" | "NEEDS_IMPROVEMENT" | "INCORRECT",
  score: 100,  // 0-100 (deterministic scoring)
  trustScore: 95,  // Confidence in verdict
  testResults: {
    passRate: 100,
    totalTests: 4,
    passedTests: 4
  },
  issues: [
    {
      source: "rule-based",
      severity: "warning",
      type: "efficiency",
      description: "Code uses extra variables"
    }
  ]
}
```

### Scoring Rubric

The scoring system weights multiple factors:

| Factor | Weight | Description |
|--------|--------|-------------|
| Test Pass Rate | 3/8 (37.5%) | Correctness of output |
| Algorithm Match | 2/8 (25%) | Matches expected approach |
| Complexity Match | 2/8 (25%) | Meets efficiency requirements |
| No Violations | 1/8 (12.5%) | Avoids disallowed patterns |

**Verdict Thresholds**:
- **CORRECT**: ≥85% success ratio
- **ACCEPTABLE**: ≥65% success ratio
- **NEEDS_IMPROVEMENT**: ≥40% success ratio
- **INCORRECT**: <40% success ratio

### AST vs 3-Address Code

**Question**: Does the system penalize intermediate variables?

**Answer**: No, for most questions. The AST system extracts:
- Loop count
- Conditional count
- Data structure usage
- Code complexity

But it does NOT count:
- Assignment statements
- Number of variables
- 3-address code style

**Example**: Both solutions score equally for correctness:
```python
# Direct approach (100 points)
a = int(input())
b = int(input())
print(a + b)

# With intermediate variable (92-100 points depending on level)
a = int(input())
b = int(input())
c = a + b
print(c)
```

The 8-point difference typically comes from:
- **Line count** (3 lines vs 4 lines on "Easy" questions)
- **Efficiency rubric** (questions may prefer minimal code)
- **Pattern matching** (slight deviation from reference solution)

---

## Development Guide

### Project Structure

```
ai-web-compiler/
├── login/              # Unified login portal (port 3000)
│   ├── src/
│   │   ├── Login.jsx   # Main login component
│   │   ├── firebase.js # Firebase config
│   │   └── AuthContext.jsx
│   └── package.json
│
├── admin/
│   ├── client/         # Admin frontend (port 3001)
│   │   └── src/
│   │       ├── QuestionManager.jsx
│   │       ├── SubmissionViewer.jsx
│   │       └── UserManager.jsx
│   └── server/         # Admin backend (port 4100)
│       ├── routes/
│       ├── utils/
│       └── ast/        # AST analysis modules
│
├── student/
│   ├── client/         # Student frontend (port 3002)
│   │   └── src/
│   │       ├── App.jsx
│   │       ├── Home.jsx
│   │       └── components/
│   └── server/         # Student backend (port 5001)
│       ├── routes/
│       ├── logic/      # Question definitions (Q001-Q0XX.json)
│       └── executor/
│
└── package.json        # Root package with scripts
```

### Development Scripts

```bash
# Install all dependencies
npm run install:all

# Start all services (recommended)
npm run dev

# Individual services
npm run dev:login     # Login portal only
npm run dev:admin     # Admin client + server
npm run dev:student   # Student client + server

# Build for production
npm run build         # Build all
npm run build:login
npm run build:admin
npm run build:student
```

### Adding a New Question

1. **Create Question JSON** in `student/server/logic/`:

```json
{
  "questionId": "Q025",
  "title": "Binary Search",
  "difficulty": "Medium",
  "expectedAlgorithm": "Binary Search",
  "algorithmDescription": "Divide and conquer search in sorted array",
  "allowedApproaches": ["iterative_binary_search", "recursive_binary_search"],
  "disallowedPatterns": ["linear_search", "built_in_search"],
  "expectedTimeComplexity": "O(log n)",
  "expectedSpaceComplexity": "O(1)",
  "testCases": [
    {
      "input": "5\n1 2 3 4 5\n3",
      "expectedOutput": "2",
      "description": "Find index of 3"
    }
  ],
  "sampleCode": "# Python solution...",
  "rubric": {
    "correctOutput": 40,
    "algorithmImplementation": 30,
    "efficiency": 20,
    "codeClarity": 10
  }
}
```

2. **Upload to Firebase Realtime Database**:

```bash
cd admin/server
node scripts/seed-rtdb.js
```

3. **Question appears** in student portal automatically

### Testing

```bash
# Run all tests
cd admin/server
npm test

# Run specific test suites
npm test -- ast-extractor
npm test -- complexity-estimator
npm test -- ast-pipeline

# Coverage report
npm test -- --coverage
```

### Code Style

The project uses:
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Pre-commit hooks

```bash
# Format code
npm run format

# Lint code
npm run lint
```

---

## Deployment

### Render.com Deployment

The application is configured for Render with Docker.

#### Prerequisites
- Render.com account
- Firebase project
- Groq API key

#### Deployment Steps

1. **Push to GitHub**:
```bash
git add .
git commit -m "Deploy to Render"
git push origin main
```

2. **Create Web Service on Render**:
   - Environment: Docker
   - Build Command: (handled by Dockerfile)
   - Start Command: (handled by Dockerfile)

3. **Configure Environment Variables**:
```env
# Firebase
FIREBASE_API_KEY=xxx
FIREBASE_AUTH_DOMAIN=xxx
FIREBASE_PROJECT_ID=xxx
FIREBASE_DATABASE_URL=xxx
FIREBASE_STORAGE_BUCKET=xxx
FIREBASE_MESSAGING_SENDER_ID=xxx
FIREBASE_APP_ID=xxx

# Groq
GROQ_API_KEY=gsk_xxx

# Admin Service Account (Base64 encoded)
FIREBASE_ADMIN_SDK_BASE64=xxx

# Ports
PORT=3000
```

4. **Deploy**: Render auto-deploys on git push

#### Docker Configuration

The `Dockerfile` includes:
- Multi-stage build for optimization
- All three applications (login, admin, student)
- Nginx reverse proxy configuration
- Production-optimized Node.js setup

### Firebase Setup

1. **Enable Authentication**:
   - Email/Password provider
   - Google OAuth provider

2. **Create Realtime Database**:
   - Set rules for admin-only writes
   - Student read-only access to questions

3. **Create Firestore Database**:
   - Collections: `users/{uid}/submissions`, `users/{uid}/questions`

4. **Download Service Account Key**:
   - Project Settings → Service Accounts
   - Generate new private key
   - Save as `aicompiler-xxx-firebase-adminsdk.json`

---

## API Reference

### Student API (`/student/api`)

#### Execute Code
```http
POST /student/api/execute
Content-Type: application/json

{
  "language": "python3",
  "code": "print('Hello World')",
  "stdin": ""
}

Response:
{
  "stdout": "Hello World\n",
  "stderr": "",
  "exitCode": 0,
  "timeMs": 45
}
```

#### Submit Code for Evaluation
```http
POST /student/api/submit
Authorization: Bearer <firebase-token>
Content-Type: application/json

{
  "userId": "abc123",
  "questionId": "Q002",
  "language": "python3",
  "code": "a=int(input())\nb=int(input())\nprint(a+b)",
  "securityEvents": []
}

Response:
{
  "success": true,
  "data": {
    "finalVerdict": {
      "decision": "CORRECT",
      "score": 100,
      "trustScore": 98
    },
    "testResults": {
      "passRate": 100,
      "totalTests": 4,
      "passedTests": 4
    },
    "issues": []
  }
}
```

#### Ask AI
```http
POST /student/api/ask
Content-Type: application/json

{
  "prompt": "Explain this error",
  "code": "print(undefined_var)",
  "stderr": "NameError: name 'undefined_var' is not defined"
}

Response:
{
  "text": "The error occurs because...",
  "model": "llama-3.3-70b-versatile"
}
```

### Admin API (`/admin/api`)

#### Create Question
```http
POST /admin/api/questions
Authorization: Bearer <firebase-token>
Content-Type: application/json

{
  "questionId": "Q025",
  "title": "Binary Search",
  "difficulty": "Medium",
  ...
}
```

#### Get All Submissions
```http
GET /admin/api/submissions
Authorization: Bearer <firebase-token>

Response:
[
  {
    "userId": "abc123",
    "questionId": "Q002",
    "verdict": "CORRECT",
    "score": 95,
    "submittedAt": "2025-12-22T10:30:00Z"
  }
]
```

#### Manage Users
```http
GET /admin/api/users
Authorization: Bearer <firebase-token>

Response:
[
  {
    "uid": "abc123",
    "email": "student@example.com",
    "displayName": "John Doe",
    "isAdmin": false,
    "createdAt": "2025-12-01T00:00:00Z"
  }
]
```

---

## Troubleshooting

### Common Issues

#### 1. "Cannot find module" errors
```bash
# Solution: Reinstall dependencies
npm run install:all
```

#### 2. Firebase authentication not working
```bash
# Check environment variables
cat login/.env

# Verify Firebase config
# Make sure all VITE_FIREBASE_* variables are set
```

#### 3. Piston API errors (code execution fails)
```bash
# Check if Piston API is accessible
curl https://emkc.org/api/v2/piston/runtimes

# If down, wait for service to recover
# No action needed - errors are temporary
```

#### 4. Admin role not working
```bash
# Set admin custom claim
node setAdminRole.js your-email@example.com

# Verify claim
# User must log out and log back in
```

#### 5. Student routing issues (URL flickering)
```bash
# Fixed in latest version
# Make sure you have useLocation and useNavigate hooks
# See: student/client/src/App.jsx and main.jsx
```

#### 6. Ports already in use
```bash
# Find and kill processes
netstat -ano | findstr :3000
taskkill /PID <process_id> /F

# Or change ports in package.json scripts
```

### Debug Mode

Enable detailed logging:

```javascript
// In any component
console.log('[Debug]', data);

// Firebase debug
localStorage.setItem('debug', 'firebase:*');
```

### Performance Monitoring

Check evaluation performance:
```javascript
// In admin/server/utils/verdictEngine.js
console.time('Evaluation');
// ... evaluation code
console.timeEnd('Evaluation');
```

---

## Contributing

### Development Workflow

1. Create feature branch: `git checkout -b feature/new-feature`
2. Make changes and test locally: `npm run dev`
3. Run tests: `npm test`
4. Commit: `git commit -m "feat: add new feature"`
5. Push: `git push origin feature/new-feature`
6. Create Pull Request

### Commit Message Format

```
type(scope): subject

body (optional)

footer (optional)
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

---

## License

MIT License - See LICENSE file for details

---

## Support

For issues and questions:
- 📧 Email: support@example.com
- 🐛 Issues: https://github.com/yourusername/ai-web-compiler/issues
- 📚 Docs: https://github.com/yourusername/ai-web-compiler/wiki

---

**Built with ❤️ using React, Node.js, Firebase, and AI**
