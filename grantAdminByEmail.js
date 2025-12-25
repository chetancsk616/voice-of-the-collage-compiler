const fs = require('fs');
const path = require('path');
require('dotenv').config();
const admin = require('firebase-admin');

function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const json = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
      'base64'
    ).toString('utf8');
    return JSON.parse(json);
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const credsPath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    return JSON.parse(fs.readFileSync(credsPath, 'utf8'));
  }

  // Try to load from the JSON file in the root
  const jsonPath = path.join(__dirname, 'aicompiler-45c59-firebase-adminsdk-fbsvc-cb7b106f14.json');
  if (fs.existsSync(jsonPath)) {
    return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  }

  throw new Error(
    'Missing Firebase credentials. Set FIREBASE_SERVICE_ACCOUNT_BASE64, FIREBASE_SERVICE_ACCOUNT, GOOGLE_APPLICATION_CREDENTIALS, or ensure the JSON file exists.'
  );
}

async function grantAdminAccess(emails) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(loadServiceAccount()),
    });

    console.log('✅ Firebase Admin initialized');

    for (const email of emails) {
      try {
        const user = await admin.auth().getUserByEmail(email);
        await admin.auth().setCustomUserClaims(user.uid, { role: 'admin' });
        console.log(`✅ Admin role granted to ${email} (UID: ${user.uid})`);
      } catch (err) {
        console.error(`❌ Error setting admin for ${email}:`, err.message);
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

const emails = ['admin@test.com', 'srinivaschetan7@gmail.com'];
grantAdminAccess(emails);
