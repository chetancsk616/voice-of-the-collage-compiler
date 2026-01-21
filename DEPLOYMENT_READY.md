# Deployment Guide - Voice of the College Compiler

## Repository
**GitHub Repository:** https://github.com/chetancsk616/voice-of-the-collage-compiler

## Environment Configuration

This project uses a **single centralized `.env` file** at the root level. All services (admin, student, login) read from this file.

### Setup Instructions

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Configure required variables:**
   - `GROQ_API_KEY`: Get from https://console.groq.com/keys
   - `FIREBASE_SERVICE_ACCOUNT_BASE64`: Base64-encoded Firebase service account JSON
   - `FIREBASE_DATABASE_URL`: Your Firebase Realtime Database URL
   - `ADMIN_EMAILS`: Comma-separated list of admin emails

3. **For production deployment (Render):**
   - Set `NODE_ENV=production`
   - Set `PORT=10000` (Render's default)
   - Configure environment variables in Render dashboard

## Render Deployment

### Prerequisites
- GitHub account
- Render account
- Firebase project with service account credentials
- Groq API key

### Deployment Steps

1. **Connect Repository to Render:**
   - Log in to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub account
   - Select repository: `chetancsk616/voice-of-the-collage-compiler`
   - Branch: `main`

2. **Configure Service:**
   - **Name:** `voice-of-the-college-compiler` (or your preferred name)
   - **Region:** Oregon (or your preferred region)
   - **Branch:** `main`
   - **Root Directory:** `.` (leave blank)
   - **Runtime:** Node
   - **Build Command:** (should auto-detect from render.yaml)
     ```bash
     npm install --workspaces --include-workspace-root && npm run build
     ```
   - **Start Command:** (should auto-detect from render.yaml)
     ```bash
     npm run start:prod
     ```

3. **Environment Variables:**
   Go to "Environment" section and add:
   ```
   NODE_ENV=production
   PORT=10000
   GROQ_API_KEY=your_groq_api_key_here
   FIREBASE_SERVICE_ACCOUNT_BASE64=your_base64_encoded_service_account
   FIREBASE_DATABASE_URL=https://your-project.firebaseio.com/
   ADMIN_EMAILS=your-admin@email.com
   ```

4. **Deploy:**
   - Click "Create Web Service"
   - Wait for build and deployment to complete
   - Access your app at the provided URL

### Build Process

The build command does the following:
1. Installs all workspace dependencies (login, admin, student)
2. Builds login client → `login/dist`
3. Builds admin client → `admin/client/dist`
4. Builds student client → `student/client/dist`

### Production Server

The `start:prod` command runs **only the admin server** which:
- Serves the admin dashboard at `/`
- Provides API endpoints at `/api`
- Serves static files from `admin/client/dist`

### Health Check
- **Path:** `/api/health`
- **Expected Response:** `{"ok": true, "message": "server is up"}`

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build all clients:**
   ```bash
   npm run build
   ```

3. **Start development servers:**
   ```bash
   # All services (requires 3 terminals or use concurrently)
   npm run dev

   # Or individually:
   npm run dev:login
   npm run dev:admin
   npm run dev:student
   ```

4. **Access applications:**
   - Login: http://localhost:3000
   - Admin: http://localhost:4000
   - Student: http://localhost:5000

## Troubleshooting

### "Application not built" Error
**Cause:** Client files not generated during build.
**Solution:**
1. Check build logs in Render dashboard
2. Ensure build command is: `npm install --workspaces --include-workspace-root && npm run build`
3. Verify `package.json` has correct build scripts
4. Trigger manual redeploy

### "index.html not found" Error
**Cause:** Build command didn't complete successfully.
**Solution:**
1. Check that all workspace dependencies installed
2. Verify Vite builds completed for all clients
3. Check for build errors in logs

### Environment Variables Not Loading
**Cause:** `.env` file missing or misconfigured.
**Solution:**
1. Ensure `.env` file exists at project root
2. Verify environment variables are set in Render dashboard
3. Check that servers are looking for `.env` at correct path (../../.env)

### Port Conflicts in Development
**Cause:** Multiple services trying to use same port.
**Solution:**
- Login uses port 3000
- Admin uses port 4000  
- Student uses port 5000
- Ensure these ports are available

## Project Structure

```
ai-web-compiler/
├── .env                          # Single environment config (root)
├── .env.example                  # Template for environment variables
├── package.json                  # Root workspace configuration
├── render.yaml                   # Render deployment config
├── admin/
│   ├── client/                   # Admin React app
│   │   └── dist/                 # Built files (generated)
│   └── server/                   # Admin Express server
│       └── index.js              # Main server file
├── student/
│   ├── client/                   # Student React app
│   │   └── dist/                 # Built files (generated)
│   └── server/                   # Student Express server
│       └── index.js              # Main server file
└── login/
    └── dist/                     # Built files (generated)
```

## Important Notes

1. **Single .env File:** All services read from the root `.env` file. No duplicate environment files.
2. **Production Mode:** Only admin server runs in production (serves admin UI and API).
3. **Build Required:** Always run `npm run build` before starting production server.
4. **Environment Security:** Never commit `.env` file. Use Render's environment variable settings.
5. **Firebase Credentials:** Use base64-encoded service account in `FIREBASE_SERVICE_ACCOUNT_BASE64`.

## Support

For issues or questions:
- Check deployment logs in Render dashboard
- Review error messages in `/api/health` endpoint
- Verify all environment variables are set correctly
- Ensure build completed successfully (check for dist folders)
