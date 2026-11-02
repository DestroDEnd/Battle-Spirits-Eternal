"""
Comprehensive NLP Card Effect Categorization & Extraction Engine
Parses all 14,529 cards in battle_spirits.db, tokenizes effect sentences, classifies them into
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

def extract_level_req(text):
    levels = [int(m.group(1)) for m in re.finditer(r'\[LV(\d+)\]', text, re.I)]
    return min(levels) if levels else 1

def categorize_clause(clause, header_timing):
    text = clause.strip()
    text = re.sub(r'^[◆•\-\*\s]+', '', text)
    lower = text.lower()
    actions = []

    # 1. DRAW CARDS / DRAW UNTIL / SEARCH DECK
    draw_match = re.search(r'(?:you can\s+)?draw\s+(a|an|one|two|three|four|five|six|\d+)\s+cards?', lower)
    if draw_match:
        count = word_to_num(draw_match.group(1))
        actions.append({
            'type': 'DRAW_CARDS',
            'count': count,
            'desc': f'Draw {count} card(s) from deck'
        })
    elif re.search(r'draw\s+until\s+you\s+have\s+(\d+)\s+cards', lower):
        m = re.search(r'draw\s+until\s+you\s+have\s+(\d+)\s+cards', lower)
        target_hand = int(m.group(1))
        actions.append({
            'type': 'DRAW_UNTIL',
            'target_hand': target_hand,
            'desc': f'Draw until you have {target_hand} cards in Hand'
        })
    elif re.search(r'(?:you can\s+)?(?:reveal|look at)\s+(a|an|one|two|three|four|five|six|\d+)\s+cards?\s+from\s+(?:the\s+|your\s+)?deck(?:top)?', lower):
        m = re.search(r'(?:you can\s+)?(?:reveal|look at)\s+(a|an|one|two|three|four|five|six|\d+)\s+cards?\s+from\s+(?:the\s+|your\s+)?deck(?:top)?', lower)
        count = word_to_num(m.group(1))
        actions.append({
            'type': 'SEARCH_DECK',
            'count': count,
            'desc': f'Reveal {count} cards from decktop and add matching cards to Hand'
        })

    # 2. CORE BOOST
    core_boost_match = (
        re.search(r'(?:you can\s+)?(?:put|place|add|move|send)\s+(a|an|one|two|three|four|\d+)?\s*cores?\s+from\s+(?:the\s+)?(void|trash|reserve)\s+(?:each\s+)?(?:on|onto|to)\s+(?:your\s+)?(reserve|this spirit|this nexus|this ultimate|any of your spirit|any of your spirits|a spirit|your nexus|your life)', lower) or
        re.search(r'(?:put|place|add|move|send)\s+a\s+core\s+from\s+(?:the\s+)?(void|trash|reserve)\s+(?:each\s+)?to\s+(?:your\s+)?(.*)', lower)
    )
    if core_boost_match:
        c_str = core_boost_match.group(1) if core_boost_match.lastindex >= 3 else '1'
        count = word_to_num(c_str) if c_str else 1
        src = core_boost_match.group(2) if core_boost_match.lastindex >= 3 else core_boost_match.group(1)
        dst = core_boost_match.group(3) if core_boost_match.lastindex >= 3 else core_boost_match.group(2)
        actions.append({
            'type': 'CORE_BOOST',
            'count': count,
            'source': src,
            'destination': 'life' if 'life' in dst else ('spirit' if 'spirit' in dst else ('nexus' if 'nexus' in dst else 'reserve')),
            'desc': f'Move {count} core(s) from {src} to {dst}'
        })

    # 3. CORE DRAIN
    core_drain_match = (
        re.search(r'(?:you can\s+)?(?:send|move)\s+(?:up to\s+)?(a|an|one|two|three|four|\d+)\s+cores?\s+(?:each\s+)?from\s+(?:an|any|one|two|three|four|five|\d+)?\s*opposing\s+(spirit|nexus|ultimate|spirit\/ultimate|spirit\/nexus).*?(?:on|onto|to)\s+(?:the\s+|their\s+)?(reserve|trash|void)', lower) or
        re.search(r'(?:send|move)\s+(a|an|one|two|three|four|\d+)\s+cores?\s+each\s+from\s+.*?opposing\s+(spirit|nexus|ultimate|spirits\/ultimates).*?to\s+(?:the\s+|their\s+)?(reserve|trash|void)', lower)
    )
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

    # 4. DESTROY SPIRIT BY BP
    destroy_bp_match = (
        re.search(r'(?:you can\s+)?destroy\s+(?:up to\s+)?(a|an|one|two|three|four|\d+)?\s*(?:of\s+)?(?:an\s+|the\s+)?opposing\s+(?:spirits?|ultimates?)\s+(?:with\s+)?(\d+)\s*bp\s+or\s+(?:less|lower)', lower) or
        re.search(r'(?:you can\s+)?destroy\s+(?:up to\s+)?(a|an|one|two|three|four|\d+)?\s*(?:of\s+)?(?:an\s+|the\s+)?opposing\s+(\d+)\s*bp\s+or\s+(?:less|lower)\s+(?:spirits?|ultimates?)', lower) or
        re.search(r'destroy\s+any\s+number\s+of\s+opposing\s+(?:spirits?|ultimates?)\s+(?:up to\s+(?:a total of\s+)?)?(\d+)\s*bp', lower)
    )
    if destroy_bp_match:
        count = word_to_num(destroy_bp_match.group(1)) if destroy_bp_match.group(1) and not destroy_bp_match.group(1).isdigit() else 1
        max_bp = int([g for g in destroy_bp_match.groups() if g and g.isdigit()][0])
        actions.append({
            'type': 'DESTROY_SPIRIT_BP',
            'count': count,
            'max_bp': max_bp,
            'desc': f'Destroy opposing Spirit(s) up to {max_bp} BP'
        })
    elif re.search(r'(?:you can\s+)?destroy\s+(?:an|one)?\s*opposing\s+(?:spirit|ultimate)\s+with\s+the\s+(highest|lowest)\s+bp', lower):
        m = re.search(r'(?:you can\s+)?destroy\s+(?:an|one)?\s*opposing\s+(?:spirit|ultimate)\s+with\s+the\s+(highest|lowest)\s+bp', lower)
        mode = m.group(1)
        actions.append({
            'type': 'DESTROY_SPIRIT_EXTREME_BP',
            'mode': mode,
            'desc': f'Destroy 1 opposing Spirit with the {mode} BP'
        })

    # 5. DESTROY SPIRIT BY COST
    destroy_cost_match = (
        re.search(r'(?:you can\s+)?destroy\s+(?:up to\s+)?(a|an|one|two|three|four|\d+)?\s*(?:of\s+)?(?:an\s+|the\s+)?opposing\s+(?:spirits?|ultimates?)\s+(?:with\s+)?cost\s+(\d+)\s+or\s+(?:less|lower)', lower) or
        re.search(r'(?:you can\s+)?destroy\s+(?:up to\s+)?(a|an|one|two|three|four|\d+)?\s*(?:of\s+)?(?:an\s+|the\s+)?opposing\s+cost\s+(\d+)\s+or\s+(?:less|lower)\s+(?:spirits?|ultimates?)', lower) or
        re.search(r'destroy\s+any\s+number\s+of\s+opposing\s+(?:spirits?|ultimates?)\s+up\s+to\s+(?:a\s+total\s+cost\s+of|cost)\s+(\d+)', lower)
    )
    if destroy_cost_match:
        c_val = [g for g in destroy_cost_match.groups() if g and g.isdigit()][0]
        max_cost = int(c_val)
        actions.append({
            'type': 'DESTROY_SPIRIT_COST',
            'count': 1,
            'max_cost': max_cost,
            'desc': f'Destroy opposing Spirit(s) with Cost {max_cost} or less'
        })

    # 6. DESTROY SPIRIT DIRECT / EXHAUSTED
    if not destroy_bp_match and not destroy_cost_match:
        direct_match = re.search(r'(?:you can\s+)?destroy\s+(?:up to\s+)?(a|an|one|two|three|four|\d+)?\s*(?:of\s+)?(exhausted\s+)?opposing\s+(?:spirits?|ultimates?)', lower)
        if direct_match:
            count = word_to_num(direct_match.group(1)) if direct_match.group(1) else 1
            is_exhausted = bool(direct_match.group(2))
            actions.append({
                'type': 'DESTROY_SPIRIT_DIRECT',
                'count': count,
                'require_exhausted': is_exhausted,
                'desc': f'Destroy {count} {"exhausted " if is_exhausted else ""}opposing Spirit(s)'
            })

    # 7. DESTROY NEXUS
    if re.search(r'(?:you can\s+)?destroy\s+(?:up to\s+)?(a|an|one|two|three|\d+)?\s*opposing\s+nexuse?s?', lower):
        m = re.search(r'(?:you can\s+)?destroy\s+(?:up to\s+)?(a|an|one|two|three|\d+)?\s*opposing\s+nexuse?s?', lower)
        count = word_to_num(m.group(1)) if m.group(1) else 1
        actions.append({
            'type': 'DESTROY_NEXUS',
            'count': count,
            'desc': f'Destroy {count} opposing Nexus'
        })

    # 8. BP BUFF
    bp_buff_match = re.search(r'(?:gains?|gets?)\s*\+?(\d+)\s*bp', lower) or re.search(r'give\s+(?:this\s+spirit|a\s+spirit|all\s+your\s+spirits).*?\+(\d+)\s*bp', lower)
    if bp_buff_match:
        bp_amount = int(bp_buff_match.group(1))
        target = 'self' if ('this spirit' in lower or 'self' in lower or 'gets +' in lower) else ('all' if 'all' in lower else 'target')
        actions.append({
            'type': 'BP_BUFF',
            'amount': bp_amount,
            'target': target,
            'desc': f'{target.capitalize()} gains +{bp_amount} BP'
        })

    # 9. BP DEBUFF
    bp_debuff_match = (
        re.search(r'(?:give\s+(?:every|an?|up to \d+)?\s*opposing\s+(?:spirits?|ultimates?).*?-\s*(\d+)\s*bp)', lower) or
        re.search(r'(?:opposing\s+(?:spirits?|ultimates?)\s+(?:gets?|gains?)\s*-(\d+)\s*bp)', lower) or
        re.search(r'(?:decreases?\s+(?:an?\s+)?opposing\s+(?:spirit|ultimate).*?by\s+(\d+)\s*bp)', lower) or
        re.search(r'(-\s*(\d+)\s*bp\s+to\s+(?:an?\s+)?opposing\s+spirit)', lower) or
        re.search(r'give\s+every\s+opposing\s+spirit\s+-(\d+)\s*bp', lower)
    )
    if bp_debuff_match:
        vals = [g for g in bp_debuff_match.groups() if g and g.isdigit()]
        bp_down = int(vals[0]) if vals else 3000
        destroy_on_zero = 'brought to 0' in lower or '0 bp' in lower or 'reaches 0' in lower
        actions.append({
            'type': 'BP_DEBUFF',
            'amount': bp_down,
            'destroy_on_zero': destroy_on_zero,
            'desc': f'Opposing Spirit gets -{bp_down} BP{" (destroyed at 0 BP)" if destroy_on_zero else ""}'
        })

    # 10. RETURN TO HAND (Bounce)
    bounce_match = (
        re.search(r'(?:you can\s+)?return\s+(?:up to\s+)?(a|an|one|two|three|four|\d+)?\s*opposing\s+(?:[^\.]*?)?(?:spirits?|ultimates?|nexuse?s?)\s+to\s+(?:the\s+|their\s+)?hand', lower) or
        re.search(r'return\s+an\s+opposing\s+(?:[^\.]*?)?spirit\s+to\s+(?:the\s+|their\s+)?hand', lower)
    )
    if bounce_match:
        count = word_to_num(bounce_match.group(1)) if bounce_match.group(1) else 1
        actions.append({
            'type': 'RETURN_TO_HAND',
            'count': count,
            'desc': f'Return {count} opposing Spirit(s) to Hand'
        })

    # 11. RETURN TO DECKBOTTOM
    deckbottom_match = (
        re.search(r'(?:you can\s+)?return\s+(?:up to\s+)?(a|an|one|two|three|four|\d+)?\s*opposing\s+(?:[^\.]*?)?(?:spirits?|ultimates?|nexuse?s?)\s+to\s+(?:the\s+)?(?:bottom\s+of\s+(?:the\s+)?deck|deckbottom)', lower) or
        re.search(r'return\s+an\s+opposing\s+(?:[^\.]*?)?(?:spirit|ultimate|nexus)\s+to\s+(?:the\s+)?deckbottom', lower)
    )
    if deckbottom_match:
        count = word_to_num(deckbottom_match.group(1)) if deckbottom_match.group(1) else 1
        actions.append({
            'type': 'RETURN_TO_DECKBOTTOM',
            'count': count,
            'desc': f'Return {count} opposing Spirit(s) to bottom of Deck'
        })

    # 12. EXHAUST OPPOSING SPIRIT / ALL
    exhaust_match = re.search(r'(?:you can\s+)?exhaust\s+(?:up to\s+)?(a|an|one|two|three|four|\d+)?\s*opposing\s+(?:spirits?|ultimates?)', lower)
    if exhaust_match:
        count = word_to_num(exhaust_match.group(1)) if exhaust_match.group(1) else 1
        actions.append({
            'type': 'EXHAUST_ENEMY',
            'count': count,
            'desc': f'Exhaust {count} opposing Spirit(s)'
        })
    elif re.search(r'exhaust\s+(?:every|all)\s+spirit', lower):
        actions.append({
            'type': 'EXHAUST_ENEMY',
            'count': 99,
            'desc': 'Exhaust all Spirits'
        })

    # 13. REFRESH SPIRITS
    if re.search(r'(?:you can\s+)?refresh\s+this\s+(?:spirit|ultimate|nexus)', lower) or re.search(r'this\s+spirit\s+refreshes', lower):
        actions.append({
            'type': 'REFRESH_SELF',
            'desc': 'Refresh this Spirit'
        })
    elif re.search(r'refresh\s+(?:all\s+(?:your\s+)?|up to\s+)?(a|an|one|two|three|four|\d+)?\s*(?:of\s+your\s+)?.*?spirits?', lower):
        m = re.search(r'refresh\s+(?:all\s+(?:your\s+)?|up to\s+)?(a|an|one|two|three|four|\d+)?\s*(?:of\s+your\s+)?.*?spirits?', lower)
        is_all = 'all' in lower
        count = word_to_num(m.group(1)) if m.group(1) else (99 if is_all else 1)
        actions.append({
            'type': 'REFRESH_ALLIES',
            'count': count,
            'is_all': is_all,
            'desc': f'Refresh {"all" if is_all else str(count)} friendly Spirit(s)'
        })

    # 14. BURST DISCARD REFRESH
    if re.search(r'by\s+discarding\s+(?:one|1|a)\s+burst\s+card.*?refresh\s+this\s+spirit', lower):
        actions.append({
            'type': 'BURST_DISCARD_REFRESH',
            'desc': 'At end of battle, discard 1 Burst card to refresh this Spirit'
        })

    # 15. DIRECT LIFE DAMAGE
    if (re.search(r'(?:send|move)\s+(a|an|one|two|\d+)\s+cores?\s+from\s+(?:the\s+)?opposing\s+life\s+to\s+(?:the\s+)?(reserve|trash|void)', lower) or
        re.search(r'deal\s+(\d+)\s+damage\s+to\s+opposing\s+life', lower) or
        re.search(r'send\s+an\s+opposing\s+life\s+to\s+(?:the\s+|their\s+)?(reserve|trash|void)', lower)):
        actions.append({
            'type': 'LIFE_BURN',
            'amount': 1,
            'desc': 'Inflict 1 direct damage to opposing Life'
        })

    # 16. HOLY LIFE / LIFE HEAL
    if re.search(r'(?:put|place|add)\s+(a|an|one|two|\d+)\s+cores?\s+from\s+(?:the\s+)?void\s+to\s+(?:your\s+)?life', lower):
        actions.append({
            'type': 'HOLY_LIFE_HEAL',
            'amount': 1,
            'desc': 'Channeled Sacred Light: Place 1 core from Void to Life'
        })

    # 17. CANNOT BE BLOCKED / UNBLOCKABLE
    if re.search(r'(?:cannot|can\'t)\s+be\s+blocked', lower) or re.search(r'\bunblockable\b', lower):
        actions.append({
            'type': 'CANNOT_BE_BLOCKED',
            'desc': 'This Spirit cannot be blocked'
        })

    # 18. CANNOT BLOCK / CANNOT ATTACK OPPOSING
    if re.search(r'opposing\s+spirits?\s+(?:cannot|can\'t)\s+attack', lower) or re.search(r'an\s+opposing\s+spirit.*?can\'t\s+attack', lower):
        actions.append({
            'type': 'OPPONENT_CANNOT_ATTACK',
            'desc': 'Opposing Spirits cannot attack'
        })
    if re.search(r'opposing\s+spirits?\s+(?:cannot|can\'t)\s+block', lower) or re.search(r'an\s+opposing\s+spirit.*?can\'t\s+block', lower) or re.search(r'that\s+spirit\s+can\'t\s+block', lower) or re.search(r'they\s+can\'t\s+block', lower):
        actions.append({
            'type': 'OPPONENT_CANNOT_BLOCK',
            'desc': 'Opposing Spirits cannot block'
        })

    # 19. FREE SUMMON
    free_summon_match = (
        re.search(r'(?:you can\s+)?summon\s+(?:this\s+card|a|an|one|\d+)?\s*(.*?)\s*(?:card\s+)?from\s+(?:your\s+)?(trash|hand|deck)?\s*,?\s*without\s+paying\s+(?:the\s+)?cost', lower) or
        re.search(r'by\s+summoning\s+(?:one|\d+)?\s*(.*?)\s*without\s+paying\s+(?:the\s+)?cost', lower) or
        re.search(r'summon\s+this\s+card\s+without\s+paying\s+(?:the\s+)?cost', lower)
    )
    if free_summon_match:
        card_desc = free_summon_match.group(1).strip() if free_summon_match.groups() and free_summon_match.group(1) else 'This Card'
        src = (free_summon_match.group(2) if len(free_summon_match.groups()) > 1 and free_summon_match.group(2) else 'hand')
        actions.append({
            'type': 'SUMMON_FREE',
            'source': src,
            'target_desc': card_desc,
            'desc': f'Summon {card_desc or "Card"} from {src} without paying cost'
        })

    # 20. SYMBOL GRANT
    symbol_match = re.search(r'gains?\s+(?:an?\s+)?(?:additional\s+)?(red|purple|green|white|yellow|blue)?\s*symbols?', lower) or re.search(r'gains?\s+\+1\s*(red|purple|green|white|yellow|blue)?\s*symbol', lower)
    if symbol_match:
        sym_col = symbol_match.group(1) or 'self'
        actions.append({
            'type': 'GRANT_SYMBOL',
            'color': sym_col,
            'desc': f'Gains +1 {sym_col.capitalize()} Symbol'
        })

    # 21. IMMUNITY / UNAFFECTED
    if re.search(r'unaffected\s+by\s+(?:opposing\s+)?(spirits?|magics?|nexuse?s?|effects?)', lower) or re.search(r'this\s+spirit\s+is\s+unaffected', lower):
        actions.append({
            'type': 'IMMUNITY',
            'desc': 'Unaffected by opposing effects'
        })

    # 22. SALVAGE (Return card from Trash to Hand)
    salvage_match = re.search(r'return\s+(?:a|an|one|two|\d+)?\s*(.*?)\s*(?:card\s+)?from\s+(?:the\s+|your\s+)?trash\s+to\s+(?:the\s+|your\s+)?hand', lower)
    if salvage_match:
        c_desc = salvage_match.group(1).strip()
        actions.append({
            'type': 'SALVAGE',
            'target_desc': c_desc,
            'desc': f'Return {c_desc or "card"} from Trash to Hand'
        })

    # 23. COUNTER PLUS
    counter_match = re.search(r'your\s+counter\s+(?:can\s+)?\+(\d+)', lower)
    if counter_match:
        cnt_val = int(counter_match.group(1))
        actions.append({
            'type': 'COUNTER_PLUS',
            'count': cnt_val,
            'desc': f'Your Counter +{cnt_val}'
        })

    # 24. DAMAGE CAP / LIFE PROTECTION
    if re.search(r'your\s+life\s+can\s+only\s+be\s+reduced\s+by\s+(\d+|one)', lower) or re.search(r'your\s+life\s+cannot\s+be\s+reduced', lower):
        actions.append({
            'type': 'DAMAGE_CAP',
            'desc': 'During this turn, your Life cannot be reduced or reduced by more than 1'
        })

    return actions

def parse_card_effects(card_name, card_type, effect_text):
    if not effect_text or not effect_text.strip():
        return {}

    lines = effect_text.split('\n')
    parsed_triggers = {}

    current_timings = ['PASSIVE']
    current_level = 1
    current_burst_cond = None

    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            continue

        # Check Burst declaration
        burst_match = re.search(r'\[Burst:\s*([^\]]+)\]', line, re.I)
        if burst_match:
            current_timings = ['BURST']
            current_burst_cond = burst_match.group(1).strip()

        # Check Grand Skill
        gs_match = re.search(r'\[Grand Skill:\s*(\d+)\]', line, re.I)
        if gs_match:
            current_timings = ['GRAND_SKILL']
            current_level = 1

        # Check for level headers anywhere on line
        lvl_matches = [int(m.group(1)) for m in re.finditer(r'\[LV(\d+)\]', line, re.I)]
        if lvl_matches:
            current_level = min(lvl_matches)

        # Look for explicit timing keywords
        found_timings = []
        # Check parentheses
        for m in re.finditer(r'\(([^\)]+)\)', line):
            content = m.group(1).lower()
            if 'summon' in content and 'attack' in content:
                found_timings.extend(['WHEN_SUMMONED', 'WHEN_ATTACKS'])
            elif 'summon' in content and 'advent' in content:
                found_timings.extend(['WHEN_SUMMONED', 'WHEN_ADVENTS'])
            elif 'summon' in content:
                found_timings.append('WHEN_SUMMONED')
            elif 'attack' in content and 'block' in content:
                found_timings.extend(['WHEN_ATTACKS', 'WHEN_BLOCKS'])
            elif 'advent' in content and 'attack' in content:
                found_timings.extend(['WHEN_ADVENTS', 'WHEN_ATTACKS'])
            elif 'attack step' in content or 'your attack' in content or 'opposing attack' in content:
                found_timings.append('WHEN_ATTACKS')
            elif 'attack' in content:
                found_timings.append('WHEN_ATTACKS')
            elif 'block' in content:
                found_timings.append('WHEN_BLOCKS')
            elif 'battles' in content:
                found_timings.extend(['WHEN_ATTACKS', 'WHEN_BLOCKS'])
            elif 'destroy' in content or 'deplet' in content:
                found_timings.append('WHEN_DESTROYED')
            elif 'deploy' in content:
                found_timings.append('WHEN_DEPLOYED')
            elif 'advent' in content:
                found_timings.append('WHEN_ADVENTS')
            elif 'flash' in content:
                found_timings.append('FLASH')
            elif 'start of' in content:
                found_timings.append('START_OF_TURN')
            elif 'end of the battle' in content or 'end of battle' in content:
                found_timings.append('END_OF_BATTLE')
            elif 'end of' in content:
                found_timings.append('END_OF_TURN')

        # Check brackets & flash
        if re.search(r'\[Flash\]|\bFlash\s*[-:\(]', line, re.I):
            found_timings.append('FLASH')
        if re.search(r'\[Main\]|\bMain\s*[-:\(]', line, re.I):
            found_timings.append('MAIN')

        # Heuristic for magic / nexus
        if (card_type or '').lower() == 'magic':
            if not found_timings and current_timings == ['PASSIVE']:
                found_timings = ['FLASH']

        if 'nexus' in (card_type or '').lower():
            if 'when deployed' in line.lower() and 'WHEN_DEPLOYED' not in found_timings:
                found_timings.append('WHEN_DEPLOYED')

        if found_timings:
            # Deduplicate preserving order
            seen = set()
            current_timings = [t for t in found_timings if not (t in seen or seen.add(t))]

        # Strip header markers from line body
        clean_body = re.sub(r'\[LV\d+\]', '', line)
        clean_body = re.sub(r'\[Burst:[^\]]+\]', '', clean_body)
        clean_body = re.sub(r'\[Grand Skill:[^\]]+\]', '', clean_body)
        clean_body = re.sub(r'\[Flash\]|\[Main\]', '', clean_body, flags=re.I)
        clean_body = clean_body.strip()

        clauses = re.split(r'\.\s+|\n|;', clean_body)
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
    print("🚀 Running Comprehensive NLP Extraction Engine across all cards...")
    db_path = 'battle_spirits.db'
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    c.execute("SELECT name, type, effect, cost, color, levels FROM cards")
    rows = c.fetchall()

    print(f"Loaded {len(rows)} cards from {db_path}.")

    effects_map = {}
    total_actions = 0
    action_counts = {}

    for name, ctype, effect, cost, color, levels in rows:
        if not effect or not effect.strip():
            continue
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
                    total_actions += 1
                    atype = act['type']
                    action_counts[atype] = action_counts.get(atype, 0) + 1

    print(f"\n✅ Processing complete!")
    print(f"Total cards with parsed operational effects: {len(effects_map)}")
    print(f"Total action operations compiled: {total_actions}")
    print("\nAction Distribution:")
    for atype, cnt in sorted(action_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"  • {atype}: {cnt}")

    out_json = 'card_effects_db.json'
    with open(out_json, 'w', encoding='utf-8') as f:
        json.dump(effects_map, f, ensure_ascii=False, indent=2)
    print(f"\n💾 Saved updated database to {out_json} ({os.path.getsize(out_json):,} bytes)")

if __name__ == '__main__':
    main()
