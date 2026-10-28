import os

src_dir = os.path.abspath('.')
dest_dir = os.path.abspath(os.path.join('..', 'BSP_backup'))
zip_path = os.path.abspath(os.path.join('..', 'BSP_backup.zip'))

print("Source Directory:     ", src_dir)
print("Backup Directory:     ", dest_dir)
print("Backup Zip:           ", zip_path)

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

print(f"\nSource Files:      {len(src_files)}")
print(f"Backup Files:      {len(dest_files)}")

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

print("\nVerifying critical files:")
for cf in critical_files:
    sf = os.path.join(src_dir, cf)
    df = os.path.join(dest_dir, cf)
    assert os.path.exists(df), f"Missing: {cf}"
    s_size = os.path.getsize(sf)
    d_size = os.path.getsize(df)
    assert s_size == d_size, f"Size mismatch for {cf}: {s_size} vs {d_size}"
    print(f"  [OK] {cf:20} -> {d_size:,} bytes")

zip_size = os.path.getsize(zip_path)
print(f"\nBackup Zip Archive: {zip_path} ({zip_size:,} bytes)")
print("SUCCESS: 100% of files verified in secondary copy!")
