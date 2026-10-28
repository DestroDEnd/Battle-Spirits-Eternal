import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('app.js', 'r', encoding='utf-8') as f:
    text = f.read()

old_timing = r"safe = safe.replace(/\((When Attacks(?:\/[^)]+)?|When Summoned(?:\/[^)]+)?|When Advents(?:\/[^)]+)?|When Destroyed|When Blocks|Twinkle Necromancy|Your Attack Step|Opponent's Attack Step|Either Attack Step|Main Step|Refresh Step|Start Step|Core Step|Draw Step|End Step)\)/gi, (match) => {"
new_timing = r"safe = safe.replace(/\((When Attacks(?:\/[^)]+)?|When Summoned(?:\/[^)]+)?|When Advents(?:\/[^)]+)?|When Battles(?:\/[^)]+)?|When Blocks(?:\/[^)]+)?|When Manifests(?:\/[^)]+)?|When Reborn(?:\/[^)]+)?|When Destroyed(?:\/[^)]+)?|When Brave Attacks(?:\/[^)]+)?|After Your Burst Activates|After a Burst Activates|After your Burst activates|After an? opposing [^)]+|Twinkle Necromancy|Your Attack Step|Opponent's Attack Step|Opposing Attack Step|Either Attack Step|Main Step|Refresh Step|Start Step|Core Step|Draw Step|End Step)\)/gi, (match) => {"

if old_timing in text:
    text = text.replace(old_timing, new_timing)
    with open('app.js', 'w', encoding='utf-8', newline='') as f:
        f.write(text)
    print("Updated app.js formatEffectKeywordsInModal!")
else:
    print("Timing pattern not found in app.js!")
