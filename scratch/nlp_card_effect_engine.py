"""
NLP Card Effect Categorization & Extraction Engine
Inspired by Yoon Kim (2014) Convolutional Neural Networks for Sentence Classification.
Processes all cards in battle_spirits.db, tokenizes effect sentences, classifies them into
semantic action categories, extracts parameters, and compiles a universal effects database.
"""

import sqlite3
import json
import re
import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def word_to_num(w):
    mapping = {
        'one': 1, 'a': 1, 'an': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
        'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
    }
    w = str(w).lower().strip()
    if w.isdigit():
        return int(w)
    return mapping.get(w, 1)

def extract_level_req(block_header):
    levels = []
    for m in re.finditer(r'\[LV(\d+)\]', block_header, re.IGNORECASE):
        levels.append(int(m.group(1)))
    return min(levels) if levels else 1

def categorize_clause(clause, header_timing):
    """
    NLP semantic classifier for an effect clause.
    Uses n-gram pattern detectors (analogous to TextCNN feature filters)
    to classify the clause into an action category and extract parameters.
    """
    text = clause.strip()
    lower = text.lower()
    actions = []

    # 1. DRAW CARDS: "draw X card(s) from your deck" / "you can draw X card" / "reveal X cards"
    draw_match = re.search(r'(?:you can\s+)?draw\s+(a|an|one|two|three|four|five|\d+)\s+cards?', lower)
    if draw_match:
        count = word_to_num(draw_match.group(1))
        actions.append({
            'type': 'DRAW_CARDS',
            'count': count,
            'desc': f'Draw {count} card(s) from deck'
        })
    elif re.search(r'reveal\s+(a|an|one|two|three|four|five|\d+)\s+cards?\s+from\s+(?:the\s+|your\s+)?deck(?:top)?', lower):
        m = re.search(r'reveal\s+(a|an|one|two|three|four|five|\d+)\s+cards?\s+from\s+(?:the\s+|your\s+)?deck(?:top)?', lower)
        count = word_to_num(m.group(1))
        actions.append({
            'type': 'SEARCH_DECK',
            'count': count,
            'desc': f'Reveal {count} cards from decktop and add matching cards to Hand'
        })

    # 2. CORE BOOST: "put/place/add X core(s) from the void/trash to your reserve/this spirit/nexus"
    core_boost_match = re.search(r'(?:put|place|add|move|send)\s+(a|an|one|two|three|\d+)\s+cores?\s+from\s+(?:the\s+)?(void|trash|reserve)\s+to\s+(?:your\s+)?(reserve|this spirit|this nexus|a spirit|your life)', lower)
    if core_boost_match:
        count = word_to_num(core_boost_match.group(1))
        src = core_boost_match.group(2)
        dst = core_boost_match.group(3)
        actions.append({
            'type': 'CORE_BOOST',
            'count': count,
            'source': src,
            'destination': 'life' if 'life' in dst else ('spirit' if 'spirit' in dst else ('nexus' if 'nexus' in dst else 'reserve')),
            'desc': f'Move {count} core(s) from {src} to {dst}'
        })

    # 3. CORE DRAIN: "send X core(s) from an opposing spirit/nexus to reserve/trash/void"
    core_drain_match = re.search(r'send\s+(?:up to\s+)?(a|an|one|two|three|\d+)\s+cores?\s+from\s+(?:an|any|one|\d+)?\s*opposing\s+(spirit|nexus|ultimate).*?to\s+(?:the\s+|their\s+)?(reserve|trash|void)', lower)
    if core_drain_match:
        count = word_to_num(core_drain_match.group(1))
        target_kind = core_drain_match.group(2)
        dest = core_drain_match.group(3)
        actions.append({
            'type': 'CORE_DRAIN',
            'count': count,
            'target': target_kind,
            'destination': dest,
            'desc': f'Send {count} core(s) from opposing {target_kind} to {dest}'
        })

    # 4. DESTROY SPIRIT: "destroy X opposing spirit(s) with Y BP or less / cost Y or less"
    destroy_bp_match = re.search(r'destroy\s+(?:up to\s+)?(a|an|one|two|three|\d+)?\s*opposing\s+spirits?\s+(?:with\s+)?(\d+)\s*bp\s+or\s+(?:less|lower)', lower)
    if destroy_bp_match:
        count = word_to_num(destroy_bp_match.group(1)) if destroy_bp_match.group(1) else 1
        max_bp = int(destroy_bp_match.group(2))
        actions.append({
            'type': 'DESTROY_SPIRIT_BP',
            'count': count,
            'max_bp': max_bp,
            'desc': f'Destroy {count} opposing Spirit(s) with {max_bp} BP or less'
        })
    elif re.search(r'destroy\s+(?:up to\s+)?(a|an|one|two|three|\d+)?\s*opposing\s+spirits?\s+(?:with\s+)?cost\s+(\d+)\s+or\s+(?:less|lower)', lower):
        m = re.search(r'destroy\s+(?:up to\s+)?(a|an|one|two|three|\d+)?\s*opposing\s+spirits?\s+(?:with\s+)?cost\s+(\d+)\s+or\s+(?:less|lower)', lower)
        count = word_to_num(m.group(1)) if m.group(1) else 1
        max_cost = int(m.group(2))
        actions.append({
            'type': 'DESTROY_SPIRIT_COST',
            'count': count,
            'max_cost': max_cost,
            'desc': f'Destroy {count} opposing Spirit(s) with Cost {max_cost} or less'
        })
    elif re.search(r'destroy\s+(?:up to\s+)?(a|an|one|two|three|\d+)?\s*(?:exhausted\s+)?opposing\s+spirits?', lower):
        m = re.search(r'destroy\s+(?:up to\s+)?(a|an|one|two|three|\d+)?\s*(exhausted\s+)?opposing\s+spirits?', lower)
        count = word_to_num(m.group(1)) if m.group(1) else 1
        is_exhausted = bool(m.group(2))
        actions.append({
            'type': 'DESTROY_SPIRIT_DIRECT',
            'count': count,
            'require_exhausted': is_exhausted,
            'desc': f'Destroy {count} {"exhausted " if is_exhausted else ""}opposing Spirit(s)'
        })

    # 5. DESTROY NEXUS: "destroy an opposing nexus"
    if re.search(r'destroy\s+(?:an|one|\d+)?\s*opposing\s+nexus', lower):
        actions.append({
            'type': 'DESTROY_NEXUS',
            'desc': 'Destroy 1 opposing Nexus'
        })

    # 6. BP BUFF: "gains +X BP" / "this spirit gets +X BP"
    bp_buff_match = re.search(r'(?:gains?|gets?)\s*\+?(\d+)\s*bp', lower)
    if bp_buff_match:
        bp_amount = int(bp_buff_match.group(1))
        target = 'self' if 'this spirit' in lower or 'self' in lower else ('all' if 'all' in lower else 'target')
        actions.append({
            'type': 'BP_BUFF',
            'amount': bp_amount,
            'target': target,
            'desc': f'{target.capitalize()} gains +{bp_amount} BP'
        })

    # 7. BP DEBUFF: "give an opposing spirit -X BP" / "opposing spirits get -Y BP"
    bp_debuff_match = re.search(r'(?:give\s+(?:an?\s+)?opposing\s+(?:spirit|ultimate).*?-\s*(\d+)\s*bp)|(?:opposing\s+spirits?\s+(?:gets?|gains?)\s*-(\d+)\s*bp)', lower)
    if bp_debuff_match:
        bp_down = int(bp_debuff_match.group(1) or bp_debuff_match.group(2))
        actions.append({
            'type': 'BP_DEBUFF',
            'amount': bp_down,
            'desc': f'Opposing Spirit gets -{bp_down} BP'
        })

    # 8. RETURN TO HAND: "return X opposing spirits to hand" / "return to hand"
    bounce_match = re.search(r'return\s+(?:up to\s+)?(a|an|one|two|three|\d+)?\s*opposing\s+spirits?\s+to\s+(?:the\s+|their\s+)?hand', lower)
    if bounce_match:
        count = word_to_num(bounce_match.group(1)) if bounce_match.group(1) else 1
        actions.append({
            'type': 'RETURN_TO_HAND',
            'count': count,
            'desc': f'Return {count} opposing Spirit(s) to Hand'
        })

    # 9. RETURN TO DECKBOTTOM: "return X opposing spirits to the bottom of the deck"
    if re.search(r'return\s+.*?opposing\s+spirits?\s+to\s+(?:the\s+)?bottom\s+of\s+(?:the\s+)?deck', lower):
        actions.append({
            'type': 'RETURN_TO_DECKBOTTOM',
            'desc': 'Return opposing Spirit to bottom of Deck'
        })

    # 10. EXHAUST OPPOSING SPIRIT: "exhaust X opposing spirit(s)"
    exhaust_match = re.search(r'exhaust\s+(?:up to\s+)?(a|an|one|two|three|\d+)?\s*opposing\s+spirits?', lower)
    if exhaust_match:
        count = word_to_num(exhaust_match.group(1)) if exhaust_match.group(1) else 1
        actions.append({
            'type': 'EXHAUST_ENEMY',
            'count': count,
            'desc': f'Exhaust {count} opposing Spirit(s)'
        })

    # 11. REFRESH: "refresh this spirit" / "refresh X of your spirits"
    if re.search(r'refresh\s+this\s+spirit', lower):
        actions.append({
            'type': 'REFRESH_SELF',
            'desc': 'Refresh this Spirit'
        })
    elif re.search(r'refresh\s+(?:up to\s+)?(a|an|one|two|three|\d+)?\s*(?:of\s+your\s+)?spirits?', lower):
        m = re.search(r'refresh\s+(?:up to\s+)?(a|an|one|two|three|\d+)?\s*(?:of\s+your\s+)?spirits?', lower)
        count = word_to_num(m.group(1)) if m.group(1) else 1
        actions.append({
            'type': 'REFRESH_ALLIES',
            'count': count,
            'desc': f'Refresh {count} Spirit(s)'
        })

    # 12. DIRECT LIFE DAMAGE: "send 1 core from opposing life to reserve/void" / "deal 1 damage to opposing life"
    if re.search(r'(?:send|move)\s+(a|an|one|two|\d+)\s+cores?\s+from\s+(?:the\s+)?opposing\s+life\s+to\s+(?:the\s+)?(reserve|trash|void)', lower) or re.search(r'deal\s+(\d+)\s+damage\s+to\s+opposing\s+life', lower):
        actions.append({
            'type': 'LIFE_BURN',
            'amount': 1,
            'desc': 'Inflict 1 direct damage to opposing Life'
        })

    # 13. HOLY LIFE / LIFE HEAL: "put 1 core from the void to your life"
    if re.search(r'(?:put|place|add)\s+(a|an|one|two|\d+)\s+cores?\s+from\s+(?:the\s+)?void\s+to\s+(?:your\s+)?life', lower):
        actions.append({
            'type': 'HOLY_LIFE_HEAL',
            'amount': 1,
            'desc': 'Channeled Sacred Light: Place 1 core from Void to Life'
        })

    # 14. CANNOT BE BLOCKED / UNBLOCKABLE: "cannot be blocked" / "can't be blocked"
    if re.search(r'(?:cannot|can\'t)\s+be\s+blocked', lower) or re.search(r'unblockable', lower):
        actions.append({
            'type': 'CANNOT_BE_BLOCKED',
            'desc': 'This Spirit cannot be blocked'
        })

    # 15. CANNOT BLOCK / CANNOT ATTACK OPPOSING
    if re.search(r'opposing\s+spirits?\s+(?:cannot|can\'t)\s+attack', lower):
        actions.append({
            'type': 'OPPONENT_CANNOT_ATTACK',
            'desc': 'Opposing Spirits cannot attack'
        })
    elif re.search(r'opposing\s+spirits?\s+(?:cannot|can\'t)\s+block', lower):
        actions.append({
            'type': 'OPPONENT_CANNOT_BLOCK',
            'desc': 'Opposing Spirits cannot block'
        })

    # 16. FREE SUMMON: "summon X from trash/hand without paying the cost" / "summon this card without paying the cost"
    free_summon_match = re.search(r'summon\s+(?:this\s+card|a|an|one|\d+)?\s*(.*?)\s*(?:card\s+)?from\s+(?:your\s+)?(trash|hand|deck)?\s*,?\s*without\s+paying\s+(?:the\s+)?cost', lower)
    if free_summon_match:
        card_desc = free_summon_match.group(1).strip()
        src = free_summon_match.group(2) or 'hand'
        actions.append({
            'type': 'SUMMON_FREE',
            'source': src,
            'target_desc': card_desc,
            'desc': f'Summon {card_desc or "Card"} from {src} without paying cost'
        })

    # 17. SYMBOL GRANT: "gains 1 additional symbol" / "gains a red/purple symbol"
    symbol_match = re.search(r'gains?\s+(?:an?\s+)?(?:additional\s+)?(red|purple|green|white|yellow|blue)?\s*symbols?', lower)
    if symbol_match:
        sym_col = symbol_match.group(1) or 'self'
        actions.append({
            'type': 'GRANT_SYMBOL',
            'color': sym_col,
            'desc': f'Gains +1 {sym_col.capitalize()} Symbol'
        })

    # 18. IMMUNITY / UNAFFECTED
    if re.search(r'unaffected\s+by\s+(?:opposing\s+)?(spirits?|magics?|effects?)', lower):
        actions.append({
            'type': 'IMMUNITY',
            'desc': 'Unaffected by opposing effects'
        })

    return actions

