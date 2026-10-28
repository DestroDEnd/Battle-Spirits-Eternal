import re
import html

def extract_template_fields_robust(wikitext):
    """
    Brace-depth and bracket-depth aware wikitext template parser.
    Extracts key=value fields from {{CardTable...}} without prematurely
    closing on nested templates like {{tk|...}} or [[file:...]].
    """
    if not wikitext:
        return {}
        
    m = re.search(r'\{\{(CardTable\d*|CardTable)\b', wikitext, re.IGNORECASE)
    start = m.start() if m else wikitext.find('{{')
    if start == -1:
        return {}
    
    content = wikitext[start + 2:]
    depth_curly = 1
    depth_square = 0
    
    fields = {}
    current_key = None
    current_val_chars = []
    
    i = 0
    n = len(content)
    
    while i < n:
        # Check double curly braces
        if content[i:i+2] == '{{':
            depth_curly += 1
            if current_key:
                current_val_chars.append('{{')
            i += 2
            continue
        elif content[i:i+2] == '}}':
            depth_curly -= 1
            if depth_curly == 0:
                if current_key:
                    fields[current_key] = "".join(current_val_chars).strip()
                break
            if current_key:
                current_val_chars.append('}}')
            i += 2
            continue
        
        # Check double square brackets
        if content[i:i+2] == '[[':
            depth_square += 1
            if current_key:
                current_val_chars.append('[[')
            i += 2
            continue
        elif content[i:i+2] == ']]':
            if depth_square > 0:
                depth_square -= 1
            if current_key:
                current_val_chars.append(']]')
            i += 2
            continue
        
        # At top-level (depth_curly == 1 and depth_square == 0), pipe denotes a field delimiter
        if depth_curly == 1 and depth_square == 0 and content[i] == '|':
            if current_key:
                fields[current_key] = "".join(current_val_chars).strip()
            i += 1
            
            # Look ahead for "key ="
            eq_pos = -1
            for j in range(i, min(i + 50, n)):
                if content[j] in ('\n', '|', '{', '}'):
                    break
                if content[j] == '=':
                    eq_pos = j
                    break
                    
            if eq_pos != -1:
                potential_key = content[i:eq_pos].strip()
                if re.match(r'^[a-zA-Z0-9_#]+$', potential_key):
                    current_key = potential_key.lower()
                    current_val_chars = []
                    i = eq_pos + 1
                    continue
                    
            current_key = None
            current_val_chars = []
            continue
            
        if current_key:
            current_val_chars.append(content[i])
        i += 1

    return fields


