import re

with open('login.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Remove the Guest button
btn_guest_pattern = r'\s*<button type="button" class="btn-guest-auth" id="btnGuestLogin" onclick="handleGuestSignIn\(\)">[\s\S]*?<\/button>'
html = re.sub(btn_guest_pattern, '', html)

# 2. Remove .btn-guest-auth CSS
css_pattern = r'\s*\.btn-guest-auth \{[\s\S]*?\.btn-guest-auth:hover \{[\s\S]*?\}'
html = re.sub(css_pattern, '', html)

# 3. Remove handleGuestSignIn function
js_pattern = r'\s*async function handleGuestSignIn\(\) \{[\s\S]*?\}\n'
html = re.sub(js_pattern, '', html)

# 4. Enhance handleGoogleSignIn error handling
old_google_err = '''  } catch (err) {
    console.error('Google Auth Error:', err);
    showAlert(err.message || 'Google Sign-in failed. Please try again.');
  } finally {
    btn.disabled = false;
    btn.style.opacity = '1';
  }'''

new_google_err = '''  } catch (err) {
    console.error('Google Auth Error:', err);
    if (err.code === 'auth/unauthorized-domain') {
      showAlert('⚠️ Domain Not Authorized: In Firebase Console, go to Authentication > Settings > Authorized Domains, and add: destrodend.github.io');
    } else {
      showAlert(err.message || 'Google Sign-in failed. Please try again.');
    }
  } finally {
    btn.disabled = false;
    btn.style.opacity = '1';
  }'''

if old_google_err in html:
    html = html.replace(old_google_err, new_google_err)
else:
    print('Warning: old_google_err not exact match, checking regex')

with open('login.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('login.html updated: Play as Guest removed!')
