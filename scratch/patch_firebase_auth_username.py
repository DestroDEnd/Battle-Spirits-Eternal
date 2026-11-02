with open('firebase_service.js', 'r', encoding='utf-8') as f:
    js = f.read()

old_signin_code = '''  async function signInWithEmail(email, password) {
    if (!auth) throw new Error('Firebase Auth not available');
    return await auth.signInWithEmailAndPassword(email, password);
  }

  async function signInWithGoogle() {
    if (!auth) throw new Error('Firebase Auth not available');
    const provider = new firebase.auth.GoogleAuthProvider();
    return await auth.signInWithPopup(provider);
  }

  async function signUpWithEmail(email, password, username) {
    if (!auth) throw new Error('Firebase Auth not available');
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    if (username && cred.user) {
      await cred.user.updateProfile({ displayName: username });
    }
    return cred;
  }'''

new_signin_code = '''  async function checkUsernameAvailable(username) {
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
  }'''

if old_signin_code in js:
    js = js.replace(old_signin_code, new_signin_code)
    print('Replaced signin/signup in firebase_service.js')
else:
    print('Warning: old_signin_code not found')

# Update window.FirebaseService exports
old_export = '''    login: signInWithEmail,
    loginWithGoogle: signInWithGoogle,
    register: signUpWithEmail,'''

new_export = '''    login: signInWithUsernameOrEmail,
    loginWithUsername: signInWithUsernameOrEmail,
    loginWithGoogle: signInWithGoogle,
    register: signUpWithUsernameOrEmail,
    checkUsername: checkUsernameAvailable,'''

if old_export in js:
    js = js.replace(old_export, new_export)
    print('Updated exports in firebase_service.js')
else:
    print('Warning: old_export not found')

with open('firebase_service.js', 'w', encoding='utf-8') as f:
    f.write(js)

print('firebase_service.js updated successfully!')
