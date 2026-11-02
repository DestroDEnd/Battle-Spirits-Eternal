with open('battle_arena.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('scratch/targets_out.txt', 'w', encoding='utf-8') as out:
    def find_block(name, start_str, num_lines=15):
        for i, l in enumerate(lines):
            if start_str in l:
                out.write(f"--- MATCH for {name} ({start_str}) at line {i+1} ---\n")
                for j in range(i, min(len(lines), i+num_lines)):
                    out.write(repr(lines[j]) + "\n")
                return i
        out.write(f"--- NOT FOUND: {name} ({start_str}) ---\n")
        return -1

    find_block("1", "spirit.currentBp = (spirit.baseBp || 0)")
    find_block("2", "function shuffle(array)")
    find_block("3", "return `")
    find_block("4", "const isSpirit = card.type === 'Spirit'")
    find_block("5", "if (canPlayStep && isSpirit)")
    find_block("8", "function executeAbilityActions")
    find_block("9", "function castMagic(uid")
    find_block("11", "function openTargetModal")
    find_block("12", "card.graveyardReason = reason")
    find_block("13", "resultMsg = `DEFENDED!")
    find_block("14", "deployNexus")

print("Done writing targets_out.txt")
