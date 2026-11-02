with open('login.html', 'r', encoding='utf-8') as f:
    html = f.read()

idx1 = html.find('async function handleGoogleSignIn')
idx2 = html.find('async function handleEmailSignIn')

clean_func = """async function handleGoogleSignIn() {
  clearAlert();
  if (!window.FirebaseService) {
    showAlert('Firebase cloud services are initializing. Please try again in a second.');
    return;
  }
  const btn = document.getElementById('btnGoogleLogin');
  btn.disabled = true;
  btn.style.opacity = '0.7';

  try {
    showAlert('Connecting to Google...', 'success');
    await window.FirebaseService.loginWithGoogle();
    const user = window.FirebaseService.getUser();
    const duelistId = window.FirebaseService.getFormattedDuelistId();
    showAlert(`Welcome, ${user.displayName || user.email}! Duelist ID: #${duelistId}`, 'success');
    setTimeout(() => {
      window.location.href = './arena.html';
    }, 800);
  } catch (err) {
    console.error('Google Auth Error:', err);
    if (err.code === 'auth/unauthorized-domain') {
      showAlert('⚠️ Domain Not Authorized: In Firebase Console, go to Authentication > Settings > Authorized Domains, and add "destrodend.github.io".');
    } else {
      showAlert(err.message || 'Google sign-in was cancelled or encountered an error.');
    }
  } finally {
    btn.disabled = false;
    btn.style.opacity = '1';
  }
}

"""

html = html[:idx1] + clean_func + html[idx2:]

with open('login.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('login.html cleaned up! guest in login.html:', 'guest' in html.lower())
