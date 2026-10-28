import urllib.request
import urllib.error
import json
import subprocess
import os
import sys

# Ensure utf-8 output
sys.stdout.reconfigure(encoding='utf-8')

# 1. Retrieve the saved GitHub OAuth token from Windows Credential Manager
p = subprocess.Popen(['git', 'credential', 'fill'], stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
out, _ = p.communicate('protocol=https\nhost=github.com\n')
token = ''
for line in out.splitlines():
    if line.startswith('password='):
        token = line.split('=', 1)[1]

if not token:
    print("Error: Could not retrieve GitHub token.")
    exit(1)

# 2. Check user profile
user_req = urllib.request.Request('https://api.github.com/user')
user_req.add_header('Authorization', f'Bearer {token}')
user_req.add_header('User-Agent', 'BattleSpiritsEternal-Agent')

with urllib.request.urlopen(user_req) as resp:
    user_data = json.loads(resp.read().decode('utf-8'))
    username = user_data.get('login')
    email = user_data.get('email')
    print(f"Authenticated as GitHub user: {username} ({email})")

repo_name = "Battle-Spirits-Eternal"

# 3. Create repository on GitHub via API
payload = {
    "name": repo_name,
    "description": "Battle Spirits Eternal - Complete Web-Based Battle Spirits TCG Game Engine, Deck Builder & Arena",
    "private": False,
    "has_issues": True,
    "has_projects": True,
    "has_wiki": True
}

req = urllib.request.Request(
    'https://api.github.com/user/repos',
    data=json.dumps(payload).encode('utf-8'),
    headers={
        'Authorization': f'Bearer {token}',
        'User-Agent': 'BattleSpiritsEternal-Agent',
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
    },
    method='POST'
)

repo_url = None
try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        repo_url = data.get('html_url')
        clone_url = data.get('clone_url')
        print(f"Successfully created repository: {repo_url}")
except urllib.error.HTTPError as e:
    err_body = e.read().decode('utf-8')
    if e.code == 422 and 'already exists' in err_body:
        print(f"Repository {repo_name} already exists under {username}. Proceeding to push...")
        clone_url = f"https://github.com/{username}/{repo_name}.git"
        repo_url = f"https://github.com/{username}/{repo_name}"
    else:
        print(f"HTTP {e.code}: {err_body}")
        exit(1)

# 4. Set git remote and credentials
subprocess.run(['git', 'config', 'user.name', username], check=True)
subprocess.run(['git', 'config', 'user.email', email or 'namishdestro@gmail.com'], check=True)

# Remove existing origin if any
subprocess.run(['git', 'remote', 'remove', 'origin'], stderr=subprocess.DEVNULL)

# Add origin
subprocess.run(['git', 'remote', 'add', 'origin', clone_url], check=True)
print(f"Configured git remote origin -> {clone_url}")

# 5. Push main branch
print("Pushing commits to GitHub...")
push_res = subprocess.run(['git', 'push', '-u', 'origin', 'main'], capture_output=True, text=True)
print(push_res.stdout)
if push_res.stderr:
    print(push_res.stderr)

if push_res.returncode == 0:
    print(f"\nSUCCESS: Pushed Battle Spirits Eternal to GitHub repository: {repo_url}")
else:
    print(f"Push exited with code {push_res.returncode}")
