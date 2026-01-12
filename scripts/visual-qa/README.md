Visual QA helper

This helper uses Playwright to capture screenshots of the built client apps.

Quick steps:

1. Ensure you've built the clients:

```bash
cd student/client && npm run build
cd admin/client && npm run build
cd login && npm run build
```

2. Install Playwright (Dev dependency):

```bash
npm install -D playwright
npx playwright install
```

3. Run the QA script (from repo root):

```bash
node scripts/visual-qa/qa.js
```

Output will be written to the `screenshots/` folder at repo root.

Notes:
- The script opens the built `index.html` files via file:// URLs; if your app depends on a dev server or specific routes, run a static server and update the script to point at http://localhost:PORT instead.
