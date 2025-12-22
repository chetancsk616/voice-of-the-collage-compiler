# AI Compiler - Admin Panel

The admin panel is part of the unified AI Web Compiler system accessible via a single login portal.

## Access

**Start the entire application** with:
```bash
npm run dev
```

Then visit **http://localhost:3000** to sign in. After authentication with admin role, you'll be redirected to the admin panel at **http://localhost:3000/admin/**.

## Features

- **Question Management** - Create, edit, and delete programming questions
- **User Management** - View and manage student accounts  
- **Submission Viewer** - Review student code submissions and results
- **Role-Based Access** - Admin-only features protected by custom Firebase claims
- **Real-time Dashboard** - System statistics and monitoring

## Project Structure

```
admin/
├── client/                     # React frontend (Vite + React + TailwindCSS)
│   ├── src/
│   │   ├── AdminDashboard.jsx
│   │   ├── QuestionManager.jsx
│   │   ├── UserManager.jsx
│   │   ├── SubmissionViewer.jsx
│   │   ├── AuthContext.jsx          # Admin authentication state
│   │   ├── components/
│   │   │   ├── ProtectedAdminRoute.jsx  # Route protection for admin-only access
│   │   │   ├── LogoutConfirmModal.jsx   # Custom logout confirmation
│   │   │   └── ...
│   │   ├── api.js                   # API client with /admin/api prefix
│   │   ├── firebase.js              # Firebase configuration
│   │   └── main.jsx
│   └── vite.config.js           # Dev server config (port 3001, base /admin/)
│
├── server/                     # Express backend (port 4100, accessed via /admin/api)
│   ├── routes/                 # API endpoints
│   ├── middleware/             # Auth middleware, error handling
│   ├── config/
│   │   └── serviceAccountKey.json   # Firebase Admin SDK credentials
│   ├── ai/                     # AI integration (Groq)
│   ├── ast/                    # Code analysis
│   └── index.js                # Express server
│
├── package.json
└── .env
```

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Firebase account with Admin SDK configured
- Groq API key (for AI features)

## Setup

1. **Install dependencies** (from root):
   ```bash
   npm run install:all
   ```

2. **Configure environment**:
   
   **admin/server/.env**
   ```env
   PORT=4100
   GROQ_API_KEY=your_groq_api_key_here
   NODE_ENV=development
   ```

3. **Set up Firebase Admin SDK**:
   - Download service account JSON from Firebase Console > Project Settings
   - Place at `admin/server/config/serviceAccountKey.json`
   - Set custom admin claim on your user account:
     ```bash
     node setAdminRole.js <your_firebase_uid>
     ```

4. **Start development**:
   ```bash
   npm run dev
   ```
   Then visit **http://localhost:3000** and sign in with admin role.

## Single-Origin Architecture

The admin panel is served as a sub-route under the unified login origin:

```
Browser → http://localhost:3000/admin/
  ↓
Vite Proxy (login app)
  ↓
Forwards to http://localhost:3001 (admin dev server)
  ↓
Admin client renders with /admin/ base path
```

All API calls are similarly routed:
- `POST /admin/api/questions` → proxied to admin backend (4100)
- Response handled with path rewrite for seamless integration

## API Endpoints

All endpoints require admin authentication (custom claim validation):
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
This runs both client (port 3001) and server (port 4001) concurrently.

### Run Client Only
```bash
npm run dev:client
```
Runs on http://localhost:3001

### Run Server Only
```bash
npm run dev:server
```
Runs on http://localhost:4001

### Production
```bash
# Build client
npm run build:client

# Start server
npm start
```

## Configuration

### Client (client/.env or import.meta.env)
- `VITE_API_URL`: Backend API URL (default: http://localhost:4001)
- `VITE_FIREBASE_CONFIG`: Firebase web config

### Server (.env in root)
- `PORT`: Server port (default: 4001)
- `API_PREFIX`: API route prefix (default: /api)
- `GROQ_API_KEY`: Your Groq API key
- `FIREBASE_SERVICE_ACCOUNT_BASE64`: Base64 encoded Firebase admin credentials

## API Endpoints

### Admin Routes
- `GET /api/admin/health` - Health check
- `GET /api/admin/questions` - List all questions
- `POST /api/admin/questions` - Create new question
- `PUT /api/admin/questions/:id` - Update question
- `DELETE /api/admin/questions/:id` - Delete question
- `GET /api/admin/users` - List all users
- `GET /api/admin/submissions` - List submissions

## Tech Stack

### Frontend
- React 18
- Vite
- TailwindCSS
- React Router
- Axios
- Firebase (Authentication)

### Backend
- Node.js + Express
- Firebase Admin SDK
- Groq AI API
- JWT Authentication
- AST-based code analysis

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

Private - For internal use only
