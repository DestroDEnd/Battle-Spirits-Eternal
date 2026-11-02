with open('login.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Update form in login.html
old_divider = '<div class="auth-divider">\n        <span>Or sign in with email</span>\n      </div>'
new_divider = '<div class="auth-divider">\n        <span>Or sign in with username</span>\n      </div>'

if old_divider in html:
    html = html.replace(old_divider, new_divider)
else:
    # Try with single line
    import re
    html = re.sub(r'<div class="auth-divider">\s*<span>Or sign in with email</span>\s*</div>', new_divider, html)

# Replace Field 1
old_field1 = '''        <!-- Field 1: Email / Login ID -->
        <div class="auth-field">
          <label class="auth-label" for="loginInput">
            <span>📧</span> Email Address
          </label>
          <div class="auth-input-wrapper">
            <span class="auth-input-icon">📧</span>
            <input type="email" id="loginInput" class="auth-input" placeholder="duelist@example.com" required autofocus autocomplete="email">
          </div>
        </div>'''

new_field1 = '''        <!-- Field 1: Duelist Username -->
        <div class="auth-field">
          <label class="auth-label" for="loginInput">
            <span>👤</span> Duelist Username
          </label>
          <div class="auth-input-wrapper">
            <span class="auth-input-icon">👤</span>
            <input type="text" id="loginInput" class="auth-input" placeholder="e.g. DestroDend" required autofocus autocomplete="username">
          </div>
        </div>'''

if old_field1 in html:
    html = html.replace(old_field1, new_field1)
    print('Replaced field 1 in login.html')
else:
    import re
    html = re.sub(r'<!-- Field 1: Email / Login ID -->[\s\S]*?<\/div>\s*<\/div>', new_field1, html)
    print('Replaced field 1 in login.html via regex')

# Update handleEmailSignIn function
old_func = '''async function handleEmailSignIn(event) {
  event.preventDefault();
  clearAlert();

  const email = document.getElementById('loginInput').value.trim();
  const password = document.getElementById('passwordInput').value;
  const btn = document.getElementById('btnLoginSubmit');

  if (!email || !password) {
    showAlert('Please enter both your Email and Password.');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span>⏳ Verifying Credentials...</span>';

  try {
    if (window.FirebaseService) {
      await window.FirebaseService.login(email, password);
      const user = window.FirebaseService.getUser();
      showAlert(`Welcome back, Duelist ${user.displayName || email}!`, 'success');
      setTimeout(() => {
        window.location.href = './arena.html';
      }, 700);
    } else {
      throw new Error('Authentication service not connected.');
    }
  } catch (err) {
    console.error('Login error:', err);
    showAlert(err.message || 'Authentication failed. Please check your email and password.');
    btn.disabled = false;
    btn.innerHTML = '<span>⚔️ Enter Colosseum (Login)</span>';
  }
}'''

new_func = '''async function handleUserSignIn(event) {
  event.preventDefault();
  clearAlert();

  const username = document.getElementById('loginInput').value.trim();
  const password = document.getElementById('passwordInput').value;
  const btn = document.getElementById('btnLoginSubmit');

  if (!username || !password) {
    showAlert('Please enter your Duelist Username and Password.');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span>⏳ Verifying Duelist Credentials...</span>';

  try {
    if (window.FirebaseService) {
      await window.FirebaseService.login(username, password);
      const user = window.FirebaseService.getUser();
      const duelistId = window.FirebaseService.getFormattedDuelistId();
      showAlert(`Welcome back, Duelist ${user.displayName || username}! (ID: #${duelistId})`, 'success');
      setTimeout(() => {
        window.location.href = './arena.html';
      }, 700);
    } else {
      throw new Error('Authentication service not connected.');
    }
  } catch (err) {
    console.error('Login error:', err);
    if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
      showAlert('Incorrect password. Please verify your password.');
    } else {
      showAlert(err.message || 'Login failed. Please check your username and password.');
    }
    btn.disabled = false;
    btn.innerHTML = '<span>⚔️ Enter Colosseum (Login)</span>';
  }
}

// Keep handleEmailSignIn alias for compatibility
const handleEmailSignIn = handleUserSignIn;'''

if old_func in html:
    html = html.replace(old_func, new_func)
    print('Replaced handleEmailSignIn with handleUserSignIn')
else:
    print('Warning: old_func not found')

with open('login.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('login.html updated!')
