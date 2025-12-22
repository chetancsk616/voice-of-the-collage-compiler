// Admin Authentication Middleware
// Verifies Firebase ID token and checks for admin role

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK (if not already initialized)
if (!admin.apps.length) {
  try {
    let credential;
    
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      // Use plain JSON environment variable
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      credential = admin.credential.cert(serviceAccount);
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      // Use base64-encoded environment variable
      const serviceAccountJson = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8');
      const serviceAccount = JSON.parse(serviceAccountJson);
      credential = admin.credential.cert(serviceAccount);
    } else {
      // Try to load from file
      try {
        const serviceAccount = require('../config/serviceAccountKey.json');
        credential = admin.credential.cert(serviceAccount);
      } catch (err) {
        console.warn('⚠️  Firebase Admin SDK not initialized: No service account found');
        console.warn('   Admin features will use email whitelist only');
        console.warn('   Set FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_BASE64 env var or create server/config/serviceAccountKey.json');
        // Continue without Firebase Admin - email whitelist will still work
        credential = null;
      }
    }
    
    if (credential) {
      const databaseURL =
        process.env.FIREBASE_DATABASE_URL || process.env.VITE_FIREBASE_DATABASE_URL;

      admin.initializeApp(
        databaseURL ? { credential, databaseURL } : { credential }
      );
      console.log('✅ Firebase Admin SDK initialized');
      if (!databaseURL) {
        console.warn('⚠️  FIREBASE_DATABASE_URL missing; Realtime DB features will fail');
      }
    }
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error.message);
  }
}

// Admin email whitelist (can be configured via environment variable)
const ADMIN_EMAILS = process.env.ADMIN_EMAILS 
  ? process.env.ADMIN_EMAILS.split(',').map(email => email.trim())
  : ['admin@example.com']; // Default admin email

/**
 * Middleware to verify Firebase authentication token
 */
async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'No authentication token provided' 
      });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Attach user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Invalid or expired token' 
    });
  }
}

/**
 * Middleware to check if authenticated user has admin privileges
 */
async function requireAdmin(req, res, next) {
  try {
    // First ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Authentication required' 
      });
    }

    let isAdmin = false;
    
    // Check email whitelist first (always works)
    const isWhitelisted = ADMIN_EMAILS.includes(req.user.email);
    
    // Check Firebase custom claims if Admin SDK is initialized
    if (admin.apps.length > 0) {
      try {
        const userRecord = await admin.auth().getUser(req.user.uid);
        isAdmin = userRecord.customClaims?.admin === true;
      } catch (err) {
        console.warn('Could not check custom claims:', err.message);
      }
    }
    
    if (!isAdmin && !isWhitelisted) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'Admin access required' 
      });
    }
    
    // Attach admin flag to request
    req.user.isAdmin = true;
    
    next();
  } catch (error) {
    console.error('Admin authorization error:', error);
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'Unable to verify admin status' 
    });
  }
}

/**
 * Utility function to set admin custom claim for a user
 * Call this manually to grant admin access
 */
async function grantAdminAccess(uid) {
  try {
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    console.log(`✅ Admin access granted to user: ${uid}`);
    return { success: true, message: 'Admin access granted' };
  } catch (error) {
    console.error('Error granting admin access:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Utility function to revoke admin custom claim from a user
 */
async function revokeAdminAccess(uid) {
  try {
    await admin.auth().setCustomUserClaims(uid, { admin: false });
    console.log(`✅ Admin access revoked from user: ${uid}`);
    return { success: true, message: 'Admin access revoked' };
  } catch (error) {
    console.error('Error revoking admin access:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  authenticateUser,
  requireAdmin,
  grantAdminAccess,
  revokeAdminAccess,
  adminAuth: admin
};