def parse_card_effects(card_name, card_type, effect_text):
    """
    Parses a full card's effect string into structured trigger-keyed actions.
    """
    if not effect_text or not effect_text.strip():
        return {}

    lines = effect_text.split('\n')
    parsed_triggers = {}

    current_timing = 'PASSIVE'
    current_level = 1
    current_burst_cond = None

    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            continue

        # Check Burst declaration
        burst_match = re.match(r'\[Burst:\s*([^\]]+)\]', line, re.IGNORECASE)
        if burst_match:
            current_timing = 'BURST'
            current_burst_cond = burst_match.group(1).strip()
            continue

        # Check timing headers like: [LV1][LV2] (When Summoned)
        # or [LV2] (When Attacks), (When Deployed), [Flash], etc.
        header_match = re.match(r'^((\[LV\d+\])+)?\s*(\([^\)]+\)|\[Flash\]|\[Main\])?', line, re.IGNORECASE)
        line_body = line
        timing_found = None
        min_lvl = 1

        if header_match:
            lvl_part = header_match.group(1)
            tim_part = header_match.group(3)

            if lvl_part:
                min_lvl = extract_level_req(lvl_part)

            timings_list = []
            if tim_part:
                tp_lower = tim_part.lower()
                if 'when summoned' in tp_lower or 'summon' in tp_lower:
                    timings_list.append('WHEN_SUMMONED')
                if 'when attacks' in tp_lower or 'attack' in tp_lower:
                    timings_list.append('WHEN_ATTACKS')
                if 'when blocks' in tp_lower or 'block' in tp_lower or 'battles' in tp_lower:
                    timings_list.append('WHEN_BLOCKS')
                    if 'battles' in tp_lower and 'WHEN_ATTACKS' not in timings_list:
                        timings_list.append('WHEN_ATTACKS')
                if 'when destroyed' in tp_lower or 'destroyed' in tp_lower:
                    timings_list.append('WHEN_DESTROYED')
                if 'when deployed' in tp_lower or 'deployed' in tp_lower:
                    timings_list.append('WHEN_DEPLOYED')
                if 'when advents' in tp_lower or 'advent' in tp_lower:
                    timings_list.append('WHEN_ADVENTS')
                if 'flash' in tp_lower:
                    timings_list.append('FLASH')
                if 'start of' in tp_lower:
                    timings_list.append('START_OF_TURN')
                if 'end of battle' in tp_lower or 'at the end of the battle' in tp_lower:
                    timings_list.append('END_OF_BATTLE')
                elif 'end of' in tp_lower:
                    timings_list.append('END_OF_TURN')

            if timings_list:
                current_timings = timings_list
                current_level = min_lvl
                line_body = line[header_match.end():].strip()
            else:
                current_timings = [current_timing]
        else:
            current_timings = [current_timing]

        # If card is Nexus and no explicit timing, default to WHEN_DEPLOYED for deploy triggers or PASSIVE
        if 'nexus' in (card_type or '').lower():
            if 'when deployed' in line.lower() and 'WHEN_DEPLOYED' not in current_timings:
                current_timings = ['WHEN_DEPLOYED']

        # If card is Magic and no header:
        if (card_type or '').lower() == 'magic':
            if '[flash]' in line.lower() or '(flash)' in line.lower():
                current_timings = ['FLASH']
            elif '[main]' in line.lower() or '(main)' in line.lower():
                current_timings = ['MAIN']

        # Break line_body into sentences/clauses
        clauses = re.split(r'\.\s+|\n|;', line_body)
        for c in clauses:
            c = c.strip()
            if not c:
                continue
            for t_time in current_timings:
                actions = categorize_clause(c, t_time)
                if actions:
                    if t_time not in parsed_triggers:
                        parsed_triggers[t_time] = []
                    for act in actions:
                        act['min_level'] = current_level
                        if t_time == 'BURST' and current_burst_cond:
                            act['burst_condition'] = current_burst_cond
                        parsed_triggers[t_time].append(act)

    return parsed_triggers

