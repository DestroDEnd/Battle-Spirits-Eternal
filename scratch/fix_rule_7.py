import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    text = f.read()

target_rule_7 = "} else if (/put\\s+(a|an|one|two|three|\\d+)\\s+cores?\\s+from\\s+the\\s+void\\s+to\\s+this\\s+spirit/i.test(bodyLower)) {"
repl_rule_7 = "} else if (/put\\s+(a|an|one|two|three|\\d+)\\s+cores?\\s+from\\s+the\\s+void\\s+to\\s+this\\s+spirit/i.test(bodyLower) && !/for each (?:spirit|other spirit) depleted/i.test(bodyLower)) {"

if target_rule_7 in text:
    text = text.replace(target_rule_7, repl_rule_7, 1)
    with open('battle_arena.js', 'w', encoding='utf-8', newline='') as f:
        f.write(text)
    print("Successfully prevented Rule 7 conflict with Desperado Rule 18!")
else:
    print("target_rule_7 not found!")
