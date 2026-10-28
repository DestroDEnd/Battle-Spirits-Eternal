import re

def parse_levels(tag_str):
    if not tag_str:
        return [1, 2, 3]
    matches = re.findall(r'\[LV(\d+)\]', tag_str, re.I)
    if matches:
        return [int(m) for m in matches]
    m_range = re.search(r'LV(\d+)[-~]LV(\d+)', tag_str, re.I)
    if m_range:
        return list(range(int(m_range.group(1)), int(m_range.group(2)) + 1))
    m_single = re.search(r'LV(\d+)', tag_str, re.I)
    if m_single:
        return [int(m_single.group(1))]
    return [1, 2, 3]

text1 = "[LV1][LV2][LV3] (When Summoned)"
m1 = re.search(r'((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+)?\s*\(When Summoned\)', text1, re.I)
print("Tag str 1:", repr(m1.group(1)))
print("Parsed 1:", parse_levels(m1.group(1)))

text2 = "[LV2][LV3] (When Attacks)"
m2 = re.search(r'((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+)?\s*\(When Attacks\)', text2, re.I)
print("Tag str 2:", repr(m2.group(2) if m2.lastindex >= 2 else m2.group(1)))
print("Parsed 2:", parse_levels(m2.group(1)))
