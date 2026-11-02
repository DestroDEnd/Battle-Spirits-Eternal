with open('register.html', 'r', encoding='utf-8') as f:
    html = f.read()

idx1 = html.find('async function handleRegisterSubmit')
idx2 = html.find('</script>', idx1)

new_script = '''// Prevent spacebar input in username field
document.addEventListener('DOMContentLoaded', () => {
  const usernameInput = document.getElementById('regUsername');
  const hint = document.getElementById('usernameHint');
  if (usernameInput) {
    usernameInput.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        showAlert('⚠️ Username cannot contain spaces anywhere.');
        if (hint) hint.style.color = '#f87171';
      }
    });

    usernameInput.addEventListener('input', () => {
      if (/\\s/.test(usernameInput.value)) {
        usernameInput.value = usernameInput.value.replace(/\\s+/g, '');
        showAlert('⚠️ Spaces were automatically removed from username.');
      }
      if (hint) {
        hint.style.color = usernameInput.value.length >= 3 ? '#94a3b8' : '#f87171';
      }
    });
  }
});

async function handleRegisterSubmit(event) {
  event.preventDefault();
  clearAlert();

  const rawUsername = document.getElementById('regUsername').value;
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const btn = document.getElementById('btnRegisterSubmit');

  // Strict Validation: No spaces anywhere
  if (/\\s/.test(rawUsername)) {
    showAlert('⚠️ Username cannot contain spaces anywhere. Please remove all spaces.');
    return;
  }

  const username = rawUsername.trim();
  if (!username) {
    showAlert('Please enter a Duelist Username.');
    return;
  }

  if (username.length < 3) {
    showAlert('⚠️ Username must be at least 3 characters long.');
    return;
  }

  if (username.length > 24) {
    showAlert('⚠️ Username cannot exceed 24 characters.');
    return;
  }

  if (!/^[a-zA-Z0-9_\\-\\.]+$/.test(username)) {
    showAlert('⚠️ Username can only contain letters, numbers, hyphens, dots, and underscores.');
    return;
  }

  if (!email || !password) {
    showAlert('Please fill in all registration fields.');
    return;
  }

  if (password.length < 6) {
    showAlert('Password must be at least 6 characters.');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span>⏳ Checking Username & Creating Account...</span>';

  try {
    if (window.FirebaseService) {
      // 1. Verify username uniqueness
      if (window.FirebaseService.checkUsername) {
        const check = await window.FirebaseService.checkUsername(username);
        if (!check.available) {
          throw new Error(check.error || 'This username is already taken. Please choose another.');
        }
      }

      // 2. Register account with username + email
      await window.FirebaseService.register(username, email, password);
      const duelistId = window.FirebaseService.getFormattedDuelistId();
      showAlert(`🎉 Account created! Welcome, Duelist ${username} (ID: #${duelistId})`, 'success');
      setTimeout(() => {
        window.location.href = './arena.html';
      }, 800);
    } else {
      throw new Error('Firebase Authentication is initializing.');
    }
  } catch (err) {
    console.error('Registration error:', err);
    if (err.code === 'auth/email-already-in-use') {
      showAlert('This email is already in use. Please sign in or use another email.');
    } else {
      showAlert(err.message || 'Failed to create account. Please verify your details.');
    }
    btn.disabled = false;
    btn.innerHTML = '<span>⚔️ Create Duelist Account</span>';
  }
}
'''

html = html[:idx1] + new_script + html[idx2:]

with open('register.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('register.html updated successfully!')
