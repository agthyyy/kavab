import * as admin from 'firebase-admin';
import fs from 'fs';
import { env } from './env';

let firebaseApp: admin.app.App | null = null;

export function initFirebase(): admin.app.App {
  if (firebaseApp) return firebaseApp;

  // Skip Firebase init in test environment unless explicitly configured
  if (env.nodeEnv === 'test' && !env.firebase.serviceAccountPath && !env.firebase.serviceAccountBase64) {
    return admin.app();
  }

  let credential: admin.credential.Credential;

  if (env.firebase.serviceAccountBase64) {
    const json = Buffer.from(env.firebase.serviceAccountBase64, 'base64').toString('utf-8');
    const serviceAccount = JSON.parse(json) as admin.ServiceAccount;
    credential = admin.credential.cert(serviceAccount);
  } else if (env.firebase.serviceAccountPath) {
    const raw = fs.readFileSync(env.firebase.serviceAccountPath, 'utf-8');
    const serviceAccount = JSON.parse(raw) as admin.ServiceAccount;
    credential = admin.credential.cert(serviceAccount);
  } else {
    // Use application default credentials (e.g. on GCP)
    credential = admin.credential.applicationDefault();
  }

  firebaseApp = admin.initializeApp({
    credential,
    storageBucket: env.firebase.storageBucket || undefined,
  });

  return firebaseApp;
}

export function getFirebaseApp(): admin.app.App {
  if (!firebaseApp) {
    throw new Error('Firebase has not been initialized. Call initFirebase() first.');
  }
  return firebaseApp;
}

export function getStorage(): admin.storage.Storage {
  return getFirebaseApp().storage();
}

export function getMessaging(): admin.messaging.Messaging {
  return getFirebaseApp().messaging();
}
