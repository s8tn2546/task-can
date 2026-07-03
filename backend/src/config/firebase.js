const admin = require('firebase-admin');

let firebaseApp;

function getPrivateKey() {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  return privateKey ? privateKey.replace(/\\n/g, '\n') : undefined;
}

function initializeFirebase() {
  if (firebaseApp) {
    return firebaseApp;
  }

  if (!admin.apps.length) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: getPrivateKey(),
      }),
    });
    return firebaseApp;
  }

  firebaseApp = admin.app();
  return firebaseApp;
}

function getFirebaseAuth() {
  initializeFirebase();
  return admin.auth();
}

module.exports = {
  initializeFirebase,
  getFirebaseAuth,
};
