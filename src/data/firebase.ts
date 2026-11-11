/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Firebase configuration and initialization module for KinD.
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  Auth,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
} from 'firebase/firestore';

// Default / fallback Firebase config structure
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

try {
  // Check if firebase-applet-config.json is present via dynamic or standard setup
  const config = (window as unknown as { __FIREBASE_CONFIG__?: Record<string, string> }).__FIREBASE_CONFIG__;
  if (config && config.apiKey) {
    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApps()[0];
    }
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (e) {
  console.warn('Firebase initialized in local/offline fallback mode:', e);
}

export { app, auth, db, googleProvider };

export async function signInWithGoogle(): Promise<User | null> {
  if (!auth) {
    // Provide clean demo authentication when live Firebase config is absent
    const mockUser = {
      uid: 'user_kind_owner',
      displayName: 'Restaurant Manager',
      email: 'manager@kind-pos.com',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    } as unknown as User;
    localStorage.setItem('kind_auth_mock_user', JSON.stringify(mockUser));
    window.dispatchEvent(new Event('kind_auth_change'));
    return mockUser;
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-in failed:', error);
    throw error;
  }
}

export async function signOutUser(): Promise<void> {
  if (auth) {
    await signOut(auth);
  }
  localStorage.removeItem('kind_auth_mock_user');
  window.dispatchEvent(new Event('kind_auth_change'));
}

export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  if (auth) {
    return onAuthStateChanged(auth, callback);
  }

  // Handle mock / local session state
  const checkStored = () => {
    const stored = localStorage.getItem('kind_auth_mock_user');
    if (stored) {
      try {
        callback(JSON.parse(stored) as User);
        return;
      } catch {
        // ignore
      }
    }
    callback(null);
  };

  checkStored();
  const handler = () => checkStored();
  window.addEventListener('kind_auth_change', handler);
  return () => window.removeEventListener('kind_auth_change', handler);
}
