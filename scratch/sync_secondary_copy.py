import os
import shutil
import zipfile

src_dir = os.path.abspath('.')
dest_dir = os.path.abspath(os.path.join('..', 'BSP_backup'))
zip_path = os.path.abspath(os.path.join('..', 'BSP_backup.zip'))

# Copy every file from src_dir to dest_dir
copied = 0
for root, dirs, files in os.walk(src_dir):
    if '__pycache__' in root:
        continue
    rel_dir = os.path.relpath(root, src_dir)
    target_dir = os.path.join(dest_dir, rel_dir) if rel_dir != '.' else dest_dir
    os.makedirs(target_dir, exist_ok=True)
    for f in files:
        if f.endswith('.pyc'):
            continue
        sf = os.path.join(root, f)
        df = os.path.join(target_dir, f)
        if not os.path.exists(df) or os.path.getsize(sf) != os.path.getsize(df):
            shutil.copy2(sf, df)
            copied += 1

print(f"Synced {copied} files to {dest_dir}")

# Update zip archive
print("Updating zip archive...")
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(dest_dir):
        for f in files:
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, dest_dir)
            zipf.write(full_path, arcname=rel_path)

print("Zip archive updated!")
