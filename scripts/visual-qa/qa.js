// Visual QA script using Playwright
// Usage:
// 1) npm install -D playwright
// 2) npx playwright install
// 3) node scripts/visual-qa/qa.js

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function screenshotFile(filePath, outPath, label) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const url = 'file://' + filePath;
  console.log(`Opening ${label}: ${url}`);
  await page.goto(url);
  // wait briefly for styles/scripts
  await page.waitForTimeout(600);
  await page.screenshot({ path: outPath, fullPage: true });
  await browser.close();
}

async function run() {
  const root = path.resolve(__dirname, '..', '..');
  const targets = [
    { label: 'student-home', file: path.join(root, 'student', 'client', 'dist', 'index.html'), out: path.join(root, 'screenshots', 'student-home.png') },
    { label: 'admin-home', file: path.join(root, 'admin', 'client', 'dist', 'index.html'), out: path.join(root, 'screenshots', 'admin-home.png') },
    { label: 'login', file: path.join(root, 'login', 'dist', 'index.html'), out: path.join(root, 'screenshots', 'login.png') },
  ];

  if (!fs.existsSync(path.join(root, 'screenshots'))) fs.mkdirSync(path.join(root, 'screenshots'));

  for (const t of targets) {
    if (!fs.existsSync(t.file)) {
      console.warn(`Skipping ${t.label}: ${t.file} not found. Run client builds first.`);
      continue;
    }
    try {
      await screenshotFile(t.file, t.out, t.label);
      console.log(`Saved screenshot: ${t.out}`);
    } catch (err) {
      console.error(`Failed screenshot for ${t.label}:`, err.message);
    }
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
