# Quick Start Guide

## 🚀 One Command to Start Everything

```bash
npm run dev
```

This command starts all three frontend servers and two backend services simultaneously:
- ✅ Login Page → http://localhost:3000 (entry point)
- ✅ Admin Client → http://localhost:3001 (proxied to 3000/admin/)
- ✅ Admin Server → http://localhost:4100 (accessed via /admin/api)
- ✅ Student Client → http://localhost:3002 (proxied to 3000/student/)
- ✅ Student Server → http://localhost:5001 (accessed via /student/api)

## 📋 First Time Setup

### 1. Install Dependencies

```bash
npm run install:all
```

This installs all packages for login, admin, and student projects.

### 2. Configure Environment

#### Login App (`login/.env`)
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

#### Admin Server (`admin/server/.env`)
```env
PORT=4100
GROQ_API_KEY=your_groq_key_here
```

#### Student Server (`student/server/.env`)
```env
PORT=5001
GROQ_API_KEY=your_groq_key_here
```

### 3. Firebase Setup (One-Time)

1. Get Firebase credentials from [Firebase Console](https://console.firebase.google.com)
2. Enable Email/Password and Google OAuth in Authentication
3. Download service account JSON for Admin SDK
4. Place at `admin/server/config/serviceAccountKey.json`
5. Set admin role on your account:
   ```bash
   node setAdminRole.js <your_uid>
   ```

### 4. Build Projects

```bash
npm run build
```

### 5. Start Development

```bash
npm run dev
```

Access at **http://localhost:3000** and sign in!

## 🎮 Available Commands

### Development

| Command | Description |
|---------|-------------|
| `npm run dev` | Start everything (login + admin + student) |
| `npm run dev:admin-only` | Start only admin app |
| `npm run dev:student-only` | Start only student app |

### Production

| Command | Description |
|---------|-------------|
| `npm run build` | Build all projects |
| `npm start` | Start production servers |

### Maintenance

| Command | Description |
|---------|-------------|
| `npm run install:all` | Install all dependencies |

## 🌐 Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| **Unified Login** | **http://localhost:3000** | ⭐ Start here! Sign in with email or Google |
| Admin Portal | http://localhost:3000/admin/ | Question & user management (redirected after admin sign-in) |
| Student Portal | http://localhost:3000/student/ | Code editor & learning (redirected after student sign-in) |

**Note**: All requests go through port 3000 for unified authentication. Backend APIs are proxied:
- Admin APIs: `/admin/api` → admin server (4100)
- Student APIs: `/student/api` → student server (5001)

## 📂 Project Structure

```
ai-web-compiler/
├── login/                  ← Unified login app (port 3000)
│   ├── src/
│   │   ├── Login.jsx       ← Email & Google sign-in
│   │   ├── AuthContext.jsx ← Auth state management
│   │   └── components/
│   │       └── LogoutConfirmModal.jsx
│   └── vite.config.js      ← Proxy config for /admin & /student
│
├── admin/
│   ├── client/             ← Admin UI (port 3001, served at /admin/)
│   └── server/             ← Admin API (port 4100, via /admin/api)
│
└── student/
    ├── client/             ← Student UI (port 3002, served at /student/)
    └── server/             ← Student API (port 5001, via /student/api)
    └── server/    → Express server (5001)
```

## 🔧 Configuration

### Firebase Setup

1. Go to Firebase Console
2. Create/select project
3. Download service account JSON
4. Base64 encode:
   ```bash
   # PowerShell
   [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((Get-Content serviceAccountKey.json -Raw)))
   ```
5. Add to `.env` files

### Groq API Setup

1. Visit https://console.groq.com
2. Generate API key
3. Add to `.env` files

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Kill all Node processes
taskkill /F /IM node.exe
```

### Build Failures

```bash
# Clean and reinstall
cd admin/client && rm -rf node_modules dist && npm install
cd ../../student/client && rm -rf node_modules dist && npm install
```

### Environment Issues

- ✅ Check `.env` files exist in `admin/` and `student/`
- ✅ Verify GROQ_API_KEY is set
- ✅ Verify FIREBASE_SERVICE_ACCOUNT_BASE64 is correct
- ✅ Ensure no trailing spaces in environment values

### Server Won't Start

```bash
# Check for syntax errors
cd admin/server && node index.js
cd ../../student/server && node index.js

# View detailed logs
npm run dev:admin-only  # Check admin logs
npm run dev:student-only  # Check student logs
```

## 📖 Next Steps

After starting the servers:

1. **Admin Panel** (http://localhost:3001)
   - Login with admin credentials
   - Manage questions
   - View submissions
   - Manage users

2. **Student Portal** (http://localhost:3002)
   - Sign up / Login
   - Browse questions
   - Write and test code
   - Get AI assistance

## 📚 Additional Documentation

- [README.md](README.md) - Complete project documentation
- [DEVELOPMENT.md](DEVELOPMENT.md) - Developer guide
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment instructions
- [API.md](API.md) - API documentation

## 💡 Tips

- Use `Ctrl+C` to stop servers
- All servers have hot-reload enabled
- Check browser console for frontend errors
- Check terminal for backend errors
- Firebase auth requires valid credentials

---

**Need Help?** Check the [README](README.md) or contact the system administrator.

**Last Updated**: December 22, 2025
