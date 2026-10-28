import re

eff = """[LV1][LV2][LV3] (When Summoned)
For each other Spirit you control, put a core from the Void to this Spirit.

[LV2][LV3] (When Attacks)
When only the opposing Spirit is destroyed via BP comparison, send an opposing Life to their Reserve."""

blocks = [b.strip() for b in eff.split('\n\n') if b.strip()]
print("Blocks count:", len(blocks))
for i, b in enumerate(blocks):
    print(f"Block {i}:")
    print(b)
    m = re.match(r'((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+)?\s*(?:\((?:When Attacks|When Summoned|When Blocks)\)|『.*?』)?\s*([\s\S]*)', b, re.I)
    if m:
        print("  Level tag:", m.group(1))
        print("  Body:", ascii(m.group(2)[:40]))
