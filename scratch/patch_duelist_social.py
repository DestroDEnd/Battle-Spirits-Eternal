import os

def patch():
    with open('app.js', 'r', encoding='utf-8') as f:
        code = f.read()

    duelist_social_code = '''// ═══════════════════ DUELIST SOCIAL & PROFILE CONTROLLER ═══════════════════
const DuelistSocial = {
  PRESETS: [
    { id: 'dragon', icon: '🐉', name: 'Emperor Dragon', desc: 'Red Flame' },
    { id: 'thunder', icon: '⚡', name: 'Storm King', desc: 'Lightning' },
    { id: 'warrior', icon: '⚔️', name: 'Nova Warrior', desc: 'Sword Master' },
    { id: 'arcana', icon: '🔮', name: 'Violet Mage', desc: 'Purple Sorcery' },
    { id: 'mecha', icon: '🤖', name: 'Iron Fortress', desc: 'White Armor' },
    { id: 'fairy', icon: '🌸', name: 'Mystic Fairy', desc: 'Yellow Song' },
    { id: 'colossus', icon: '🌊', name: 'Tide Colossus', desc: 'Blue Surge' },
    { id: 'gryphon', icon: '🦅', name: 'Wind Gryphon', desc: 'Green Swift' },
    { id: 'fiend', icon: '💀', name: 'Underworld Lord', desc: 'Dark Realm' },
    { id: 'emperor', icon: '👑', name: 'Grandwalker', desc: 'God Realm' },
    { id: 'paladin', icon: '🛡️', name: 'Aegis Paladin', desc: 'Shield Defender' },
    { id: 'cosmic', icon: '🌌', name: 'Eternal Nexus', desc: 'Cosmic Core' }
  ],

  getAvatar() {
    return localStorage.getItem('bse_user_avatar') || '🐉';
  },

  setAvatar(icon) {
    localStorage.setItem('bse_user_avatar', icon);
    if (window.FirebaseService && window.FirebaseService.updateAvatar) {
      window.FirebaseService.updateAvatar(icon);
    }
    AuthManager.renderNavbar();
    this.closeAvatarPicker();
    if (typeof showToast === 'function') {
      showToast('Avatar updated to ' + icon + '!', 'success');
    }
  },

  getFriends() {
    try {
      const raw = localStorage.getItem('bse_duelist_friends');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  saveFriends(friends) {
    localStorage.setItem('bse_duelist_friends', JSON.stringify(friends));
    this.updateFriendsBadge();
  },

  addFriend(friend) {
    if (!friend || !friend.id) return { success: false, error: 'Invalid friend details.' };
    const friends = this.getFriends();
    const cleanId = String(friend.id).replace(/[^0-9]/g, '');
    let myId = '';
    if (window.FirebaseService && window.FirebaseService.getFormattedDuelistId) {
      myId = window.FirebaseService.getFormattedDuelistId().replace(/[^0-9]/g, '');
    }
    if (cleanId === myId && myId.length === 8) {
      return { success: false, error: 'You cannot add yourself as a friend.' };
    }
    if (friends.some(f => String(f.id).replace(/[^0-9]/g, '') === cleanId)) {
      return { success: false, error: 'Already in your friends list.' };
    }
    const formatted = friend.formattedId || (cleanId.slice(0, 4) + '-' + cleanId.slice(4));
    const newFriend = {
      id: formatted,
      name: friend.name || friend.username || ('Duelist #' + formatted),
      avatar: friend.avatar || '⚔️',
      addedAt: Date.now()
    };
    friends.unshift(newFriend);
    this.saveFriends(friends);
    this.renderFriendsList();
    if (window.FirebaseService && window.FirebaseService.syncFriends) {
      window.FirebaseService.syncFriends(friends);
    }
    return { success: true, friend: newFriend };
  },

  removeFriend(friendId) {
    const cleanId = String(friendId).replace(/[^0-9]/g, '');
    let friends = this.getFriends();
    friends = friends.filter(f => String(f.id).replace(/[^0-9]/g, '') !== cleanId);
    this.saveFriends(friends);
    this.renderFriendsList();
    if (window.FirebaseService && window.FirebaseService.syncFriends) {
      window.FirebaseService.syncFriends(friends);
    }
    if (typeof showToast === 'function') {
      showToast('Friend removed from your list.', 'info');
    }
  },

  updateFriendsBadge() {
    const count = this.getFriends().length;
    const badge = document.getElementById('ddFriendCount');
    if (badge) badge.textContent = count;
  },

  toggleDropdown(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const wrapper = document.getElementById('navAvatarWrapper');
    if (wrapper) {
      wrapper.classList.toggle('open');
    }
  },

  closeDropdown() {
    const wrapper = document.getElementById('navAvatarWrapper');
    if (wrapper) {
      wrapper.classList.remove('open');
    }
  },

  copyId(id) {
    if (!id) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(id).then(() => {
        if (typeof showToast === 'function') {
          showToast('Copied Duelist ID #' + id + ' to clipboard!', 'success');
        }
      });
    }
  },

  openAvatarPicker() {
    this.closeDropdown();
    this.ensureModals();
    const modal = document.getElementById('bseAvatarModal');
    if (modal) {
      this.renderAvatarPicker();
      modal.classList.add('open');
    }
  },

  closeAvatarPicker() {
    const modal = document.getElementById('bseAvatarModal');
    if (modal) modal.classList.remove('open');
  },

  renderAvatarPicker() {
    const grid = document.getElementById('bseAvatarGrid');
    if (!grid) return;
    const current = this.getAvatar();
    grid.innerHTML = this.PRESETS.map(p => `
      <button class="avatar-option-btn ${p.icon === current ? 'active' : ''}" onclick="DuelistSocial.setAvatar('${p.icon}')" title="${p.name} (${p.desc})">
        <span class="avatar-option-emoji">${p.icon}</span>
        <span class="avatar-option-label">${p.name}</span>
      </button>
    `).join('');
  },

  openFriendsModal() {
    this.closeDropdown();
    this.ensureModals();
    const modal = document.getElementById('bseFriendsModal');
    if (modal) {
      this.renderFriendsList();
      modal.classList.add('open');
    }
  },

  closeFriendsModal() {
    const modal = document.getElementById('bseFriendsModal');
    if (modal) modal.classList.remove('open');
  },

  renderFriendsList() {
    const container = document.getElementById('bseFriendsListContainer');
    if (!container) return;
    const friends = this.getFriends();
    this.updateFriendsBadge();

    if (friends.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:2rem 1rem;color:#94a3b8;font-size:0.85rem;">
          <div style="font-size:2.2rem;margin-bottom:0.5rem;opacity:0.6;">👥</div>
          <div style="font-weight:700;color:#cbd5e1;margin-bottom:0.25rem;">No Friends Added Yet</div>
          <div>Enter an 8-digit Duelist ID above to add friends and challenge them to 1v1 duels!</div>
        </div>
      `;
      return;
    }

    container.innerHTML = friends.map(f => `
      <div class="friend-item">
        <div class="friend-info">
          <span class="friend-avatar">${f.avatar || '⚔️'}</span>
          <div>
            <div class="friend-name">${f.name.replace(/[<>&"']/g, '')}</div>
            <div class="friend-id">#${f.id.replace(/[<>&"']/g, '')}</div>
          </div>
        </div>
        <div class="friend-actions">
          <button class="btn-friend-challenge" onclick="DuelistSocial.challengeFriend('${f.id}')" title="Challenge to 1v1 Duel">⚔️ Challenge</button>
          <button class="btn-friend-del" onclick="DuelistSocial.removeFriend('${f.id}')" title="Remove Friend">✕</button>
        </div>
      </div>
    `).join('');
  },

  async addFriendFromInput() {
    const input = document.getElementById('bseFriendIdInput');
    if (!input || !input.value.trim()) return;
    const rawId = input.value.trim().replace(/[^0-9]/g, '');
    if (rawId.length !== 8) {
      if (typeof showToast === 'function') showToast('Please enter an 8-digit Duelist ID (e.g. 8492-0153)', 'warning');
      return;
    }

    let friendName = 'Duelist #' + rawId.slice(0, 4) + '-' + rawId.slice(4);
    let friendAvatar = '⚔️';

    if (window.FirebaseService && window.FirebaseService.lookupDuelistById) {
      try {
        const res = await window.FirebaseService.lookupDuelistById(rawId);
        if (res && res.success && res.duelist) {
          friendName = res.duelist.username || friendName;
        }
      } catch (e) {}
    }

    const result = this.addFriend({
      id: rawId,
      name: friendName,
      avatar: friendAvatar
    });

    if (result.success) {
      input.value = '';
      if (typeof showToast === 'function') {
        showToast('🤝 Added ' + result.friend.name + ' to friends!', 'success');
      }
    } else {
      if (typeof showToast === 'function') {
        showToast(result.error || 'Failed to add friend', 'error');
      }
    }
  },

  challengeFriend(duelistId) {
    this.closeFriendsModal();
    const clean = String(duelistId).replace(/[^0-9]/g, '');
    window.location.href = './arena.html?duelWith=' + clean;
  },

  async signOut() {
    this.closeDropdown();
    await AuthManager.logout();
  },

  ensureModals() {
    if (document.getElementById('bseAvatarModal')) return;

    const overlay = document.createElement('div');
    overlay.innerHTML = `
      <!-- Avatar Picker Modal -->
      <div class="bse-modal-overlay" id="bseAvatarModal" onclick="if(event.target===this)DuelistSocial.closeAvatarPicker()">
        <div class="bse-modal-card">
          <div class="bse-modal-header">
            <div class="bse-modal-title">🎨 Choose Duelist Avatar</div>
            <button class="bse-modal-close" onclick="DuelistSocial.closeAvatarPicker()">✕</button>
          </div>
          <div class="avatar-grid" id="bseAvatarGrid"></div>
        </div>
      </div>

      <!-- Friends Modal -->
      <div class="bse-modal-overlay" id="bseFriendsModal" onclick="if(event.target===this)DuelistSocial.closeFriendsModal()">
        <div class="bse-modal-card">
          <div class="bse-modal-header">
            <div class="bse-modal-title">👥 My Duelist Friends</div>
            <button class="bse-modal-close" onclick="DuelistSocial.closeFriendsModal()">✕</button>
          </div>
          <div class="friends-input-row">
            <input type="text" class="friends-input" id="bseFriendIdInput" placeholder="Enter 8-digit ID (e.g. 8492-0153)" maxlength="9">
            <button class="btn-friends-add" onclick="DuelistSocial.addFriendFromInput()">+ Add</button>
          </div>
          <div class="friends-list" id="bseFriendsListContainer"></div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }
};

if (typeof window !== 'undefined') {
  window.DuelistSocial = DuelistSocial;
  document.addEventListener('click', (e) => {
    const wrapper = document.getElementById('navAvatarWrapper');
    if (wrapper && !wrapper.contains(e.target)) {
      wrapper.classList.remove('open');
    }
  });
}
'''

    new_render_navbar = '''  renderNavbar() {
    const slot = document.getElementById('navAuthSlot');
    if (!slot) return;

    let fbUser = null;
    let duelistId = null;
    if (window.FirebaseService) {
      fbUser = window.FirebaseService.getUser();
      duelistId = window.FirebaseService.getFormattedDuelistId();
    }
    const localUser = this.getUser();
    const user = fbUser || localUser;

    if (user && (!user.isAnonymous || duelistId)) {
      const displayName = user.displayName || user.username || (user.email ? user.email.split('@')[0] : ('Duelist #' + (duelistId || '0000-0000')));
      const safeName = String(displayName).replace(/[<>&"']/g, '');
      const avatarIcon = window.DuelistSocial ? window.DuelistSocial.getAvatar() : '🐉';
      const friendCount = window.DuelistSocial ? window.DuelistSocial.getFriends().length : 0;
      const displayId = duelistId || '0000-0000';

      slot.innerHTML = `
        <div class="nav-avatar-wrapper" id="navAvatarWrapper">
          <button class="nav-avatar-btn" id="navAvatarBtn" onclick="DuelistSocial.toggleDropdown(event)" title="My Duelist Profile">
            <span class="nav-avatar-circle" id="navAvatarCircle">${avatarIcon}</span>
            <span class="nav-avatar-name">${safeName}</span>
            <span class="nav-avatar-caret">▼</span>
          </button>
          <div class="duelist-dropdown" id="duelistDropdown">
            <div class="dd-header">
              <div class="dd-avatar-row">
                <div class="dd-avatar-circle" id="ddAvatarCircle">${avatarIcon}</div>
                <div class="dd-user-meta">
                  <div class="dd-name">${safeName}</div>
                  <div class="dd-duelist-id">
                    <span>ID: #${displayId}</span>
                    <button class="dd-btn-copy" onclick="DuelistSocial.copyId('${displayId}')" title="Copy ID">📋</button>
                  </div>
                </div>
              </div>
            </div>
            <div class="dd-divider"></div>
            <div class="dd-menu">
              <button class="dd-item" onclick="DuelistSocial.openAvatarPicker()">
                <span class="dd-icon">🎨</span>
                <span>Change Avatar</span>
              </button>
              <button class="dd-item" onclick="DuelistSocial.openFriendsModal()">
                <span class="dd-icon">👥</span>
                <span>See Friends</span>
                <span class="dd-badge" id="ddFriendCount">${friendCount}</span>
              </button>
              <a class="dd-item" href="./deck.html">
                <span class="dd-icon">🃏</span>
                <span>Check Decks</span>
              </a>
              <div class="dd-divider"></div>
              <button class="dd-item dd-logout" onclick="DuelistSocial.signOut()">
                <span class="dd-icon">🚪</span>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      `;
      if (window.DuelistSocial) window.DuelistSocial.ensureModals();
    } else {
      const isLoginPage = window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('/login');
      const isRegPage = window.location.pathname.endsWith('register.html') || window.location.pathname.endsWith('/register');
      const activeClass = (isLoginPage || isRegPage) ? ' active' : '';
      slot.innerHTML = `
        <a class="tab-btn tab-btn-auth${activeClass}" id="tabAuth" href="./login.html">👤 Login</a>
      `;
    }
  },'''

    auth_idx = code.find('const AuthManager =')
    code = code[:auth_idx] + duelist_social_code + '\n' + code[auth_idx:]

    old_render_start = '  renderNavbar() {'
    old_render_end = '  init() {'
    render_start_idx = code.find(old_render_start)
    render_end_idx = code.find(old_render_end, render_start_idx)
    code = code[:render_start_idx] + new_render_navbar + '\n\n' + code[render_end_idx:]

    # Also export DuelistSocial in module.exports if present
    code = code.replace('AuthManager,', 'AuthManager,\n    DuelistSocial,')

    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(code)

    print('Patched app.js successfully')

if __name__ == '__main__':
    patch()
