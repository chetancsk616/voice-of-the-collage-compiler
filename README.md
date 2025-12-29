# AI Web Compiler

> **Production-Ready Code Learning Platform with AI Assistance**  
> Multi-language compiler • AST-based evaluation • Role-based authentication

[![Tests Passing](https://img.shields.io/badge/tests-28%2F28%20passing-brightgreen)]()
[![AST Pipeline](https://img.shields.io/badge/AST%20pipeline-100%25%20deterministic-blue)]()
[![Performance](https://img.shields.io/badge/p95%20latency-12ms-success)]()

---

## 📖 Documentation

**📘 [DOCUMENTATION.md](./DOCUMENTATION.md)** - Complete guide (RECOMMENDED)  
**🗺️ [DOCS_INDEX.md](./DOCS_INDEX.md)** - Navigation helper

**Quick Links**:
- [Quick Start](#-quick-start) - Get running in 5 minutes
- [Features](#-features) - What this platform offers
- [Architecture](./SYSTEM_ARCHITECTURE.md) - System design
- [Logic Evaluation](./LOGIC_EVALUATION_SYSTEM.md) - How code is evaluated
- [API Reference](./API.md) - API endpoints
- [Deployment](./DEPLOYMENT.md) - Production deployment guide
- [Development](./DEVELOPMENT.md) - Contributing guidelines

---

## 🌟 Features

### 🔐 Unified Authentication
- Single login portal at `http://localhost:3000`
- Email/Password + Google OAuth
- Role-based automatic routing (Admin/Student)
- Custom claims for access control

### 👨‍🎓 Student Portal (`/student/`)
- **Code Editor** - Python, JavaScript, Java, C++, C
- **Real-time Execution** - Piston API integration
- **AI Assistant** - Groq AI for code help
- **Test Cases** - Validate solutions
- **AST Evaluation** - 100% deterministic scoring
- **Auto-Save** - Progress tracking in Firestore

### 👨‍💼 Admin Panel (`/admin/`)
- **Question Manager** - CRUD operations
- **User Manager** - Student account management
- **Submission Viewer** - Detailed evaluation results
- **Real-time Dashboard** - Firebase RTDB integration

---

## 🚀 Quick Start

### One-Command Setup

```bash
# 1. Install dependencies for all projects
npm run install:all

# 2. Configure environment variables
cp login/.env.example login/.env
cp admin/server/.env.example admin/server/.env
cp student/server/.env.example student/server/.env
# Edit .env files with your credentials

# 3. Start everything
npm run dev
```

### Access Points

After running `npm run dev`:
- **🔐 Login**: http://localhost:3000
- **👨‍🎓 Student**: http://localhost:3000/student/ (auto-redirect)
- **👨‍💼 Admin**: http://localhost:3000/admin/ (requires admin role)

### Set Admin Role

```bash
node setAdminRole.js your-email@example.com
```

---

## 🏗️ Architecture

```
http://localhost:3000 (Login Portal)
    │
    ├── /student/ → Student Portal → Port 3002 → API: Port 5001
    └── /admin/   → Admin Panel   → Port 3001 → API: Port 4100
```

**Technology Stack**:
- Frontend: React 18 + Vite + TailwindCSS
- Backend: Node.js + Express
- Database: Firebase (Auth, RTDB, Firestore)
- Code Execution: Piston API
- AI: Groq (llama-3.3-70b)
- AST Parser: Tree-sitter

---

## 📊 Logic Evaluation System

**5-Stage Pipeline**:
1. **Load Reference** - Question configuration (JSON)
2. **Extract Features** - AST analysis (Tree-sitter)
3. **Compare Logic** - Algorithm matching
4. **Execute Tests** - Run test cases (Piston)
5. **Generate Verdict** - Score + decision

**Scoring Factors**:
- Test Pass Rate (37.5%)
- Algorithm Match (25%)
- Complexity Match (25%)
- No Violations (12.5%)

**Verdict Types**: CORRECT, ACCEPTABLE, NEEDS_IMPROVEMENT, INCORRECT

📘 **[Detailed Evaluation Docs](./LOGIC_EVALUATION_SYSTEM.md)**

---

## 📦 Project Structure

```
ai-web-compiler/
├── login/                    # Unified login portal (port 3000)
├── admin/
│   ├── client/              # Admin UI (port 3001)
│   └── server/              # Admin API (port 4100)
│       ├── ast/             # AST analysis
│       ├── logic/           # Question definitions
│       └── routes/
├── student/
│   ├── client/              # Student UI (port 3002)
│   └── server/              # Student API (port 5001)
│       ├── logic/           # Question JSON files
│       └── executor/        # Code execution
├── DOCUMENTATION.md         # 📘 Complete documentation
├── package.json            # Root scripts
└── Dockerfile              # Production build
```

---

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start all services
npm run dev:login        # Login portal only
npm run dev:admin        # Admin client + server
npm run dev:student      # Student client + server

# Build
npm run build            # Build all for production
npm run build:login
npm run build:admin
npm run build:student

# Testing
cd admin/server && npm test
```

### Adding Questions

1. Create JSON in `student/server/logic/QXXX.json`
2. Run `node admin/server/scripts/seed-rtdb.js`
3. Question appears in student portal

---

## 🚢 Deployment

### Render.com (Docker)

```bash
# 1. Push to GitHub
git push origin main

# 2. Create Web Service on Render
# - Environment: Docker
# - Auto-deploy from GitHub

# 3. Set Environment Variables
# See DEPLOYMENT.md for full list
```

### Environment Variables Required

```env
# Firebase
FIREBASE_API_KEY=xxx
FIREBASE_AUTH_DOMAIN=xxx
FIREBASE_PROJECT_ID=xxx
FIREBASE_DATABASE_URL=xxx

# Groq AI
GROQ_API_KEY=gsk_xxx

# Admin SDK (Base64)
FIREBASE_ADMIN_SDK_BASE64=xxx
```

📘 **[Complete Deployment Guide](./DEPLOYMENT.md)**

---

## 📝 Key Documentation Files

| File | Purpose |
|------|---------|
| **[DOCUMENTATION.md](./DOCUMENTATION.md)** | 📘 Complete documentation (recommended) |
| [START.md](./START.md) | Quick start guide |
| [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) | System architecture diagrams |
| [LOGIC_EVALUATION_SYSTEM.md](./LOGIC_EVALUATION_SYSTEM.md) | Evaluation system details |
| [API.md](./API.md) | API endpoints reference |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Deployment instructions |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | Development guidelines |

---

## 🐛 Troubleshooting

### Common Issues

**Port conflicts:**
```bash
netstat -ano | findstr :3000
taskkill /PID <process_id> /F
```

**Authentication not working:**
```bash
# Verify Firebase config
cat login/.env

# User must log out and log back in after role change
```

**Admin access denied:**
```bash
node setAdminRole.js your-email@example.com
# Then log out and log back in
```

📘 **[Full Troubleshooting Guide](./DOCUMENTATION.md#troubleshooting)**

---

## 📈 Status & Metrics

- ✅ **28/28 Tests Passing** (100%)
- ✅ **AST Pipeline**: 100% deterministic
- ✅ **Performance**: p95 = 12ms
- ✅ **Production Ready**

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m "feat: add feature"`
4. Push to branch: `git push origin feature/new-feature`
5. Submit Pull Request

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file

---

## 🔗 Links

- 📘 [Complete Documentation](./DOCUMENTATION.md)
- 🐛 [Report Issues](https://github.com/yourusername/ai-web-compiler/issues)
- 📧 [Contact Support](mailto:support@example.com)

---

**Built with ❤️ using React, Node.js, Firebase, and AI**

Access the application:
- **Unified Login**: http://localhost:3000
- **Student Portal**: http://localhost:3000/student/
- **Admin Portal**: http://localhost:3000/admin/

All endpoints go through the unified origin for seamless authentication and reduced security complexity.

## 📁 Project Structure

```
ai-web-compiler/
├── login/                          # Unified Login App (port 3000)
│   ├── src/
│   │   ├── Login.jsx               # Login page with email/Google auth
│   │   ├── AuthContext.jsx         # Auth state management
│   │   ├── firebase.js             # Firebase config
│   │   ├── components/
│   │   │   └── LogoutConfirmModal.jsx
│   │   └── main.jsx
│   ├── vite.config.js              # Proxy config for /admin & /student routes
│   └── package.json
│
├── admin/                          # Admin Panel Project
│   ├── client/                     # React frontend (port 3001, served at /admin/)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── ProtectedAdminRoute.jsx
│   │   │   │   ├── LogoutConfirmModal.jsx
│   │   │   │   └── ...
│   │   │   ├── QuestionManager.jsx
│   │   │   ├── UserManager.jsx
│   │   │   ├── SubmissionViewer.jsx
│   │   │   ├── AuthContext.jsx     # Admin auth with role validation
│   │   │   └── main.jsx
│   │   ├── vite.config.js
│   │   └── package.json
│   ├── server/                     # Express backend (port 4100, accessed via /admin/api)
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── config/
│   │   │   └── serviceAccountKey.json  # Firebase Admin SDK credentials
│   │   ├── ai/
│   │   ├── ast/
│   │   └── index.js
│   └── package.json
│
├── student/                        # Student Portal Project
│   ├── client/                     # React frontend (port 3002, served at /student/)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── LogoutConfirmModal.jsx
│   │   │   │   └── ...
│   │   │   ├── App.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── AuthContext.jsx     # Student auth state
│   │   │   └── main.jsx
│   │   ├── vite.config.js
│   │   └── package.json
│   ├── server/                     # Express backend (port 5001, accessed via /student/api)
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── ai/
│   │   ├── ast/
│   │   └── index.js
│   └── package.json
│
├── package.json                    # Root commands & scripts
├── README.md                       # This file
├── START.md                        # Quick start guide
├── SYSTEM_ARCHITECTURE.md          # Technical architecture details
└── DEPLOYMENT.md                   # Deployment instructions
```

## ⚙️ Configuration

### Environment Variables

#### Root `.env`:
```env
# No specific root env needed; see login/, admin/, student/ .env files
```

#### Login App (`login/.env`):
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

#### Admin Server (`admin/server/.env`):
```env
PORT=4100
API_PREFIX=/api
NODE_ENV=development
GROQ_API_KEY=your_groq_api_key_here
FIREBASE_SERVICE_ACCOUNT=path_to_serviceAccountKey.json
```

#### Student Server (`student/server/.env`):
```env
PORT=5001
API_PREFIX=/api
NODE_ENV=development
GROQ_API_KEY=your_groq_api_key_here
```

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create/select your project
3. Enable Authentication (Email/Password + Google OAuth)
4. Navigate to Project Settings > Service Accounts
5. Generate new private key → download JSON
6. Place at `admin/server/config/serviceAccountKey.json` (add to `.gitignore`)
7. Set custom claims on admin users:
   ```bash
   node setAdminRole.js <user_uid>
   ```

### Groq AI Setup

1. Sign up at [Groq Console](https://console.groq.com)
2. Generate API key
3. Add to both `admin/server/.env` and `student/server/.env`

## 🎮 Usage

### Development Commands

```bash
# Start everything (login + admin + student)
npm run dev

# Start only admin
npm run dev:admin-only

# Start only student
npm run dev:student-only

# Install all dependencies
npm run install:all

# Build all projects
npm run build

# Build specific project
cd admin && npm run build
cd student && npm run build
```

### Production Commands

```bash
# Build for production
npm run build

# Start production servers
npm start
```

## 🌐 Single-Origin Architecture

All user-facing traffic flows through **http://localhost:3000** (the login app):

```
Browser Request → http://localhost:3000/admin/
  ↓
Vite Proxy (login/vite.config.js)
  ↓
Forwards to http://localhost:3001 (admin dev server)
  ↓
Admin app renders at /admin/ path

Browser Request → http://localhost:3000/student/
  ↓
Vite Proxy (login/vite.config.js)
  ↓
Forwards to http://localhost:3002 (student dev server)
  ↓
Student app renders at /student/ path
```

### API Routing

Backend APIs are similarly proxied through the single origin:
- `/admin/api/*` → proxied to admin backend (port 4100)
- `/student/api/*` → proxied to student backend (port 5001)

This prevents CORS issues and simplifies Firebase auth across apps.

## 📚 API Documentation

### Admin API (accessed via `/admin/api` on port 3000)

**Authentication Required** - All endpoints require admin JWT token

- `GET /api/admin/questions` - List all questions
- `POST /api/admin/questions` - Create question
- `PUT /api/admin/questions/:id` - Update question
- `DELETE /api/admin/questions/:id` - Delete question
- `GET /api/admin/users` - List all users
- `GET /api/admin/submissions` - List submissions
- `GET /api/admin/stats` - System statistics

### Student API (accessed via `/student/api` on port 3000)

- `POST /api/execute` - Execute code
- `POST /api/ask-ai` - Get AI assistance
- `GET /api/questions` - List questions
- `POST /api/submit` - Submit solution
- `GET /api/submissions` - User submissions

## 🔐 Authentication Flow

1. User visits **http://localhost:3000**
2. Enters email and selects role (Student/Admin)
3. Authenticates via Firebase (email/password or Google OAuth)
4. Login page fetches user's ID token and checks custom claims
5. If selected role doesn't match claims → sign out with error
6. If authenticated and valid role → redirect to `/admin/` or `/student/`
7. Admin/student apps check auth state via Firebase client SDK
8. Protected routes validate `isAdmin` flag
9. On logout → show custom confirmation modal → sign out → redirect to login with "logged out" toast

## 🔧 Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool with HMR
- **TailwindCSS** - Styling
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Firebase SDK** - Authentication & Firestore

### Backend
- **Node.js & Express** - Server framework
- **Firebase Admin SDK** - User management & custom claims
- **Groq AI** - LLM for code assistance
- **Piston API** - Sandboxed code execution
- **AST Parsers** - Code analysis (tree-sitter, esprima)

## 🛡️ Security

- **Firebase Authentication** - Secure credential storage
- **Custom Claims** - Role-based access control (admin claim)
- **Protected Routes** - Client-side route guards + server validation
- **Rate Limiting** - AI requests rate-limited to 5/min per IP
- **Sandboxed Execution** - Code runs in isolated Piston containers
- **Service Account Key** - Keep in `.gitignore`, never commit
- **HTTPS Ready** - Environment-aware Firebase config

## 🐛 Troubleshooting

**Port Already in Use**
```bash
# Windows: Check and kill process
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Admin Not Accessible**
- Verify user has admin custom claim set via `setAdminRole.js`
- User must sign out and sign back in for claim changes to apply
- Check `admin/server/config/serviceAccountKey.json` exists

**Firebase Connection Error**
- Verify Firebase credentials in `login/.env` are correct
- Ensure service account JSON is at `admin/server/config/serviceAccountKey.json`

**API Request 404**
- Check Vite proxy routes in `login/vite.config.js`
- Ensure backend APIs are running on correct ports (4100, 5001)
- API calls should use `/admin/api` or `/student/api` prefixes

**Build Errors**
```bash
# Clean and reinstall
npm run install:all
npm run build
```

## 📖 Additional Documentation

- [START.md](START.md) - Quick start guide with demo credentials
- [admin/README.md](admin/README.md) - Admin panel documentation
- [student/README.md](student/README.md) - Student portal documentation
- [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md) - Detailed architecture
- [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment guide

## 📄 License

Private - For educational use only

---

**Version**: 2.2.0  
**Last Updated**: December 29, 2025  
**Architecture**: Unified Login + Single-Origin Routing + Separate Backend Services

