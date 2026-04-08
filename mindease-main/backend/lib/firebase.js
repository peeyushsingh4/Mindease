const admin = require('firebase-admin');

let appInstance = null;

const getFirebaseConfig = () => {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing Firebase credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.'
    );
  }

  return {
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey
    })
  };
};

const getFirebaseApp = () => {
  if (appInstance) return appInstance;
  if (admin.apps.length > 0) {
    appInstance = admin.app();
    return appInstance;
  }
  appInstance = admin.initializeApp(getFirebaseConfig());
  return appInstance;
};

const getDb = () => admin.firestore(getFirebaseApp());
const getAuth = () => admin.auth(getFirebaseApp());

module.exports = {
  admin,
  getFirebaseApp,
  getDb,
  getAuth
};
