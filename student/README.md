# AI Compiler - Student Portal

The student portal is part of the unified AI Web Compiler system accessible via a single login portal.

## Access

**Start the entire application** with:
```bash
npm run dev
```

Then visit **http://localhost:3000** to sign in. After authentication as a student, you'll be redirected to the student portal at **http://localhost:3000/student/**.

## Features

- **Code Editor** - Write and edit code in multiple languages (Python, JavaScript, Java, C++, C)
- **Real-time Compilation** - Execute code and see results instantly using Piston API
- **AI Assistant** - Get help with errors and debugging using Groq AI
- **Problem Solving** - Access programming questions and submit solutions
- **Syntax Highlighting** - Enhanced code readability with language-specific themes
- **Progress Tracking** - View submission history and results

## Project Structure

```
student/
├── client/                     # React frontend (Vite + React + TailwindCSS)
│   ├── src/
│   │   ├── App.jsx             # Main app component with logout modal
│   │   ├── Home.jsx            # Home page / editor interface
│   │   ├── Editor.jsx          # Code editor component
│   │   ├── QuestionList.jsx    # Available problems list
│   │   ├── AuthContext.jsx     # Student authentication state
│   │   ├── components/
│   │   │   ├── EditorHeader.jsx    # Header with logout button
│   │   │   ├── LogoutConfirmModal.jsx  # Custom logout confirmation
│   │   │   └── ...
│   │   ├── api.js              # API client with /student/api prefix
│   │   ├── firebase.js         # Firebase configuration
│   │   └── main.jsx
│   └── vite.config.js          # Dev server config (port 3002, base /student/)
│
├── server/                     # Express backend (port 5001, accessed via /student/api)
│   ├── routes/                 # API endpoints (execute, questions, submit, etc.)
│   ├── middleware/             # Auth middleware, error handling
│   ├── executor/               # Piston API integration for code execution
│   ├── ai/                     # Groq AI client for assistance
│   ├── ast/                    # Code analysis and parsing
│   └── index.js                # Express server
│
├── package.json
└── .env
```

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Firebase account for authentication
- Groq API key (for AI assistance)

## Setup

1. **Install dependencies** (from root):
   ```bash
   npm run install:all
   ```

2. **Configure environment**:
   
   **student/server/.env**
   ```env
   PORT=5001
   GROQ_API_KEY=your_groq_api_key_here
   NODE_ENV=development
   PISTON_API_URL=https://emkc.org/api/v2/piston
   ```

3. **Start development**:
   ```bash
   npm run dev
   ```
   Then visit **http://localhost:3000** and sign in as a student.

## Single-Origin Architecture

The student portal is served as a sub-route under the unified login origin:

```
Browser → http://localhost:3000/student/
  ↓
Vite Proxy (login app)
  ↓
Forwards to http://localhost:3002 (student dev server)
  ↓
Student client renders with /student/ base path
```

All API calls are similarly routed:
- `POST /student/api/execute` → proxied to student backend (5001)
- Response handled with path rewrite for seamless integration

## API Endpoints

All endpoints require student authentication (Firebase token validation):3. **Configure environment variables**:
   - Copy `.env.example` to `.env`
   - Add your Firebase credentials (base64 encoded service account JSON)
   - Add your Groq API key

4. **Set up Firebase**:
   - Go to Firebase Console
   - Create/select your project
   - Download service account JSON
   - Base64 encode it and add to `.env`

## Running the Application

### Development Mode (Both servers)
```bash
npm run dev
```
This runs both client (port 3002) and server (port 5001) concurrently.

### Run Client Only
```bash
npm run dev:client
```
Runs on http://localhost:3002

### Run Server Only
```bash
npm run dev:server
```
Runs on http://localhost:5001

### Production
```bash
# Build client
npm run build:client

# Start server
npm start
```

## Configuration

### Client (client/.env or import.meta.env)
- `VITE_API_URL`: Backend API URL (default: http://localhost:5001)
- `VITE_FIREBASE_CONFIG`: Firebase web config

### Server (.env in root)
- `PORT`: Server port (default: 5001)
- `API_PREFIX`: API route prefix (default: /api)
- `GROQ_API_KEY`: Your Groq API key
- `FIREBASE_SERVICE_ACCOUNT_BASE64`: Base64 encoded Firebase admin credentials
- `PISTON_API_URL`: Piston API endpoint for code execution

## API Endpoints

### Code Execution
- `POST /api/execute` - Execute code with Piston API
- `POST /api/execute-debug` - Execute with enhanced diagnostics

### AI Assistance
- `POST /api/ask-ai` - Get AI help with code/errors

### Questions
- `GET /api/questions` - List available questions
- `GET /api/questions/:id` - Get specific question

### Submissions
- `POST /api/submit` - Submit solution for evaluation
- `GET /api/submissions` - Get user submissions

## Supported Languages

- Python (3.x)
- JavaScript (Node.js)
- Java
- C++
- C

## Tech Stack

### Frontend
- React 18
- Vite
- TailwindCSS
- React Router
- Axios
- React Syntax Highlighter
- Firebase (Authentication)

### Backend
- Node.js + Express
- Firebase Admin SDK
- Groq AI API (Llama models)
- Piston API (Code execution)
- AST-based code analysis
- Esprima (JavaScript AST)

## Features in Detail

### Code Editor
- Multi-language support
- Syntax highlighting
- Line numbers
- Auto-indentation
- Tab support

### AI Assistant
- Error explanation
- Code suggestions
- Debugging help
- Learning tips

### Code Execution
- Sandboxed execution via Piston API
- Support for stdin input
- Capture stdout/stderr
- Exit code tracking

### Problem Solving
- Browse questions by difficulty
- Submit solutions
- Get instant feedback
- View submission history

## Development

### Client Development
```bash
cd client
npm run dev
```

### Server Development
```bash
cd server
npm run dev
```

### Run Tests
```bash
cd server
npm test
```

## License

Private - For educational use only
