with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

auth_code = '''
// ═══════════════════ DUELIST AUTH MANAGER ═══════════════════
const AuthManager = {
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

  logout() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.renderNavbar();
    if (typeof showToast === 'function') {
      showToast('🛡️ Signed out of Colosseum account.', 'info');
    }
    if (window.location.pathname === '/login' || window.location.pathname === '/login.html' ||
        window.location.pathname === '/register' || window.location.pathname === '/register.html') {
      window.location.reload();
    }
  },

  renderNavbar() {
    const slot = document.getElementById('navAuthSlot');
    if (!slot) return;
    const user = this.getUser();
    if (user && user.username) {
      const safeName = String(user.username || 'Duelist').replace(/[<>&"']/g, '');
      const safeLogin = String(user.login || '').replace(/[<>&"']/g, '');
      slot.innerHTML = `
        <span class="nav-user-pill" title="Logged in as ${safeName} (${safeLogin})">
          <span class="user-shield">🛡️</span>
          <span class="user-name">${safeName}</span>
        </span>
        <button class="tab-btn-logout" id="btnLogout" onclick="AuthManager.logout()" title="Logout of Colosseum">
          <span>🚪 Logout</span>
        </button>
      `;
    } else {
      const isLoginPage = window.location.pathname === '/login' || window.location.pathname === '/login.html';
      const isRegPage = window.location.pathname === '/register' || window.location.pathname === '/register.html';
      const activeClass = (isLoginPage || isRegPage) ? ' active' : '';
      slot.innerHTML = `
        <a class="tab-btn tab-btn-auth${activeClass}" id="tabAuth" href="/login">👤 Login</a>
      `;
    }
  },

  init() {
    this.renderNavbar();
  }
};
'''

target = "document.addEventListener('DOMContentLoaded', () => {\r\n  updateDeckBadge();\r\n});"
if target not in content:
    target = "document.addEventListener('DOMContentLoaded', () => {\n  updateDeckBadge();\n});"

replacement = auth_code + "\n" + target.replace("updateDeckBadge();", "updateDeckBadge();\n  AuthManager.init();") + '''

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DeckManager,
    DeckManagerUI,
    AuthManager,
    formatEffectKeywordsInModal
  };
}
'''

assert target in content, 'Target not found in app.js'
new_content = content.replace(target, replacement)
with open('app.js', 'w', encoding='utf-8') as f:
    f.write(new_content)
print('Successfully updated app.js with AuthManager!')
