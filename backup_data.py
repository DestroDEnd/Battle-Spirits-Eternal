import os
import sys
import shutil
import datetime

sys.stdout.reconfigure(encoding='utf-8')

def create_backup():
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_dir = os.path.join(os.getcwd(), 'backups', f'backup_{timestamp}')
    os.makedirs(backup_dir, exist_ok=True)
    
    critical_files = [
        'battle_spirits.db',
        'cards.db',
        'card_effects_db.json',
        'battle_arena.js',
        'app.js',
        'firebase_service.js',
        'standard_decks_data.json',
        'featured_x_rares.json',
        'filters_data.json',
        'styles.css'
    ]
    
    backed_up = []
    for f in critical_files:
        if os.path.exists(f):
            dest = os.path.join(backup_dir, f)
            shutil.copy2(f, dest)
            size_mb = os.path.getsize(dest) / (1024 * 1024)
            backed_up.append((f, f"{size_mb:.2f} MB"))
            
    print(f"✅ Successfully created backup at: {backup_dir}")
    for fname, sz in backed_up:
        print(f"  • {fname} ({sz})")
    return backup_dir

if __name__ == '__main__':
    create_backup()
