import re

eff1 = """[LV1][LV2][LV3] (When Summoned)
For each other Spirit you control, put a core from the Void to this Spirit.

[LV2][LV3] (When Attacks)
When only the opposing Spirit is destroyed via BP comparison, send an opposing Life to their Reserve."""

eff2 = """[LV1][LV2][LV3] (When Summoned)
For each other Spirit you control, put a core from the Void to this Spirit.
[LV2][LV3] (When Attacks)
When only the opposing Spirit is destroyed via BP comparison, send an opposing Life to their Reserve."""

for name, text in [('Double Newline', eff1), ('Single Newline', eff2)]:
    print(f"\n--- {name} ---")
    blocks = [b.strip() for b in re.split(r'(?=\n\s*(?:\[LV\d+\]|LV\d+))', text, flags=re.I) if b.strip()]
    for i, b in enumerate(blocks):
        lvl_m = re.match(r'((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+)', b, re.I)
        lvl_tag = lvl_m.group(1) if lvl_m else None
        print(f"Block {i} (tag={lvl_tag}): {ascii(b[:50])}")
