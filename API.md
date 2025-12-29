# API Documentation

Complete API reference for AI Web Compiler.

## 📡 Base URLs

- **Admin API**: `http://localhost:4001/api` (Development)
- **Student API**: `http://localhost:5001/api` (Development)

## 🔐 Authentication

All admin endpoints require JWT authentication via Firebase.

### Getting Auth Token

```javascript
// Frontend (React)
import { useAuth } from './AuthContext';

const { user, getIdToken } = useAuth();
const token = await getIdToken();

// Make authenticated request
fetch('/api/admin/questions', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 🔴 Admin API (Port 4001)

All endpoints require admin authentication.

### Questions

#### List All Questions
```http
GET /api/admin/questions
```

**Query Parameters:**
- `search` (optional) - Search term for title/description
- `difficulty` (optional) - Filter by difficulty (easy|medium|hard)
- `tag` (optional) - Filter by tag

**Response:**
```json
{
  "success": true,
  "questions": [
    {
      "id": "Q001",
      "title": "Two Sum",
      "description": "Find two numbers that add up to target",
      "difficulty": "easy",
      "tags": ["arrays", "hash-table"],
      "testCases": [...],
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 50
}
```

#### Get Single Question
```http
GET /api/admin/questions/:id
```

**Response:**
```json
{
  "success": true,
  "question": {
    "id": "Q001",
    "title": "Two Sum",
    "description": "...",
    "difficulty": "easy",
    "tags": ["arrays"],
    "testCases": [
      {
        "input": "[2,7,11,15], target=9",
        "expectedOutput": "[0,1]"
      }
    ],
    "hints": ["Use a hash map"],
    "starterCode": {
      "python": "def two_sum(nums, target):\n    pass",
      "javascript": "function twoSum(nums, target) {\n    // code\n}"
    }
  }
}
```

#### Create Question
```http
POST /api/admin/questions
```

**Request Body:**
```json
{
  "id": "Q099",
  "title": "New Problem",
  "description": "Problem description",
  "difficulty": "medium",
  "tags": ["arrays", "sorting"],
  "testCases": [
    {
      "input": "test input",
      "expectedOutput": "expected output"
    }
  ],
  "hints": ["Hint 1", "Hint 2"],
  "starterCode": {
    "python": "def solution():\n    pass",
    "javascript": "function solution() {\n    // code\n}"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Question created successfully",
  "question": { ... }
}
```

#### Update Question
```http
PUT /api/admin/questions/:id
```

**Request Body:** Same as Create Question

**Response:**
```json
{
  "success": true,
  "message": "Question updated successfully",
  "question": { ... }
}
```

#### Delete Question
```http
DELETE /api/admin/questions/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Question deleted successfully"
}
```

### Users

#### List All Users
```http
GET /api/admin/users
```

**Query Parameters:**
- `role` (optional) - Filter by role (admin|student)
- `limit` (optional) - Number of results (default: 100)

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "uid": "firebase-user-id",
      "email": "user@example.com",
      "displayName": "John Doe",
      "role": "student",
      "isAdmin": false,
      "createdAt": "2025-01-01T00:00:00Z",
      "lastLogin": "2025-01-15T12:00:00Z"
    }
  ],
  "total": 150
}
```

#### Grant Admin Access
```http
POST /api/admin/users/:uid/grant-admin
```

**Response:**
```json
{
  "success": true,
  "message": "Admin access granted successfully"
}
```

#### Revoke Admin Access
```http
POST /api/admin/users/:uid/revoke-admin
```

**Response:**
```json
{
  "success": true,
  "message": "Admin access revoked successfully"
}
```

### Submissions

#### List All Submissions
```http
GET /api/admin/submissions
```

**Query Parameters:**
- `userId` (optional) - Filter by user ID
- `questionId` (optional) - Filter by question ID
- `status` (optional) - Filter by status (passed|failed|pending)
- `limit` (optional) - Number of results
- `offset` (optional) - Pagination offset

**Response:**
```json
{
  "success": true,
  "submissions": [
    {
      "id": "sub_123",
      "userId": "user_id",
      "questionId": "Q001",
      "code": "def two_sum...",
      "language": "python",
      "status": "passed",
      "score": 100,
      "testsPassed": 10,
      "testsTotal": 10,
      "submittedAt": "2025-01-15T12:00:00Z"
    }
  ],
  "total": 500
}
```

#### Get Single Submission
```http
GET /api/admin/submissions/:id
```

**Response:**
```json
{
  "success": true,
  "submission": {
    "id": "sub_123",
    "userId": "user_id",
    "questionId": "Q001",
    "code": "...",
    "language": "python",
    "status": "passed",
    "testResults": [
      {
        "testCase": 1,
        "passed": true,
        "input": "[2,7,11,15], 9",
        "expectedOutput": "[0,1]",
        "actualOutput": "[0,1]",
        "executionTime": 15
      }
    ],
    "submittedAt": "2025-01-15T12:00:00Z"
  }
}
```

### Statistics

#### Get System Stats
```http
GET /api/admin/stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 150,
    "totalQuestions": 50,
    "totalSubmissions": 1250,
    "activeUsers24h": 45,
    "submissionsToday": 120,
    "passRate": 0.75,
    "popularQuestions": [
      {
        "id": "Q001",
        "title": "Two Sum",
        "attempts": 450
      }
    ]
  }
}
```

---

## 🔵 Student API (Port 5001)

### Code Execution

#### Execute Code
```http
POST /api/execute
```

**Request Body:**
```json
{
  "language": "python",
  "code": "print('Hello World')",
  "stdin": ""
}
```

**Response:**
```json
{
  "stdout": "Hello World\n",
  "stderr": "",
  "exitCode": 0,
  "executionTime": 45
}
```

#### Execute with Debug Info
```http
POST /api/execute-debug
```

**Request Body:** Same as `/api/execute`

**Response:** Same as `/api/execute` with additional debug info

### AI Assistant

#### Ask AI for Help
```http
POST /api/ask-ai
```

**Rate Limit:** 5 requests per minute per IP

**Request Body:**
```json
{
  "prompt": "Explain this error",
  "code": "def hello():\nprint('hello')",
  "stderr": "IndentationError: expected an indented block",
  "language": "python",
  "model": "llama-3.3-70b-versatile"
}
```

**Response:**
```json
{
  "response": "The error occurs because...",
  "model": "llama-3.3-70b-versatile",
  "tokensUsed": 150
}
```

**Available Models:**
- `llama-3.3-70b-versatile` (default)
- `llama-3.1-70b-versatile`
- `mixtral-8x7b-32768`

### Questions

#### List Questions
```http
GET /api/questions
```

**Query Parameters:**
- `difficulty` (optional) - Filter by difficulty
- `tag` (optional) - Filter by tag
- `limit` (optional) - Number of results

**Response:**
```json
{
  "success": true,
  "questions": [
    {
      "id": "Q001",
      "title": "Two Sum",
      "description": "...",
      "difficulty": "easy",
      "tags": ["arrays"],
      "acceptanceRate": 0.45
    }
  ]
}
```

#### Get Question Details
```http
GET /api/questions/:id
```

**Response:**
```json
{
  "success": true,
  "question": {
    "id": "Q001",
    "title": "Two Sum",
    "description": "...",
    "difficulty": "easy",
    "tags": ["arrays"],
    "hints": ["Use a hash map"],
    "starterCode": {
      "python": "def two_sum(nums, target):\n    pass",
      "javascript": "function twoSum(nums, target) {\n    // code\n}"
    },
    "examples": [
      {
        "input": "[2,7,11,15], 9",
        "output": "[0,1]",
        "explanation": "nums[0] + nums[1] == 9"
      }
    ]
  }
}
```

### Submissions

#### Submit Solution
```http
POST /api/submit
```

**Authentication Required**

**Request Body:**
```json
{
  "questionId": "Q001",
  "code": "def two_sum(nums, target):\n    ...",
  "language": "python"
}
```

**Response:**
```json
{
  "success": true,
  "submissionId": "sub_123",
  "status": "passed",
  "score": 100,
  "testsPassed": 10,
  "testsTotal": 10,
  "executionTime": 125,
  "testResults": [
    {
      "testCase": 1,
      "passed": true,
      "executionTime": 12
    }
  ]
}
```

#### Get User Submissions
```http
GET /api/submissions
```

**Authentication Required**

**Query Parameters:**
- `questionId` (optional) - Filter by question
- `status` (optional) - Filter by status
- `limit` (optional) - Number of results

**Response:**
```json
{
  "success": true,
  "submissions": [
    {
      "id": "sub_123",
      "questionId": "Q001",
      "language": "python",
      "status": "passed",
      "score": 100,
      "submittedAt": "2025-01-15T12:00:00Z"
    }
  ]
}
```

---

## 🔒 Error Responses

All endpoints may return these standard errors:

### 400 Bad Request
```json
{
  "error": "Invalid request body",
  "details": "Missing required field: language"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Admin privileges required"
}
```

### 404 Not Found
```json
{
  "error": "Question not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 45
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Database connection failed"
}
```

---

## 📝 Notes

- All timestamps are in ISO 8601 format (UTC)
- Authentication tokens expire after 1 hour
- Rate limits are per IP address
- Maximum request body size: 1MB
- Supported languages: Python, JavaScript, Java, C++, C

---

**Last Updated**: December 29, 2025