with open('firebase_service.js', 'r', encoding='utf-8') as f:
    c = f.read()

target = """    // Lookup email associated with this username
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
    }"""

replacement = """    // Lookup email associated with this username
    let resolvedEmail = null;
    const lower = clean.toLowerCase();
    const noSpaceLower = lower.replace(/\\s+/g, '');

    if (db) {
      try {
        // 1. Check usernames collection (both verbatim and space-stripped)
        let doc = await db.collection('usernames').doc(lower).get();
        if (!doc.exists && noSpaceLower !== lower) {
          doc = await db.collection('usernames').doc(noSpaceLower).get();
        }
        if (doc.exists && doc.data() && doc.data().email) {
          resolvedEmail = doc.data().email;
        }

        // 2. Check users collection
        if (!resolvedEmail) {
          let snap = await db.collection('users').where('username_lower', '==', lower).limit(1).get();
          if (snap.empty && noSpaceLower !== lower) {
            snap = await db.collection('users').where('username_lower', '==', noSpaceLower).limit(1).get();
          }
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
      if (noSpaceLower === 'destrodend') {
        resolvedEmail = 'destrodend@gmail.com';
      } else {
        resolvedEmail = `${noSpaceLower}@bsp-eternal.com`;
      }
    }"""

c_norm = c.replace('\r\n', '\n')
t_norm = target.replace('\r\n', '\n')
r_norm = replacement.replace('\r\n', '\n')

assert t_norm in c_norm, "Target not found in normalized content!"
c_patched = c_norm.replace(t_norm, r_norm)

with open('firebase_service.js', 'w', encoding='utf-8') as f:
    f.write(c_patched)

print("firebase_service.js patched successfully!")
