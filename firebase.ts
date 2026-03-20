
import firebaseConfig from './firebase-applet-config.json';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// Check if Firebase is properly configured
const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.apiKey !== 'TODO_KEYHERE');

let app;
let auth: any;
let db: any;

if (isFirebaseConfigured) {
  console.log('Firebase is configured with project:', firebaseConfig.projectId);
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

    // Validate connection to Firestore
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. The client is offline.");
        }
      }
    };
    testConnection();
  } catch (e) {
    console.warn('Firebase initialization failed, switching to demo mode', e);
    auth = { currentUser: null };
    db = {};
  }
} else {
  auth = { currentUser: null };
  db = {};
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { auth, db, isFirebaseConfigured, googleProvider, signInWithPopup };
