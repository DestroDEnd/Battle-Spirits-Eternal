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
  let analytics = null;
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
        if (typeof firebase.analytics === 'function') {
          try {
            analytics = firebase.analytics();
            console.log('[Firebase] Initialized Firebase Analytics successfully.');
          } catch(ae) {
            console.warn('[Firebase] Analytics warning:', ae);
          }
        }
        isConfigured = true;
        console.log('[Firebase] Initialized Firebase Services successfully.');

        // Listen for authentication changes
        auth.onAuthStateChanged(async (user) => {
          currentUser = user;
          if (user) {
            currentDuelistId = await getOrCreateDuelistId(user);
            console.log(`[Firebase] Signed in as ${user.displayName || user.email || 'Duelist'} (Duelist ID: ${formatDuelistId(currentDuelistId)})`);
            // Trigger UI sync
            dispatchAuthEvent('signed_in', { user, duelistId: currentDuelistId });
          } else {
            currentUser = null;
            currentDuelistId = null;
            dispatchAuthEvent('signed_out', {});
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

      const duelistName = user.displayName || (user.email ? user.email.split('@')[0] : ('Duelist ' + uniqueId.slice(0, 4)));

      const batch = db.batch();
      batch.set(userDocRef, {
        duelistId: uniqueId,
        username: duelistName,
        email: user.email || '',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      batch.set(db.collection('duelist_ids').doc(uniqueId), {
        uid: user.uid,
        username: duelistName,
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


  // ── 3b. AVATAR & FRIENDS SYNC ─────────────────────────────
  async function updateAvatar(avatarKey) {
    if (!currentUser || !db) return;
    try {
      await db.collection('users').doc(currentUser.uid).set({
        avatar: avatarKey,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn('[Firebase] Failed to save avatar to Firestore:', e);
    }
  }

  async function syncFriendsToCloud(friendsList) {
    if (!currentUser || !db) return;
    try {
      await db.collection('users').doc(currentUser.uid).set({
        friends: friendsList,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn('[Firebase] Failed to sync friends to Firestore:', e);
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
  async function checkUsernameAvailable(username) {
    if (!username || typeof username !== 'string') {
      return { available: false, error: 'Username is required.' };
    }
    const clean = username.trim();
    if (/\s/.test(clean)) {
      return { available: false, error: 'Username cannot contain any spaces.' };
    }
    if (clean.length < 3) {
      return { available: false, error: 'Username must be at least 3 characters long.' };
    }
    if (clean.length > 24) {
      return { available: false, error: 'Username cannot exceed 24 characters.' };
    }
    if (!/^[a-zA-Z0-9_\-\.]+$/.test(clean)) {
      return { available: false, error: 'Username can only contain letters, numbers, underscores, hyphens, and dots.' };
    }
    if (db) {
      try {
        const uDoc = await db.collection('usernames').doc(clean.toLowerCase()).get();
        if (uDoc.exists) {
          return { available: false, error: `The username "${clean}" is already taken by another Duelist.` };
        }
        const uQuery = await db.collection('users').where('username_lower', '==', clean.toLowerCase()).limit(1).get();
        if (!uQuery.empty) {
          return { available: false, error: `The username "${clean}" is already taken by another Duelist.` };
        }
      } catch (e) {
        console.warn('[Firebase] Username availability check warning:', e);
      }
    }
    return { available: true };
  }

  async function signInWithUsernameOrEmail(identifier, password) {
    if (!auth) throw new Error('Firebase Auth not available');
    const clean = String(identifier || '').trim();
    if (!clean) throw new Error('Please enter your username.');

    // If identifier contains @, it is directly an email
    if (clean.includes('@')) {
      return await auth.signInWithEmailAndPassword(clean, password);
    }

    // Lookup email associated with this username
    let resolvedEmail = null;
    const lower = clean.toLowerCase();

    if (db) {
      try {
        // 1. Check usernames collection
        const doc = await db.collection('usernames').doc(lower).get();
        if (doc.exists && doc.data() && doc.data().email) {
          resolvedEmail = doc.data().email;
        }

        // 2. Check users collection
        if (!resolvedEmail) {
          const snap = await db.collection('users').where('username_lower', '==', lower).limit(1).get();
          if (!snap.empty && snap.docs[0].data() && snap.docs[0].data().email) {
            resolvedEmail = snap.docs[0].data().email;
          }
        }
      } catch (e) {
        console.warn('[Firebase] Username lookup in Firestore warning:', e);
      }
    }

    // 3. Fallback: common cases
    if (!resolvedEmail) {
      if (lower === 'destrodend') {
        resolvedEmail = 'destrodend@gmail.com';
      } else {
        resolvedEmail = `${lower}@bsp-eternal.com`;
      }
    }

    try {
      return await auth.signInWithEmailAndPassword(resolvedEmail, password);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        throw new Error(`No Duelist account found for username "${clean}". Please create an account or verify spelling.`);
      }
      throw err;
    }
  }

  async function signInWithGoogle() {
    if (!auth) throw new Error('Firebase Auth not available');
    const provider = new firebase.auth.GoogleAuthProvider();
    return await auth.signInWithPopup(provider);
  }

  async function signUpWithUsernameOrEmail(arg1, arg2, arg3) {
    if (!auth) throw new Error('Firebase Auth not available');
    let username = '';
    let email = '';
    let password = '';

    if (arg1 && String(arg1).includes('@')) {
      // Called as (email, password, username)
      email = String(arg1).trim();
      password = arg2;
      username = arg3 ? String(arg3).trim() : email.split('@')[0];
    } else {
      // Called as (username, email, password)
      username = String(arg1).trim();
      email = (arg2 && String(arg2).includes('@')) ? String(arg2).trim() : `${username.toLowerCase()}@bsp-eternal.com`;
      password = arg3 || arg2;
    }

    const check = await checkUsernameAvailable(username);
    if (!check.available) {
      throw new Error(check.error);
    }

    const cred = await auth.createUserWithEmailAndPassword(email, password);
    if (cred.user) {
      try {
        await cred.user.updateProfile({ displayName: username });
      } catch (e) {}

      // Save to usernames and users collections
      if (db) {
        try {
          await db.collection('usernames').doc(username.toLowerCase()).set({
            uid: cred.user.uid,
            username: username,
            username_lower: username.toLowerCase(),
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });

          await db.collection('users').doc(cred.user.uid).set({
            username: username,
            username_lower: username.toLowerCase(),
            email: email,
            totalDuels: 0,
            victories: 0,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        } catch (e) {
          console.warn('[Firebase] Failed to write username to Firestore:', e);
        }
      }
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
    currentUser = null;
    currentDuelistId = null;
    if (auth) {
      try { await auth.signOut(); } catch(e) {}
    }
    dispatchAuthEvent('signed_out', {});
    return true;
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
    lookupDuelistById: lookupDuelistById,
    updateAvatar: updateAvatar,
    syncFriends: syncFriendsToCloud,
    syncDeck: syncDeckToCloud,
    loadDecks: loadCloudDecks,
    deleteDeck: deleteCloudDeck,
    login: signInWithUsernameOrEmail,
    loginWithUsername: signInWithUsernameOrEmail,
    loginWithGoogle: signInWithGoogle,
    register: signUpWithUsernameOrEmail,
    checkUsername: checkUsernameAvailable,
    guestLogin: signInAnonymously,
    logout: signOut,
    getDatabase: () => rtdb,
    getFirestore: () => db,
    getAnalytics: () => analytics
  };

  // Auto-init on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFirebase);
  } else {
    initFirebase();
  }

})(window);
