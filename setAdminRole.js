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

  throw new Error(
    'Missing Firebase credentials. Set FIREBASE_SERVICE_ACCOUNT_BASE64, FIREBASE_SERVICE_ACCOUNT, or GOOGLE_APPLICATION_CREDENTIALS.'
  );
}

// TODO: paste the admin UID here or set FIREBASE_ADMIN_UID
const uid = process.env.FIREBASE_ADMIN_UID || 'NbkCsVqvUkZdVbuUNiD8vqHbwkw2';

admin.initializeApp({
  credential: admin.credential.cert(loadServiceAccount()),
});

admin
  .auth()
  .setCustomUserClaims(uid, { role: 'admin' })
  .then(() => {
    console.log(' Admin role set for UID:', uid);
    process.exit(0);
  })
  .catch((err) => {
    console.error(' Error setting admin claim:', err);
    process.exit(1);
  });
