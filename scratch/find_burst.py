with open('battle_arena.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('scratch/burst_lines.txt', 'w', encoding='utf-8') as out:
    for i, l in enumerate(lines):
        if any(k in l for k in ['checkBurstTrigger', 'setBurst', 'activateBurst', 'openBurst', 'burstPrompt', 'canSetBurst']):
            out.write(f"{i+1}: {l.strip()[:110]}\n")

print("Done writing burst_lines.txt")
