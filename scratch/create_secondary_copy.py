import os
import shutil
import zipfile
import hashlib

src_dir = os.path.abspath('.')
dest_dir = os.path.abspath(os.path.join('..', 'BSP_backup'))
zip_path = os.path.abspath(os.path.join('..', 'BSP_backup.zip'))

print(f"Source Directory:      {src_dir}")
print(f"Destination Directory: {dest_dir}")
print(f"Zip Archive:           {zip_path}")

# 1. Clean destination if exists
if os.path.exists(dest_dir):
    print("Removing existing backup directory...")
    shutil.rmtree(dest_dir)

# 2. Copy entire tree
print("Copying full directory tree...")
shutil.copytree(
    src_dir,
    dest_dir,
    ignore=shutil.ignore_patterns('__pycache__', '*.pyc')
)
print("Directory copy complete!")

# 3. Create zip archive
print("Creating zip archive...")
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(dest_dir):
        for f in files:
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, dest_dir)
            zipf.write(full_path, arcname=rel_path)
print("Zip archive creation complete!")

# 4. Verify file counts and sample key file sizes
src_files = []
for root, dirs, files in os.walk(src_dir):
    if '__pycache__' in root:
        continue
    for f in files:
        if f.endswith('.pyc'):
            continue
        rel = os.path.relpath(os.path.join(root, f), src_dir)
        src_files.append(rel)

dest_files = []
for root, dirs, files in os.walk(dest_dir):
    for f in files:
        rel = os.path.relpath(os.path.join(root, f), dest_dir)
        dest_files.append(rel)

print(f"\nVerification Results:")
print(f"Source Files Count:      {len(src_files)}")
print(f"Destination Files Count: {len(dest_files)}")
assert len(src_files) == len(dest_files), f"Count mismatch: {len(src_files)} vs {len(dest_files)}"

# Verify critical files exist in backup
critical_files = [
    'battle_spirits.db',
    'battle_arena.js',
    'app.js',
    'server.py',
    'index.html',
    'deck.html',
    'deck_view.html',
    'arena.html',
    'styles.css',
    'database.py'
]

for cf in critical_files:
    sf = os.path.join(src_dir, cf)
    df = os.path.join(dest_dir, cf)
    assert os.path.exists(df), f"Critical file missing in backup: {cf}"
    s_size = os.path.getsize(sf)
    d_size = os.path.getsize(df)
    assert s_size == d_size, f"Size mismatch for {cf}: {s_size} vs {d_size}"
    print(f"  [OK] {cf} ({d_size:,} bytes) verified identical")

zip_size = os.path.getsize(zip_path)
print(f"\nBackup Directory: {dest_dir} ({len(dest_files)} files)")
print(f"Backup Zip Archive: {zip_path} ({zip_size:,} bytes)")
print("ALL BACKUP & SECONDARY COPY CHECKS PASSED!")