def main():
    print("🚀 Initializing NLP Card Effect Extraction Engine across 14,529 cards...")
    db_path = 'battle_spirits.db'
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    c.execute("SELECT name, type, effect, cost, color, levels FROM cards")
    rows = c.fetchall()

    print(f"Loaded {len(rows)} total cards from {db_path}.")

    effects_map = {}
    stats = {
        'total': len(rows),
        'with_effects': 0,
        'parsed_actions_count': 0,
        'action_counts': {}
    }

    for name, ctype, effect, cost, color, levels in rows:
        if not effect or not effect.strip():
            continue
        stats['with_effects'] += 1
        parsed = parse_card_effects(name, ctype, effect)
        if parsed:
            effects_map[name] = {
                'type': ctype,
                'color': color,
                'cost': cost,
                'triggers': parsed
            }
            for trig, acts in parsed.items():
                for act in acts:
                    stats['parsed_actions_count'] += 1
                    atype = act['type']
                    stats['action_counts'][atype] = stats['action_counts'].get(atype, 0) + 1

    print(f"\n✅ Processing complete!")
    print(f"Cards with parsed operational effects: {len(effects_map)} / {stats['with_effects']}")
    print(f"Total structured action operations extracted: {stats['parsed_actions_count']}")
    print("\nTop Action Categories Extracted:")
    sorted_actions = sorted(stats['action_counts'].items(), key=lambda x: x[1], reverse=True)
    for act, count in sorted_actions[:15]:
        print(f"  • {act}: {count} occurrences")

    # Save to JSON
    out_json = 'card_effects_db.json'
    with open(out_json, 'w', encoding='utf-8') as f:
        json.dump(effects_map, f, ensure_ascii=False, indent=2)
    print(f"\n💾 Saved compiled universal effects database to {out_json} ({os.path.getsize(out_json):,} bytes)")

if __name__ == '__main__':
    main()