def clean_card_effect(text):
    """
    Cleans raw wikitext card effect into readable, accurate Battle Spirits card text.
    Preserves all reminder text in parentheses (...), converts wiki templates
    ({{tk|...}}, {{gs|...}}, {{Advent|...}}, etc.) into clean bracketed text [Keyword],
    and resolves errata / tabbers properly.
    """
    if not text:
        return ''

    # 1. Errata / Tabbers: {{#tag:tabber|...}} or <tabber>...</tabber>
    if '{{#tag:tabber' in text or '{{#tag: tabber' in text or '<tabber>' in text:
        t_work = text.replace('{{!}}', '|')
        t_work = re.sub(r'^\s*\{\{#tag:\s*tabber\s*\|\s*', '', t_work, flags=re.IGNORECASE)
        t_work = re.sub(r'</?tabber>', '', t_work, flags=re.IGNORECASE)
        t_work = re.sub(r'\s*\}\}\s*$', '', t_work)
        
        tab_chunks = re.split(r'\s*\|\-\|\s*', t_work)
        chosen_body = None
        
        # Priority: Post-Errata > English Errata > Errata > Card Text > First non-empty
        for tab in tab_chunks:
            eq = tab.find('=')
            title = tab[:eq].strip().lower() if eq != -1 else ''
            body = tab[eq+1:].strip() if eq != -1 else tab.strip()
            if 'post-errata' in title and len(body) > 5:
                chosen_body = body
                break
        
        if not chosen_body:
            for tab in tab_chunks:
                eq = tab.find('=')
                title = tab[:eq].strip().lower() if eq != -1 else ''
                body = tab[eq+1:].strip() if eq != -1 else tab.strip()
                if ('errata' in title or 'english' in title) and len(body) > 5:
                    chosen_body = body
                    break
                    
        if not chosen_body:
            for tab in tab_chunks:
                eq = tab.find('=')
                body = tab[eq+1:].strip() if eq != -1 else tab.strip()
                if len(body) > 5:
                    chosen_body = body
                    break
                    
        if chosen_body:
            text = chosen_body

    # 2. Ruby tags: {{ruby|base|ruby}} -> base
    text = re.sub(r'\{\{ruby\|([^|]+)\|[^}]+\}\}', r'\1', text, flags=re.IGNORECASE)

    # 3. File / image embeds inside text (e.g. [[file:Green core.png|20px]])
    def _clean_img_embed(m):
        fn = m.group(1).lower()
        if 'soul' in fn:
            return '[Soul Core]'
        if 'core' in fn:
            for col in ['red', 'purple', 'green', 'white', 'yellow', 'blue']:
                if col in fn:
                    return f'[{col.capitalize()} Core]'
            return '[Core]'
        for col in ['red', 'purple', 'green', 'white', 'yellow', 'blue']:
            if col in fn and 'symbol' in fn:
                return f'[{col.capitalize()} Symbol]'
        return ''
    text = re.sub(r'\[\[(?:File|file|Image|image):([^|\]]+)(?:\|[^\]]*)?\]\]', _clean_img_embed, text)

    # 4. Grandwalker Rule template {{tk|GWrule}}
    gw_rule = (
        "[Grandwalker Nexus]\n"
        "This Nexus can only be affected by effects that target Grandwalker Nexuses. "
        "Cores can only be placed on this Nexus via Core Charge or effects that target Grandwalker Nexuses, "
        "and cannot be moved from this Nexus except via effects that target Grandwalker Nexuses."
    )
    text = re.sub(r'\{\{tk\|GWrule\}\}', gw_rule, text, flags=re.IGNORECASE)

    # 5. Core Charge templates: {{tk|Core Charge:|arg1}} or {{tk|Core Charge:}}
    text = re.sub(r'\{\{tk\|Core Charge:\s*\|([^}]+)\}\}', r'[Core Charge: \1]', text, flags=re.IGNORECASE)
    text = re.sub(r'\{\{tk\|Core Charge:\}\}', '[Core Charge]', text, flags=re.IGNORECASE)

    # 6. Grand Skill & Grand Field: {{gs|X}} or {{tk|Grand Field}}
    text = re.sub(r'\{\{gs\|([0-9]+)[^}]*\}\}', r'[Grand Skill: \1]', text, flags=re.IGNORECASE)
    text = re.sub(r'\{\{tk\|Grand\s*Field\}\}', '[Grand Field]', text, flags=re.IGNORECASE)
    text = re.sub(r'\{\{tk\|Grand\s*Skill\}\}', '[Grand Skill]', text, flags=re.IGNORECASE)

    # 7. Target keywords {{tk|...}}
    def _replace_tk(m):
        raw = m.group(1).strip()
        parts = [p.strip() for p in raw.split('|') if p.strip()]
        if not parts:
            return ''
        first = parts[0]
        if first.lower() == 'n+1':
            return '[Brave Symbol +1]'
        if len(parts) == 1:
            return f"[{first}]"
        return f"[{first}: {' '.join(parts[1:])}]"
    text = re.sub(r'\{\{tk\|([^}]+)\}\}', _replace_tk, text, flags=re.IGNORECASE)

    # 8. Named ability templates (Advent, Burst, Mirage, Accel, Change, Tribute, etc.)
    named_map = {
        'advent': 'Advent', 'utadvent': 'Ultimate-Advent',
        'burst': 'Burst', 'mirage': 'Mirage',
        'accel': 'Accel', 'giga accel': 'Giga Accel',
        'change': 'Change', 'tribute': 'Tribute',
        'contract': 'Contract', 'seal': 'Seal',
        'rush': 'Rush', 'assault': 'Assault',
        'excite': 'Excite', 'sumcon': 'Summon Condition',
        'digiv': 'Digivolve', 'armdigiv': 'Armor Digivolve', 'spdigiv': 'Warp Digivolve',
        'ha': 'Heavy Armor', 'uha': 'Ultimate Heavy Armor', 'armor': 'Armor',
        'g-break': 'G-Break'
    }
    def _replace_named(m):
        tname = m.group(1).strip().lower()
        disp = named_map.get(tname, tname.capitalize())
        body = m.group(2).strip()
        parts = [p.strip() for p in body.split('|') if p.strip()]
        if not parts:
            return f"[{disp}]"
        if len(parts) == 1:
            return f"[{disp}: {parts[0]}]"
        if len(parts) == 2:
            return f"[{disp}: {parts[0]}] ({parts[1]})"
        return f"[{disp}: {parts[0]}] ({', '.join(parts[1:])})"
    named_re = '|'.join(re.escape(k) for k in named_map.keys())
    text = re.sub(rf'\{{\{{({named_re})\s*\|([^}}]+)\}}\}}', _replace_named, text, flags=re.IGNORECASE)

    # 9. Simple keyword flags and core/symbol templates
    text = re.sub(r'\{\{mflash\}\}', '[Mirage Flash]', text, flags=re.IGNORECASE)
    text = re.sub(r'\{\{mmain\}\}', '[Mirage Main]', text, flags=re.IGNORECASE)
    text = re.sub(
        r'\{\{symbol\|([^|]+)(?:\|([0-9]+))?\}\}',
        lambda m: f"[{m.group(1).capitalize()} Symbol" + (f" x{m.group(2)}]" if m.group(2) else "]"),
        text,
        flags=re.IGNORECASE
    )
    text = re.sub(r'\{\{(soul\s*core|soulcore|ssoul)\}\}', '[Soul Core]', text, flags=re.IGNORECASE)
    text = re.sub(r'\{\{core\}\}', '[Core]', text, flags=re.IGNORECASE)
    text = re.sub(r'\{\{c\}\}', '[Count]', text, flags=re.IGNORECASE)

    # 10. Generic remaining templates {{template_name|arg1|arg2}}
    def _replace_generic(m):
        raw = m.group(1).strip()
        parts = [p.strip() for p in raw.split('|') if p.strip()]
        if not parts:
            return ''
        if len(parts) > 1 and len(parts[0]) <= 3:
            return ' '.join(parts[1:])
        return f"[{parts[0]}: {', '.join(parts[1:])}]" if len(parts) > 1 else f"[{parts[0]}]"
    text = re.sub(r'\{\{([^}]+)\}\}', _replace_generic, text)

    # 11. HTML line breaks, tags, and entities
    text = re.sub(r'<br\s*/?>', '\n', text, flags=re.IGNORECASE)
    text = re.sub(r'</?(?:span|font|div|b|i|strong|em|p)[^>]*>', '', text, flags=re.IGNORECASE)
    text = html.unescape(text)
    text = text.replace('&rarr;', '→').replace('&larr;', '←').replace('&amp;', '&').replace('&quot;', '"').replace('&nbsp;', ' ')
    text = text.replace('&lt;', '<').replace('&gt;', '>')

    # 12. Wiki links: [[Article|Text]] -> Text, [[Article]] -> Article
    text = re.sub(r'\[\[(?:[^|\]]*\|)?([^\]]+)\]\]', r'\1', text)

    # 13. Bold / italic wiki quotes
    text = re.sub(r"'''?", '', text)

    # 14. Normalize whitespace and newlines, preserving reminder text parentheses
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    lines = [line.strip() for line in text.splitlines()]
    return '\n'.join(lines).strip()


def clean_wikitext_general(text):
    """
    General cleaner for non-effect fields (levels, flavor, kanji, etc.).
    Preserves parentheses, converts <br> to newlines, resolves wiki links and HTML entities.
    """
    if not text:
        return ''
    text = re.sub(r'<br\s*/?>', '\n', text, flags=re.IGNORECASE)
    text = re.sub(r'</?(?:span|font|div|b|i|strong|em|p)[^>]*>', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\[\[(?:[^|\]]*\|)?([^\]]+)\]\]', r'\1', text)
    text = re.sub(r'\{\{ruby\|([^|]+)\|[^}]+\}\}', r'\1', text, flags=re.IGNORECASE)
    text = re.sub(r'\{\{[^}]+\}\}', '', text)
    text = re.sub(r"'''?", '', text)
    text = html.unescape(text)
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    lines = [line.strip() for line in text.splitlines()]
    return '\n'.join(lines).strip()
