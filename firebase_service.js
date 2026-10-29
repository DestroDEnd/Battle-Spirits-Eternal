/**
 * Battle Spirits Eternal - Firebase Cloud Service
 * Handles Authentication, Cloud Deck Persistence, 8-Digit Duelist IDs, and Player Profile Tracking.
 */

(function(window) {
  'use strict';

  // ── 1. FIREBASE CONFIGURATION (REPLACE WITH YOUR PROJECT SETTINGS) ──
  // Users can update these keys from Firebase Console -> Project Settings -> General -> Web App
  const firebaseConfig = window.FIREBASE_CONFIG || {
    apiKey: "AIzaSyDMU1qTTHHVztMR1pBLCyKuBf_1dxaYTzs",
    authDomain: "battle-spirits-eternal-2b00a.firebaseapp.com",
    projectId: "battle-spirits-eternal-2b00a",
    storageBucket: "battle-spirits-eternal-2b00a.firebasestorage.app",
    messagingSenderId: "985745798835",
    appId: "1:985745798835:web:707d1f66d5550b0f68e2c6",
    measurementId: "G-PNBM6SGFZ5",
    databaseURL: "https://battle-spirits-eternal-2b00a-default-rtdb.firebaseio.com"
  };

  let app = null;
  let auth = null;
  let db = null;
  let rtdb = null;
  let isConfigured = false;
  let currentUser = null;
  let currentDuelistId = null;

  // Initialize Firebase if library is available
  function initFirebase() {
    if (typeof firebase !== 'undefined') {
      try {
        if (!firebase.apps.length) {
          app = firebase.initializeApp(firebaseConfig);
        } else {
          app = firebase.app();
        }
        auth = firebase.auth();
        db = firebase.firestore();
        rtdb = firebase.database();
        isConfigured = true;
        console.log('[Firebase] Initialized Firebase Services successfully.');

        // Listen for authentication changes
        auth.onAuthStateChanged(async (user) => {
          currentUser = user;
          if (user) {
            currentDuelistId = await getOrCreateDuelistId(user);
            console.log(`[Firebase] Signed in as ${user.displayName || user.email} (Duelist ID: ${formatDuelistId(currentDuelistId)})`);
            // Trigger UI sync
            dispatchAuthEvent('signed_in', { user, duelistId: currentDuelistId });
          } else {
            currentDuelistId = null;
            dispatchAuthEvent('signed_out', null);
          }
        });
      } catch (e) {
        console.warn('[Firebase] Initialization error (using local mode):', e);
      }
    }
  }

  // ── 2. 8-DIGIT DUELIST ID ENGINE ──
  function generateRandom8DigitId() {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
  }

  function formatDuelistId(id) {
    if (!id || id.length !== 8) return id || '0000-0000';
    return `${id.slice(0, 4)}-${id.slice(4)}`;
  }

  async function getOrCreateDuelistId(user) {
    // 1. Check local cache
    const cachedId = localStorage.getItem(`bse_duelist_id_${user.uid}`);
    if (cachedId) return cachedId;

    if (!db) {
      const fallback = generateRandom8DigitId();
      localStorage.setItem(`bse_duelist_id_${user.uid}`, fallback);
      return fallback;
    }

    try {
      const userDocRef = db.collection('users').doc(user.uid);
      const doc = await userDocRef.get();

      if (doc.exists && doc.data().duelistId) {
        const id = doc.data().duelistId;
        localStorage.setItem(`bse_duelist_id_${user.uid}`, id);
        return id;
      }

      // Generate a unique 8-digit ID
      let uniqueId = null;
      let attempts = 0;
      while (!uniqueId && attempts < 5) {
        attempts++;
        const candidate = generateRandom8DigitId();
        const check = await db.collection('duelist_ids').doc(candidate).get();
        if (!check.exists) {
          uniqueId = candidate;
        }
      }

      if (!uniqueId) uniqueId = generateRandom8DigitId();

      const batch = db.batch();
      batch.set(userDocRef, {
        duelistId: uniqueId,
        username: user.displayName || user.email.split('@')[0],
        email: user.email || '',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      batch.set(db.collection('duelist_ids').doc(uniqueId), {
        uid: user.uid,
        username: user.displayName || user.email.split('@')[0],
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      await batch.commit();
      localStorage.setItem(`bse_duelist_id_${user.uid}`, uniqueId);
      return uniqueId;
    } catch (e) {
      console.warn('[Firebase] Error generating unique 8-digit ID:', e);
      const fallback = generateRandom8DigitId();
      localStorage.setItem(`bse_duelist_id_${user.uid}`, fallback);
      return fallback;
    }
  }

  // ── 3. DUELIST SEARCH & TRACKING ──
  async function lookupDuelistById(eightDigitId) {
    const cleanId = String(eightDigitId).replace(/[^0-9]/g, '');
    if (cleanId.length !== 8) {
      return { success: false, error: 'Duelist ID must be an 8-digit number.' };
    }

    if (!db) {
      return { success: false, error: 'Cloud database not connected.' };
    }

    try {
      const doc = await db.collection('duelist_ids').doc(cleanId).get();
      if (!doc.exists) {
        return { success: false, error: `Duelist #${formatDuelistId(cleanId)} not found.` };
      }
      const data = doc.data();
      const userDoc = await db.collection('users').doc(data.uid).get();
      const userData = userDoc.exists ? userDoc.data() : {};

      return {
        success: true,
        duelist: {
          id: cleanId,
          formattedId: formatDuelistId(cleanId),
          username: data.username || 'Duelist',
          activeDeckName: userData.activeDeckName || 'Battle Spirits Deck',
          totalDuels: userData.totalDuels || 0,
          victories: userData.victories || 0
        }
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // ── 4. CLOUD DECK STORAGE (FIRESTORE) ──
  async function syncDeckToCloud(deck) {
    if (!currentUser || !db) return false;
    try {
      const deckRef = db.collection('users').doc(currentUser.uid).collection('decks').doc(deck.id);
      await deckRef.set({
        id: deck.id,
        name: deck.name,
        cards: deck.cards,
        color: deck.color || 'neutral',
        cardCount: deck.cardCount || 40,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return true;
    } catch (e) {
      console.warn('[Firebase] Failed to save deck to cloud:', e);
      return false;
    }
  }

  async function loadCloudDecks() {
    if (!currentUser || !db) return [];
    try {
      const snapshot = await db.collection('users').doc(currentUser.uid).collection('decks').get();
      const cloudDecks = [];
      snapshot.forEach(doc => cloudDecks.push(doc.data()));
      return cloudDecks;
    } catch (e) {
      console.warn('[Firebase] Failed to load decks from cloud:', e);
      return [];
    }
  }

  async function deleteCloudDeck(deckId) {
    if (!currentUser || !db) return false;
    try {
      await db.collection('users').doc(currentUser.uid).collection('decks').doc(deckId).delete();
      return true;
    } catch (e) {
      return false;
    }
  }

  // ── 5. AUTHENTICATION HELPERS ──
  async function signInWithEmail(email, password) {
    if (!auth) throw new Error('Firebase Auth not available');
    return await auth.signInWithEmailAndPassword(email, password);
  }

  async function signUpWithEmail(email, password, username) {
    if (!auth) throw new Error('Firebase Auth not available');
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    if (username && cred.user) {
      await cred.user.updateProfile({ displayName: username });
    }
    return cred;
  }

  async function signInAnonymously(guestName = 'Duelist') {
    if (!auth) throw new Error('Firebase Auth not available');
    const cred = await auth.signInAnonymously();
    if (cred.user) {
      await cred.user.updateProfile({ displayName: guestName });
    }
    return cred;
  }

  async function signOut() {
    if (!auth) return;
    return await auth.signOut();
  }

  function dispatchAuthEvent(eventName, payload) {
    window.dispatchEvent(new CustomEvent('bse_auth_state_change', {
      detail: { event: eventName, ...payload }
    }));
  }

  // Expose API
  window.FirebaseService = {
    init: initFirebase,
    isReady: () => isConfigured,
    getUser: () => currentUser,
    getDuelistId: () => currentDuelistId,
    getFormattedDuelistId: () => formatDuelistId(currentDuelistId),
    lookupDuelist: lookupDuelistById,
    syncDeck: syncDeckToCloud,
    loadDecks: loadCloudDecks,
    deleteDeck: deleteCloudDeck,
    login: signInWithEmail,
    register: signUpWithEmail,
    guestLogin: signInAnonymously,
    logout: signOut,
    getDatabase: () => rtdb,
    getFirestore: () => db
  };

  // Auto-init on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFirebase);
  } else {
    initFirebase();
  }

})(window);
