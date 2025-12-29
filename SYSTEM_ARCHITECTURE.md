# System Architecture - Unified Login

## Complete System Diagram

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                          USER BROWSER                                     ║
└─────────────────────────────────────────────────────────────────────────┬─┘
                                      │
                        ┌─────────────▼─────────────┐
                        │                           │
                        │  http://localhost:3000    │
                        │                           │
                        │  ┌─────────────────────┐  │
                        │  │  UNIFIED LOGIN PAGE │  │
                        │  │                     │  │
                        │  │  📱 Dropdown Menu   │  │
                        │  │  ┌───────────────┐  │  │
                        │  │  │ Student ▼     │  │  │
                        │  │  │ Admin          │  │  │
                        │  │  └───────────────┘  │  │
                        │  │                     │  │
                        │  │  📧 Email Input     │  │
                        │  │  🔒 Password Input  │  │
                        │  │                     │  │
                        │  │  [Login Button]     │  │
                        │  │  [Google Sign-In]   │  │
                        │  └─────────────────────┘  │
                        │                           │
                        │  🔥 Firebase Auth         │
                        └──┬──────────────────┬───┘
                           │                  │
                ┌──────────┘                  └───────────┐
                │                                        │
    ┌───────────▼────────────┐          ┌───────────────▼──────────┐
    │                        │          │                          │
    │  http://localhost:3001 │          │  http://localhost:3002   │
    │                        │          │                          │
    │  ADMIN PORTAL          │          │  STUDENT PORTAL          │
    │  (Admin Auth)          │          │  (Student Auth)          │
    │                        │          │                          │
    │  Components:           │          │  Components:             │
    │  • Question Manager    │          │  • Code IDE              │
    │  • User Manager        │          │  • Problem List          │
    │  • Submission Viewer   │          │  • Submissions           │
    │  • Stats & Reports     │          │  • Progress Tracking     │
    │                        │          │                          │
    │  Backend: :4001        │          │  Backend: :5001          │
    │  API Endpoints:        │          │  API Endpoints:          │
    │  • /api/admin/*        │          │  • /api/student/*        │
    │  • /api/execute        │          │  • /api/execute          │
    │  • /api/users          │          │  • /api/submissions      │
    │  • /api/submissions    │          │  • /api/ai-assist        │
    │  • /api/stats          │          │                          │
    │                        │          │                          │
    │  Firestore/Files:      │          │  Firestore/Files:        │
    │  • questions.json      │          │  • submissions.json      │
    │  • users.json          │          │  • user_progress.json    │
    │  • submissions.json    │          │                          │
    └────────────────────────┘          └──────────────────────────┘
            │                                    │
            └─────────────┬──────────────────────┘
                          │
                          ▼
              ┌─────────────────────────┐
              │    FIREBASE SERVICES    │
              │  • Authentication      │
              │  • User Management     │
              │  • Custom Claims       │
              │  • Security Rules      │
              │  • Firestore (optional)│
              └─────────────────────────┘
                          │
                          ▼
              ┌─────────────────────────┐
              │   EXTERNAL SERVICES     │
              │  • Groq AI API          │
              │  • Piston Code Engine   │
              │  • Google OAuth         │
              └─────────────────────────┘
```

## Port Configuration

```
PORT 3000  →  LOGIN PAGE
              • Single entry point
              • User type selection
              • Authentication
              • Redirect logic
              
PORT 3001  →  ADMIN FRONTEND
              • Question management
              • User administration
              • Submission review
              • Analytics dashboard
              
PORT 3002  →  STUDENT FRONTEND
              • Problem solving
              • Code execution
              • AI assistance
              • Progress tracking
              
PORT 4001  →  ADMIN BACKEND API
              • Question CRUD
              • User management
              • Submission handling
              • Statistics & reports
              
PORT 5001  →  STUDENT BACKEND API
              • Code execution
              • AI assistance
              • Submission storage
              • Progress tracking
```

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    START                                    │
│              User visits :3000                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │ Sees Login Page with:  │
        │ • Student/Admin Select │
        │ • Email Field          │
        │ • Password Field       │
        │ • Google Sign-In       │
        └────────────┬───────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │ User Selects Type &    │
        │ Enters Credentials     │
        └────────────┬───────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │ Firebase signInWithEmailAndPass │
        │ or signInWithPopup (Google)     │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │ Firebase Validates Credentials │
        │ & Returns User Session         │
        └────────────┬───────────────────┘
                     │
                     ├─────────────────────┐
                     │                     │
                     ▼                     ▼
            ┌─────────────────┐  ┌──────────────────┐
            │  User is Admin? │  │ User is Student? │
            └────────┬────────┘  └────────┬─────────┘
                     │                    │
            YES ─────┘                    └───── NO
             │                                  │
             ▼                                  ▼
    ┌─────────────────────────┐    ┌──────────────────────┐
    │ Check Custom Claims     │    │ Redirect to:         │
    │ role: "admin"           │    │ http://localhost:3002│
    └──────────┬──────────────┘    └──────────────────────┘
               │
        YES ───┴─── role="admin"?
         │
         ▼
    ┌──────────────────────┐
    │ Redirect to:         │
    │ http://localhost:3001│
    └──────────────────────┘
         │
         ▼
    ┌──────────────────┐
    │ User at Portal   │
    │ Authenticated    │
    │ & Authorized     │
    └──────────────────┘
```

## File Organization

```
ai-web-compiler/
│
├── 🆕 login/                    ← NEW: Unified Login App
│   ├── src/
│   │   ├── Login.jsx           ← Main component (dropdown, auth form)
│   │   ├── AuthContext.jsx     ← Auth state & user management
│   │   ├── firebase.js         ← Firebase config
│   │   ├── main.jsx            ← Entry point
│   │   ├── index.css           ← Tailwind styles
│   │   └── components/         ← (future: any helper components)
│   ├── public/                 ← Static assets
│   ├── index.html              ← Main HTML template
│   ├── package.json            ← Dependencies for login app
│   ├── vite.config.js          ← Vite config (port 3000)
│   ├── tailwind.config.cjs     ← Tailwind config
│   ├── postcss.config.cjs      ← PostCSS config
│   ├── .env                    ← Firebase credentials
│   ├── .env.example            ← Environment template
│   └── node_modules/           ← Dependencies (220 packages)
│
├── admin/                       ← Admin Project
│   ├── client/                  ← Frontend React app (port 3001)
│   │   ├── src/
│   │   │   ├── main.jsx        ← UPDATED: Redirects to login
│   │   │   ├── components/
│   │   │   ├── QuestionManager.jsx
│   │   │   ├── UserManager.jsx
│   │   │   ├── SubmissionViewer.jsx
│   │   │   └── ...
│   │   ├── index.html
│   │   ├── package.json
│   │   └── vite.config.js
│   │
│   ├── server/                  ← Backend Express app (port 4001)
│   │   ├── index.js
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── ...
│   │
│   ├── .env                     ← Groq & Firebase credentials
│   └── package.json
│
├── student/                     ← Student Project
│   ├── client/                  ← Frontend React app (port 3002)
│   │   └── ...similar structure...
│   │
│   ├── server/                  ← Backend Express app (port 5001)
│   │   └── ...similar structure...
│   │
│   ├── .env
│   └── package.json
│
├── package.json                 ← Root commands (UPDATED)
├── .env                         ← Root environment
├── .gitignore
│
├── 📖 LOGIN_SETUP.md            ← NEW: Complete login setup guide
├── 📖 LOGIN_QUICK_REFERENCE.md  ← NEW: Quick reference
├── 📖 START.md                  ← Quick start (updated)
├── 📖 README.md                 ← Project overview (updated)
├── 📖 API.md                    ← API documentation
├── 📖 DEPLOYMENT.md             ← Deployment guide
└── 📖 DEVELOPMENT.md            ← Developer guide
```

## Component Relationships

```
Login App (localhost:3000)
│
├─ AuthContext
│  └─ Provides: user, userRole, auth object
│
├─ firebase.js
│  └─ Firebase config & initialization
│
└─ Login.jsx
   ├─ Dropdown selector (Student/Admin)
   ├─ Email input
   ├─ Password input
   ├─ Email/Password login handler
   ├─ Google login handler
   ├─ Error message display
   └─ Auto-redirect on auth


Admin App (localhost:3001)
│
├─ main.jsx
│  ├─ Redirects "/" & "/login" to :3000
│  └─ Shows admin components if logged in
│
├─ QuestionManager.jsx
├─ UserManager.jsx
├─ SubmissionViewer.jsx
└─ ProtectedAdminRoute (checks auth)


Student App (localhost:3002)
│
├─ main.jsx
│  └─ Shows student components if logged in
│
└─ Student Components
```

## Data Flow

```
User Input (email, password, type)
        │
        ▼
   Login.jsx
        │
        ├─ Validate input
        │
        ▼
   Firebase Authentication
        │
        ├─ signInWithEmailAndPassword()
        │  or signInWithPopup(GoogleAuthProvider)
        │
        ▼
   Firebase Response
        │
        ├─ User session created
        │
        ▼
   AuthContext Updates
        │
        ├─ user object updated
        │ userRole fetched from custom claims
        │
        ▼
   useEffect Detects Change
        │
        ├─ Checks userType (student/admin)
        │
        ▼
   Redirect
        │
        ├─ http://localhost:3001 (admin)
        │  or
        │  http://localhost:3002 (student)
        │
        ▼
   Portal Loads
        │
        ├─ Admin/Student components render
        │ Protected routes verify auth
        │
        ▼
   User Authenticated & Authorized
```

---

**Last Updated**: December 29, 2025  
**Status**: ✅ Complete & Ready to Use
