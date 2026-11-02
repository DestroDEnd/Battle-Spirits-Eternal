with open('battle_arena.js', 'r', encoding='utf-8') as f:
    text = f.read()

old_s = "triggerName !== 'DESTROY' && triggerName !== 'BP_DESTRUCTION'"
new_s = "!triggerName.startsWith('DESTROY') && triggerName !== 'BP_DESTRUCTION'"

if old_s in text:
    text = text.replace(old_s, new_s, 1)
    with open('battle_arena.js', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Updated triggerName check successfully!")
else:
    print("Target not found")
