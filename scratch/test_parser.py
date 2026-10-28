import re

kingtaurus_effect = """[LV1][LV2][LV3] (When Summoned)
For each other Spirit you control, put a core from the Void to this Spirit.

[LV2][LV3] (When Attacks)
When only the opposing Spirit is destroyed via BP comparison, send an opposing Life to their Reserve."""

def parse_levels(lvl_str):
    matches = re.findall(r'\[LV(\d+)\]', lvl_str)
    if matches:
        return [int(m) for m in matches]
    m_range = re.search(r'LV(\d+)-LV(\d+)', lvl_str)
    if m_range:
        return list(range(int(m_range.group(1)), int(m_range.group(2)) + 1))
    return [1, 2, 3]

def test_kingtaurus(effect):
    # Test When Summoned block
    summoned_m = re.search(r'(\[LV[^\]]+\]+)?\s*\(When Summoned\)\s*([\s\S]*?)(?=\n\s*\n|\[LV|$)', effect, re.I)
    if summoned_m:
        levels = parse_levels(summoned_m.group(1) or '')
        body = summoned_m.group(2).strip()
        print(f"When Summoned levels: {levels}")
        print(f"When Summoned body: '{body}'")
        
        # Check Void ramp for each other spirit
        m_each_other = re.search(r'for each other spirit you control.*?put a core from the void to this spirit', body, re.I)
        print("Matches each other spirit ramp:", bool(m_each_other))

    # Test When Attacks / BP comparison block
    bp_comp_m = re.search(r'(\[LV[^\]]+\]+)?\s*\(When Attacks\)\s*([\s\S]*?)(?=\n\s*\n|\[LV|$)', effect, re.I)
    if bp_comp_m:
        levels = parse_levels(bp_comp_m.group(1) or '')
        body = bp_comp_m.group(2).strip()
        print(f"When Attacks levels: {levels}")
        print(f"When Attacks body: '{body}'")

        m_bp_life = re.search(r'when only the opposing spirit is destroyed via bp comparison.*?send an opposing life to their reserve', body, re.I)
        print("Matches BP comparison life burn:", bool(m_bp_life))

test_kingtaurus(kingtaurus_effect)
