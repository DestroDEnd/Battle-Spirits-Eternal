# 1. Update firebase_service.js
with open('firebase_service.js', 'r', encoding='utf-8') as f:
    fb_code = f.read()

old_auth_else = '''          } else {
            // Auto sign-in anonymously for instant multiplayer / duelist ID support
            try {
              await auth.signInAnonymously();
            } catch (guestErr) {
              // Local fallback if anonymous auth isn't enabled yet
              currentDuelistId = localStorage.getItem('bse_local_duelist_id') || generateRandom8DigitId();
              localStorage.setItem('bse_local_duelist_id', currentDuelistId);
              dispatchAuthEvent('offline_guest', { duelistId: currentDuelistId });
            }
          }'''

new_auth_else = '''          } else {
            currentUser = null;
            currentDuelistId = null;
            dispatchAuthEvent('signed_out', {});
          }'''

if old_auth_else in fb_code:
    fb_code = fb_code.replace(old_auth_else, new_auth_else)
    print('Updated onAuthStateChanged in firebase_service.js')
else:
    print('Warning: old_auth_else not found in firebase_service.js')

old_signout_func = '''  async function signOut() {
    if (!auth) return;
    return await auth.signOut();
  }'''

new_signout_func = '''  async function signOut() {
    currentUser = null;
    currentDuelistId = null;
    if (auth) {
      try { await auth.signOut(); } catch(e) {}
    }
    dispatchAuthEvent('signed_out', {});
    return true;
  }'''

if old_signout_func in fb_code:
    fb_code = fb_code.replace(old_signout_func, new_signout_func)
    print('Updated signOut in firebase_service.js')
else:
    print('Warning: old_signout_func not found in firebase_service.js')

with open('firebase_service.js', 'w', encoding='utf-8') as f:
    f.write(fb_code)

# 2. Update app.js
with open('app.js', 'r', encoding='utf-8') as f:
    app_code = f.read()

old_auth_mgr = '''const AuthManager = {
  STORAGE_KEY: 'bsp_duelist_user',

  getUser() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  setUser(user) {
    if (!user) {
      localStorage.removeItem(this.STORAGE_KEY);
    } else {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    }
    this.renderNavbar();
  },

  async logout() {
    localStorage.removeItem(this.STORAGE_KEY);
    if (window.FirebaseService) {
      try { await window.FirebaseService.logout(); } catch(e) {}
    }
    this.renderNavbar();
    if (typeof showToast === 'function') {
      showToast('?? Signed out of Colosseum account.', 'info');
    }
    if (window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('register.html')) {
      window.location.reload();
    }
  },'''

new_auth_mgr = '''const AuthManager = {
  STORAGE_KEY: 'bsp_duelist_user',

  getUser() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  setUser(user) {
    if (!user) {
      localStorage.removeItem(this.STORAGE_KEY);
    } else {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    }
    this.renderNavbar();
  },

  clearBrowserUserData() {
    // Normal cleanup of user profile, decks, friends, and session without wiping the offline card database
    const USER_KEYS = [
      'bsp_duelist_user',              // Current user auth session
      'bs_user_decks_v2',              // Stored user custom decks
      'battle_spirits_deck_v1',         // In-progress deck builder state
      'bs_deck',                       // Active deck cache
      'deckbuilder_selected_deck_id',  // Selected deck cursor
      'bse_user_avatar',               // Chosen avatar
      'bse_duelist_friends',           // Friends list
      'bse_local_duelist_id',          // Local assigned duelist ID
      'bse_keep_std_red',              // Seeding flag
      'colosseum_p1_deck_id',          // Selected arena player deck
      'colosseum_opponent_deck_id'     // Selected arena opponent deck
    ];

    USER_KEYS.forEach(k => {
      try { localStorage.removeItem(k); } catch(e) {}
      try { sessionStorage.removeItem(k); } catch(e) {}
    });

    // Reset in-memory deck state
    if (typeof S !== 'undefined') {
      S.deck = {};
    }
    if (typeof updateDeckBadge === 'function') {
      updateDeckBadge();
    }
    if (typeof renderDeckList === 'function') {
      renderDeckList();
    }
  },

  async logout() {
    this.clearBrowserUserData();
    if (window.FirebaseService) {
      try { await window.FirebaseService.logout(); } catch(e) {}
    }
    this.renderNavbar();
    if (typeof showToast === 'function') {
      showToast('Signed out. Local decks and user session data have been cleared.', 'info');
    }
    if (window.location.pathname.endsWith('login.html') || 
        window.location.pathname.endsWith('register.html') || 
        window.location.pathname.endsWith('deck.html') || 
        window.location.pathname.endsWith('arena.html')) {
      setTimeout(() => {
        window.location.reload();
      }, 350);
    }
  },'''

if old_auth_mgr in app_code:
    app_code = app_code.replace(old_auth_mgr, new_auth_mgr)
    print('Updated AuthManager in app.js')
else:
    # Try with single-byte emoji representation
    import re
    app_code = re.sub(r'const AuthManager = \{[\s\S]*?renderNavbar\(\) \{', new_auth_mgr + '\n\n  renderNavbar() {', app_code)
    print('Updated AuthManager via regex in app.js')

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(app_code)

print('app.js and firebase_service.js updated successfully!')
