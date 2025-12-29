# Development Guide - AI Web Compiler

Complete guide for developers working on the AI Web Compiler project.

## 🛠️ Development Setup

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Git
- VS Code (recommended)
- Firebase account
- Groq API account

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd ai-web-compiler

# Install dependencies
npm run install:all

# Copy environment templates
cp admin/.env.example admin/.env
cp student/.env.example student/.env

# Configure environment variables (see Configuration section)

# Build projects
npm run build

# Start development servers
npm run dev
```

## 📂 Project Structure Explained

### Admin Project (`/admin`)

```
admin/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   │   ├── Login.jsx
│   │   │   └── ProtectedAdminRoute.jsx
│   │   ├── QuestionManager.jsx      # Question CRUD
│   │   ├── UserManager.jsx          # User management
│   │   ├── SubmissionViewer.jsx     # View submissions
│   │   ├── AuthContext.jsx          # Firebase auth
│   │   ├── firebase.js              # Firebase config
│   │   ├── api.js                   # API client
│   │   ├── main.jsx                 # Entry point
│   │   └── index.css                # Global styles
│   ├── public/
│   ├── dist/                        # Build output
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.cjs
│
└── server/                 # Express backend
    ├── routes/
    │   └── admin.js                 # Admin API routes
    ├── middleware/
    │   └── adminAuth.js             # Auth middleware
    ├── ai/
    │   └── groqClient.js            # Groq AI integration
    ├── ast/                         # Code analysis
    │   ├── core/
    │   ├── extractors/
    │   └── grammars/
    ├── executor/
    │   └── pistonExecutor.js        # Code execution
    ├── logic/                       # Question logic files
    ├── utils/
    │   ├── logicFeatureExtractor.js
    │   └── referenceLogicLoader.js
    ├── config/
    ├── tmp/                         # Temporary files
    ├── index.js                     # Entry point
    └── package.json
```

### Student Project (`/student`)

Similar structure to admin, with student-specific components.

## 💻 Development Workflow

### Starting Development

```bash
# Terminal 1: Start both projects
npm run dev

# OR start separately

# Terminal 1: Admin only
npm run dev:admin-only

# Terminal 2: Student only
npm run dev:student-only
```

### Making Changes

#### Frontend Changes

1. Edit files in `client/src/`
2. Vite will hot-reload automatically
3. Check browser console for errors
4. Test in multiple browsers

#### Backend Changes

1. Edit files in `server/`
2. Server auto-restarts with `--watch` flag
3. Check terminal for errors
4. Test API endpoints

### Testing

```bash
# Run tests (if configured)
cd admin/server && npm test
cd student/server && npm test

# Manual testing checklist
- [ ] Login/logout works
- [ ] Question CRUD operations
- [ ] Code execution works
- [ ] AI assistant responds
- [ ] Error handling works
```

## 🔧 Common Development Tasks

### Adding a New API Endpoint

**Admin Example:**

```javascript
// admin/server/routes/admin.js

router.get('/api/admin/new-endpoint', async (req, res) => {
  try {
    // Your logic here
    res.json({ success: true, data: {} });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

**Frontend Usage:**

```javascript
// admin/client/src/api.js

export const fetchNewData = async (token) => {
  const response = await fetch('/api/admin/new-endpoint', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

### Adding a New React Component

```bash
# Create component file
touch admin/client/src/components/NewComponent.jsx
```

```jsx
// admin/client/src/components/NewComponent.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

const NewComponent = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    // Fetch data
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">New Component</h1>
      {/* Your JSX */}
    </div>
  );
};

export default NewComponent;
```

### Adding a New Question

1. Create logic file: `server/logic/Q0XX.json`

```json
{
  "id": "Q0XX",
  "title": "Your Question Title",
  "description": "Question description",
  "difficulty": "easy|medium|hard",
  "testCases": [
    {
      "input": "test input",
      "expectedOutput": "expected output"
    }
  ],
  "hints": ["Hint 1", "Hint 2"],
  "tags": ["arrays", "loops"],
  "starterCode": {
    "python": "def solution():\n    pass",
    "javascript": "function solution() {\n    // code\n}"
  }
}
```

2. Add to questions.json in both admin and student clients

### Modifying Styling

```jsx
// Use Tailwind classes
<div className="bg-gray-800 text-white p-4 rounded-lg shadow-md">
  <h2 className="text-xl font-bold mb-2">Title</h2>
  <p className="text-gray-300">Content</p>
</div>
```

Custom styles in `index.css`:

```css
@layer components {
  .btn-primary {
    @apply bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition;
  }
}
```

## 🐛 Debugging

### Frontend Debugging

```javascript
// Use console methods
console.log('Debug:', data);
console.error('Error:', error);
console.table(arrayOfObjects);

// React DevTools
// Install browser extension for component inspection
```

### Backend Debugging

```javascript
// Structured logging
console.info(JSON.stringify({
  event: 'api_request',
  endpoint: '/api/execute',
  timestamp: new Date().toISOString(),
  userId: user.uid
}));

// Debug specific modules
const DEBUG = process.env.DEBUG === 'true';
if (DEBUG) console.log('Debug info:', data);
```

### Common Issues

**Vite HMR Not Working**
```bash
# Clear cache and restart
rm -rf admin/client/node_modules/.vite
npm run dev:admin-only
```

**Firebase Auth Error**
```javascript
// Check token validity
const token = await user.getIdToken(true); // force refresh
```

**CORS Issues**
```javascript
// server/index.js
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://admin.yourapp.com', 'https://app.yourapp.com']
    : ['http://localhost:3001', 'http://localhost:3002'],
  credentials: true
}));
```

## 📦 Building for Production

```bash
# Build both projects
npm run build

# Test production build locally
cd admin/client && npx vite preview
cd ../../student/client && npx vite preview
```

## 🔍 Code Quality

### Linting

```bash
# Check code quality
cd admin/server && npm run lint
cd ../../student/server && npm run lint

# Auto-fix issues
npm run lint:fix
```

### Formatting

```bash
# Format code
npm run format
```

### Pre-commit Hooks

Husky automatically runs on commit:
- Lints staged files
- Runs formatters
- Checks for errors

## 📚 Useful Resources

### Documentation
- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [Express Docs](https://expressjs.com)
- [Firebase Docs](https://firebase.google.com/docs)
- [Tailwind Docs](https://tailwindcss.com/docs)

### Tools
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Postman](https://www.postman.com) - API testing
- [Firebase Console](https://console.firebase.google.com)
- [Groq Console](https://console.groq.com)

## 🤝 Contributing Guidelines

1. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes**
   - Write clean, documented code
   - Follow existing patterns
   - Add comments for complex logic

3. **Test thoroughly**
   - Test all affected features
   - Check for console errors
   - Verify responsive design

4. **Commit with meaningful messages**
   ```bash
   git commit -m "feat: add question filtering functionality"
   git commit -m "fix: resolve authentication token refresh issue"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## 🎯 Best Practices

### React Components
- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper prop types validation

### API Design
- RESTful endpoints
- Proper HTTP status codes
- Consistent error responses
- Input validation
- Rate limiting

### Security
- Never commit `.env` files
- Validate all user inputs
- Use parameterized queries
- Implement proper authentication
- Keep dependencies updated

### Performance
- Lazy load routes
- Optimize images
- Minimize bundle size
- Use React.memo for expensive components
- Implement proper caching

## 📞 Getting Help

- Check existing documentation
- Search GitHub issues
- Ask in team chat
- Contact lead developer

---

**Happy Coding!** 🚀

**Last Updated**: December 29, 2025
