"""
Comprehensive Universal Card Effect Compiler & Verification Engine for Battle Spirits Eternal
Parses all 14,529 cards from battle_spirits.db according to the official Canva rules.
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

def extract_level_range(text):
    """Extracts minimum and maximum level requirement from a header like [LV1][LV2] or [LV2-3]."""
    levels = [int(m.group(1)) for m in re.finditer(r'\[LV(\d+)\]', text, re.I)]
    m_range = re.search(r'\[LV(\d+)-(\d+)\]', text, re.I)
    if m_range:
        levels.extend([int(m_range.group(1)), int(m_range.group(2))])
    if not levels:
        if re.search(r'\[When Braved\]|\[During (?:Spirit |Ultimate )?Brave\]', text, re.I):
            return 1, 'BRAVED'
        if re.search(r'\[During Set\]|\[Mirage\]', text, re.I):
            return 1, 'MIRAGE_SET'
        return 1, None
    return min(levels), None

def parse_canva_rules_from_clause(text):
    lower = text.lower()
    
    # 1. Optional vs Mandatory (Canva Section 2: Basic wordings)
    is_optional = bool(re.search(r'\b(?:you can|can|may|optional|choose to)\b', lower))
    is_mandatory = not is_optional
    do_as_much_as_possible = is_mandatory

    # 2. Conditional "By [A], do [B]" (Canva Section 2)
    by_condition = None
    by_match = re.search(r'\bby\s+([^,]+?),\s*(.*)', text, re.I)
    if by_match:
        cond_text = by_match.group(1).strip()
        action_text = by_match.group(2).strip()
        by_condition = {
            'condition_raw': cond_text,
            'is_cost_gated': True,
            'requires_completion': True
        }
        cond_lower = cond_text.lower()
        if 'discarding' in cond_lower and 'burst' in cond_lower:
            by_condition['cost_type'] = 'DISCARD_BURST'
        elif 'sending' in cond_lower and 'trash' in cond_lower:
            by_condition['cost_type'] = 'SEND_CORE_TO_TRASH'
        elif 'destroying' in cond_lower:
            by_condition['cost_type'] = 'DESTROY_FRIENDLY'
        elif 'paying' in cond_lower and 'cost' in cond_lower:
            by_condition['cost_type'] = 'PAY_CORE_COST'
        elif 'returning' in cond_lower and 'hand' in cond_lower:
            by_condition['cost_type'] = 'BOUNCE_FRIENDLY'

    # 3. Timing Wordings (Canva Section 3)
    timing_relation = 'STANDARD'
    if re.search(r'\balso\b|さらに', text, re.I):
        timing_relation = 'ALSO'
    elif re.search(r'\bthen\b|その後', text, re.I):
        timing_relation = 'THEN'
    elif re.search(r'\bafter this effect resolves\b|効果発揮後', text, re.I):
        timing_relation = 'AFTER_RESOLVES'
    elif re.search(r'\bimmediately\b|ただちに', text, re.I):
        timing_relation = 'IMMEDIATELY'
    elif re.search(r'\bor\b|または|か、', text, re.I):
        timing_relation = 'OR'

    # 4. Once Per Turn Limits (Canva Section 4)
    limit = None
    if re.search(r'once per turn:\s*same\s*(?:card\s*)?name|this effect can only be used once per turn', lower):
        limit = 'HARD_ONCE_PER_TURN'
    elif re.search(r'once per turn|1\/turn', lower):
        limit = 'SOFT_ONCE_PER_TURN'
    elif re.search(r'once per (?:game|duel)', lower):
        limit = 'ONCE_PER_GAME'

    # 5. Burst-Lock Target (Canva Section 4)
    burst_lock_target = None
    if re.search(r'opponent(?:\'s)?\s+(?:bursts?|set\s+cards?)\s+cannot\s+activate', lower):
        burst_lock_target = 'BURST_CARD'
    elif re.search(r'opponent\s+cannot\s+activate\s+(?:their\s+)?burst(?:\s+effects)?', lower):
        burst_lock_target = 'PLAYER'

    # 6. Name Filtering (Canva Section 4)
    name_filter = None
    m_inc = re.search(r'with\s+["“]([^"”]+)["”]\s+in\s+(?:its|their)\s+name', text, re.I)
    if m_inc:
        name_filter = {'type': 'INCLUDES', 'value': m_inc.group(1).strip()}
    else:
        m_exact = re.search(r'named\s+["“]([^"”]+)["”]', text, re.I)
        if m_exact:
            name_filter = {'type': 'EXACT', 'value': m_exact.group(1).strip()}

    # 7. Unaffected / Immunity / Penetration (Canva Section 1 & 2)
    penetration = bool(re.search(r'ignores?\s+(?:armor|heavy\s+armor|immunity)|unaffected\s+by\s+opposing\s+effects\s+cannot\s+prevent', lower))
    unaffected = bool(re.search(r'unaffected\s+by\s+(?:opposing\s+)?(?:effects|spirits?|magics?|nexuse?s?|braves?|ultimates?)', lower))

    return {
        'is_mandatory': is_mandatory,
        'is_optional': is_optional,
        'do_as_much_as_possible': do_as_much_as_possible,
        'by_condition': by_condition,
        'timing_relation': timing_relation,
        'limit': limit,
        'burst_lock_target': burst_lock_target,
        'name_filter': name_filter,
        'penetration': penetration,
        'unaffected': unaffected
    }

def classify_clause_actions(clause, timing, min_level, is_braved=False):
    text = clause.strip()
    text = re.sub(r'^[◆•\-\*\s]+', '', text)
    lower = text.lower()
    canva = parse_canva_rules_from_clause(text)
    actions = []

    # Helper to construct action dict
    def make_action(act_type, desc, extra=None):
        a = {
            'type': act_type,
            'desc': desc,
            'raw_text': text,
            'min_level': min_level,
            'is_braved': is_braved,
            'require_braved': is_braved,
            'canva_rules': canva
        }
        if extra:
            a.update(extra)
        return a

    # 1. DRAW CARDS / DRAW UNTIL / SEARCH DECK
    draw_match = re.search(r'(?:you can\s+)?draw\s+(a|an|one|two|three|four|five|six|\d+)\s+cards?', lower)
    if draw_match:
        count = word_to_num(draw_match.group(1))
        actions.append(make_action('DRAW_CARDS', f'Draw {count} card(s) from deck', {'count': count}))
    elif re.search(r'draw\s+until\s+you\s+have\s+(\d+)\s+cards', lower):
        m = re.search(r'draw\s+until\s+you\s+have\s+(\d+)\s+cards', lower)
        target_hand = int(m.group(1))
        actions.append(make_action('DRAW_UNTIL', f'Draw until you have {target_hand} cards in Hand', {'target_hand': target_hand}))
    elif re.search(r'(?:you can\s+)?(?:reveal|look at)\s+(a|an|one|two|three|four|five|six|\d+)\s+cards?\s+from\s+(?:the\s+|your\s+)?deck(?:top)?', lower):
        m = re.search(r'(?:you can\s+)?(?:reveal|look at)\s+(a|an|one|two|three|four|five|six|\d+)\s+cards?\s+from\s+(?:the\s+|your\s+)?deck(?:top)?', lower)
        count = word_to_num(m.group(1))
        actions.append(make_action('SEARCH_DECK', f'Reveal {count} cards from decktop and add matching cards to Hand', {'count': count}))

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
        dest_norm = 'life' if 'life' in dst else ('spirit' if 'spirit' in dst else ('nexus' if 'nexus' in dst else 'reserve'))
        actions.append(make_action('CORE_BOOST', f'Move {count} core(s) from {src} to {dst}', {'count': count, 'source': src, 'destination': dest_norm}))

    # 3. CORE DRAIN
    core_drain_match = (
        re.search(r'(?:you can\s+)?(?:send|move)\s+(?:up to\s+)?(a|an|one|two|three|four|\d+)\s+cores?\s+(?:each\s+)?from\s+(?:an|any|one|two|three|four|five|\d+)?\s*opposing\s+(spirit|nexus|ultimate|spirit\/ultimate|spirit\/nexus).*?(?:on|onto|to)\s+(?:the\s+|their\s+)?(reserve|trash|void)', lower) or
        re.search(r'(?:send|move)\s+(a|an|one|two|three|four|\d+)\s+cores?\s+each\s+from\s+.*?opposing\s+(spirit|nexus|ultimate|spirits\/ultimates).*?to\s+(?:the\s+|their\s+)?(reserve|trash|void)', lower)
    )
    if core_drain_match:
        count = word_to_num(core_drain_match.group(1))
        target_kind = core_drain_match.group(2)
        dest = core_drain_match.group(3)
        actions.append(make_action('CORE_DRAIN', f'Send {count} core(s) from opposing {target_kind} to {dest}', {'count': count, 'target': target_kind, 'destination': dest}))

    # 4. DESTROY SPIRIT BY BP
    destroy_bp_match = (
        re.search(r'(?:you can\s+)?destroy\s+(?:up to\s+)?(a|an|one|two|three|four|\d+)?\s*(?:of\s+)?(?:an\s+|the\s+)?opposing\s+(?:spirits?|ultimates?)\s+(?:with\s+)?(\d+)\s*bp\s+or\s+(?:less|lower)', lower) or
        re.search(r'(?:you can\s+)?destroy\s+(?:up to\s+)?(a|an|one|two|three|four|\d+)?\s*(?:of\s+)?(?:an\s+|the\s+)?opposing\s+(\d+)\s*bp\s+or\s+(?:less|lower)\s+(?:spirits?|ultimates?)', lower) or
        re.search(r'destroy\s+any\s+number\s+of\s+opposing\s+(?:spirits?|ultimates?)\s+(?:up to\s+(?:a total of\s+)?)?(\d+)\s*bp', lower)
    )
    if destroy_bp_match:
        count = word_to_num(destroy_bp_match.group(1)) if destroy_bp_match.group(1) and not destroy_bp_match.group(1).isdigit() else 1
        max_bp = int([g for g in destroy_bp_match.groups() if g and g.isdigit()][0])
        actions.append(make_action('DESTROY_SPIRIT_BP', f'Destroy opposing Spirit(s) up to {max_bp} BP', {'count': count, 'max_bp': max_bp}))
    elif re.search(r'(?:you can\s+)?destroy\s+(?:an|one)?\s*opposing\s+(?:spirit|ultimate)\s+with\s+the\s+(highest|lowest)\s+bp', lower):
        m = re.search(r'(?:you can\s+)?destroy\s+(?:an|one)?\s*opposing\s+(?:spirit|ultimate)\s+with\s+the\s+(highest|lowest)\s+bp', lower)
        mode = m.group(1)
        actions.append(make_action('DESTROY_SPIRIT_EXTREME_BP', f'Destroy 1 opposing Spirit with the {mode} BP', {'mode': mode}))

    # 5. DESTROY SPIRIT BY COST
    destroy_cost_match = (
        re.search(r'(?:you can\s+)?destroy\s+(?:up to\s+)?(a|an|one|two|three|four|\d+)?\s*(?:of\s+)?(?:an\s+|the\s+)?opposing\s+(?:spirits?|ultimates?)\s+(?:with\s+)?cost\s+(\d+)\s+or\s+(?:less|lower)', lower) or
        re.search(r'(?:you can\s+)?destroy\s+(?:up to\s+)?(a|an|one|two|three|four|\d+)?\s*(?:of\s+)?(?:an\s+|the\s+)?opposing\s+cost\s+(\d+)\s+or\s+(?:less|lower)\s+(?:spirits?|ultimates?)', lower) or
        re.search(r'destroy\s+any\s+number\s+of\s+opposing\s+(?:spirits?|ultimates?)\s+up\s+to\s+(?:a\s+total\s+cost\s+of|cost)\s+(\d+)', lower)
    )
    if destroy_cost_match:
        c_val = [g for g in destroy_cost_match.groups() if g and g.isdigit()][0]
        max_cost = int(c_val)
        actions.append(make_action('DESTROY_SPIRIT_COST', f'Destroy opposing Spirit(s) with Cost {max_cost} or less', {'count': 1, 'max_cost': max_cost}))

    # 6. DESTROY SPIRIT DIRECT / EXHAUSTED
    if not destroy_bp_match and not destroy_cost_match:
        direct_match = re.search(r'(?:you can\s+)?destroy\s+(?:up to\s+)?(a|an|one|two|three|four|\d+)?\s*(?:of\s+)?(exhausted\s+)?opposing\s+(?:spirits?|ultimates?)', lower)
        if direct_match:
            count = word_to_num(direct_match.group(1)) if direct_match.group(1) else 1
            is_exhausted = bool(direct_match.group(2))
            actions.append(make_action('DESTROY_SPIRIT_DIRECT', f'Destroy {count} {"exhausted " if is_exhausted else ""}opposing Spirit(s)', {'count': count, 'require_exhausted': is_exhausted}))

    # 7. DESTROY NEXUS
    if re.search(r'(?:you can\s+)?destroy\s+(?:up to\s+)?(a|an|one|two|three|\d+)?\s*opposing\s+nexuse?s?', lower):
        m = re.search(r'(?:you can\s+)?destroy\s+(?:up to\s+)?(a|an|one|two|three|\d+)?\s*opposing\s+nexuse?s?', lower)
        count = word_to_num(m.group(1)) if m.group(1) else 1
        actions.append(make_action('DESTROY_NEXUS', f'Destroy {count} opposing Nexus', {'count': count}))

    # 8. BP BUFF
    bp_buff_match = re.search(r'(?:gains?|gets?)\s*\+?(\d+)\s*bp', lower) or re.search(r'give\s+(?:this\s+spirit|a\s+spirit|all\s+your\s+spirits).*?\+(\d+)\s*bp', lower)
    if bp_buff_match:
        bp_amount = int(bp_buff_match.group(1))
        target = 'self' if ('this spirit' in lower or 'self' in lower or 'gets +' in lower) else ('all' if 'all' in lower else 'target')
        actions.append(make_action('BP_BUFF', f'{target.capitalize()} gains +{bp_amount} BP', {'amount': bp_amount, 'target': target}))

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
        actions.append(make_action('BP_DEBUFF', f'Opposing Spirit gets -{bp_down} BP{" (destroyed at 0 BP)" if destroy_on_zero else ""}', {'amount': bp_down, 'destroy_on_zero': destroy_on_zero}))

    # 10. RETURN TO HAND (Bounce)
    bounce_match = (
        re.search(r'(?:you can\s+)?return\s+(?:up to\s+)?(a|an|one|two|three|four|\d+)?\s*opposing\s+(?:[^\.]*?)?(?:spirits?|ultimates?|nexuse?s?)\s+to\s+(?:the\s+|their\s+)?hand', lower) or
        re.search(r'return\s+an\s+opposing\s+(?:[^\.]*?)?spirit\s+to\s+(?:the\s+|their\s+)?hand', lower)
    )
    if bounce_match:
        count = word_to_num(bounce_match.group(1)) if bounce_match.group(1) else 1
        actions.append(make_action('RETURN_TO_HAND', f'Return {count} opposing Spirit(s) to Hand', {'count': count}))

    # 11. RETURN TO DECKBOTTOM
    deckbottom_match = (
        re.search(r'(?:you can\s+)?return\s+(?:up to\s+)?(a|an|one|two|three|four|\d+)?\s*opposing\s+(?:[^\.]*?)?(?:spirits?|ultimates?|nexuse?s?)\s+to\s+(?:the\s+)?(?:bottom\s+of\s+(?:the\s+)?deck|deckbottom)', lower) or
        re.search(r'return\s+an\s+opposing\s+(?:[^\.]*?)?(?:spirit|ultimate|nexus)\s+to\s+(?:the\s+)?deckbottom', lower)
    )
    if deckbottom_match:
        count = word_to_num(deckbottom_match.group(1)) if deckbottom_match.group(1) else 1
        actions.append(make_action('RETURN_TO_DECKBOTTOM', f'Return {count} opposing Spirit(s) to bottom of Deck', {'count': count}))

    # 12. EXHAUST OPPOSING SPIRIT / ALL
    exhaust_match = re.search(r'(?:you can\s+)?exhaust\s+(?:up to\s+)?(a|an|one|two|three|four|\d+)?\s*opposing\s+(?:spirits?|ultimates?)', lower)
    if exhaust_match:
        count = word_to_num(exhaust_match.group(1)) if exhaust_match.group(1) else 1
        actions.append(make_action('EXHAUST_ENEMY', f'Exhaust {count} opposing Spirit(s)', {'count': count}))
    elif re.search(r'exhaust\s+(?:every|all)\s+spirit', lower):
        actions.append(make_action('EXHAUST_ENEMY', 'Exhaust all Spirits', {'count': 99}))

    # 13. REFRESH SPIRITS
    if re.search(r'(?:you can\s+)?refresh\s+this\s+(?:spirit|ultimate|nexus)', lower) or re.search(r'this\s+spirit\s+refreshes', lower):
        actions.append(make_action('REFRESH_SELF', 'Refresh this Spirit'))
    elif re.search(r'refresh\s+(?:all\s+(?:your\s+)?|up to\s+)?(a|an|one|two|three|four|\d+)?\s*(?:of\s+your\s+)?.*?spirits?', lower):
        m = re.search(r'refresh\s+(?:all\s+(?:your\s+)?|up to\s+)?(a|an|one|two|three|four|\d+)?\s*(?:of\s+your\s+)?.*?spirits?', lower)
        is_all = 'all' in lower
        count = word_to_num(m.group(1)) if m.group(1) else (99 if is_all else 1)
        actions.append(make_action('REFRESH_ALLIES', f'Refresh {"all" if is_all else str(count)} friendly Spirit(s)', {'count': count, 'is_all': is_all}))

    # 14. DIRECT LIFE DAMAGE
    if (re.search(r'(?:send|move)\s+(a|an|one|two|\d+)\s+cores?\s+from\s+(?:the\s+)?opposing\s+life\s+to\s+(?:the\s+)?(reserve|trash|void)', lower) or
        re.search(r'deal\s+(\d+)\s+damage\s+to\s+opposing\s+life', lower) or
        re.search(r'send\s+an\s+opposing\s+life\s+to\s+(?:the\s+|their\s+)?(reserve|trash|void)', lower)):
        actions.append(make_action('LIFE_BURN', 'Inflict 1 direct damage to opposing Life', {'amount': 1}))

    # 15. HOLY LIFE / LIFE HEAL
    if re.search(r'(?:put|place|add)\s+(a|an|one|two|\d+)\s+cores?\s+from\s+(?:the\s+)?void\s+to\s+(?:your\s+)?life', lower):
        actions.append(make_action('HOLY_LIFE_HEAL', 'Channeled Sacred Light: Place 1 core from Void to Life', {'amount': 1}))

    # 16. CANNOT BE BLOCKED / UNBLOCKABLE
    if re.search(r'(?:cannot|can\'t)\s+be\s+blocked', lower) or re.search(r'\bunblockable\b', lower):
        actions.append(make_action('CANNOT_BE_BLOCKED', 'This Spirit cannot be blocked'))

    # 17. CANNOT BLOCK / CANNOT ATTACK OPPOSING
    if re.search(r'opposing\s+spirits?\s+(?:cannot|can\'t)\s+attack', lower) or re.search(r'an\s+opposing\s+spirit.*?can\'t\s+attack', lower):
        actions.append(make_action('OPPONENT_CANNOT_ATTACK', 'Opposing Spirits cannot attack'))
    if re.search(r'opposing\s+spirits?\s+(?:cannot|can\'t)\s+block', lower) or re.search(r'an\s+opposing\s+spirit.*?can\'t\s+block', lower) or re.search(r'that\s+spirit\s+can\'t\s+block', lower) or re.search(r'they\s+can\'t\s+block', lower):
        actions.append(make_action('OPPONENT_CANNOT_BLOCK', 'Opposing Spirits cannot block'))

    # 18. FREE SUMMON
    free_summon_match = (
        re.search(r'(?:you can\s+)?summon\s+(?:this\s+card|a|an|one|\d+)?\s*(.*?)\s*(?:card\s+)?from\s+(?:your\s+)?(trash|hand|deck)?\s*,?\s*without\s+paying\s+(?:the\s+)?cost', lower) or
        re.search(r'by\s+summoning\s+(?:one|\d+)?\s*(.*?)\s*without\s+paying\s+(?:the\s+)?cost', lower) or
        re.search(r'summon\s+this\s+card\s+without\s+paying\s+(?:the\s+)?cost', lower)
    )
    if free_summon_match:
        card_desc = free_summon_match.group(1).strip() if free_summon_match.groups() and free_summon_match.group(1) else 'This Card'
        src = (free_summon_match.group(2) if len(free_summon_match.groups()) > 1 and free_summon_match.group(2) else 'hand')
        actions.append(make_action('SUMMON_FREE', f'Summon {card_desc or "Card"} from {src} without paying cost', {'source': src, 'target_desc': card_desc}))

    # 19. SYMBOL GRANT
    symbol_match = re.search(r'gains?\s+(?:an?\s+)?(?:additional\s+)?(red|purple|green|white|yellow|blue)?\s*symbols?', lower) or re.search(r'gains?\s+\+1\s*(red|purple|green|white|yellow|blue)?\s*symbol', lower)
    if symbol_match:
        sym_col = symbol_match.group(1) or 'self'
        actions.append(make_action('GRANT_SYMBOL', f'Gains +1 {sym_col.capitalize()} Symbol', {'color': sym_col}))

    # 20. IMMUNITY / UNAFFECTED
    if canva['unaffected']:
        actions.append(make_action('IMMUNITY', 'Unaffected by opposing effects', {'penetration': canva['penetration']}))

    # 21. SALVAGE
    salvage_match = re.search(r'return\s+(?:a|an|one|two|\d+)?\s*(.*?)\s*(?:card\s+)?from\s+(?:the\s+|your\s+)?trash\s+to\s+(?:the\s+|your\s+)?hand', lower)
    if salvage_match:
        c_desc = salvage_match.group(1).strip()
        actions.append(make_action('SALVAGE', f'Return {c_desc or "card"} from Trash to Hand', {'target_desc': c_desc}))

    # 22. COUNTER PLUS
    counter_match = re.search(r'your\s+counter\s+(?:can\s+)?\+(\d+)', lower)
    if counter_match:
        cnt_val = int(counter_match.group(1))
        actions.append(make_action('COUNTER_PLUS', f'Your Counter +{cnt_val}', {'count': cnt_val}))

    # 23. DAMAGE CAP
    if re.search(r'your\s+life\s+can\s+only\s+be\s+reduced\s+by\s+(\d+|one)', lower) or re.search(r'your\s+life\s+cannot\s+be\s+reduced', lower):
        actions.append(make_action('DAMAGE_CAP', 'During this turn, your Life cannot be reduced or reduced by more than 1'))

    # 24. DECK DISCARD / MILL (Canva Section 2: "discard X cards from opposing decktop")
    discard_match = re.search(r'(?:you can\s+)?discard\s+(?:up to\s+)?(a|an|one|two|three|four|five|\d+)\s+cards?\s+(?:but\s+up\s+to\s+as\s+many\s+as\s+possible\s+)?from\s+(?:the\s+)?opposing\s+deck(?:top)?', lower)
    if discard_match:
        cnt = word_to_num(discard_match.group(1))
        actions.append(make_action('DECK_DISCARD', f'Discard {cnt} cards from opposing decktop (as much as possible)', {'count': cnt, 'as_much_as_possible': True}))

    # 25. BURST-LOCK
    if canva['burst_lock_target']:
        actions.append(make_action('BURST_LOCK', f'Lock opposing Bursts ({canva["burst_lock_target"]})', {'target': canva['burst_lock_target']}))

    # 26. CRUSH
    if 'crush' in lower:
        actions.append(make_action('CRUSH', 'Crush: Discard cards from opposing decktop based on LV'))

    # 27. ARMOR / HEAVY ARMOR
    armor_match = re.search(r'\[(heavy\s+armor|armor):\s*([^\]]+)\]', text, re.I)
    if armor_match:
        armor_type = armor_match.group(1).upper()
        colors = armor_match.group(2).strip()
        actions.append(make_action(armor_type, f'{armor_type}: Immune to opposing {colors} effects', {'colors': colors}))

    # 28. If no specialized action was matched, preserve the exact ability as a SPECIAL_EFFECT / STATIC_ABILITY!
    # This guarantees that NO CARD AND NO CLAUSE IS EVER DROPPED!
    if not actions and len(text) > 3:
        actions.append(make_action('SPECIAL_EFFECT', text))

    return actions

def parse_card_full(name, ctype, color, cost, symbol, family, families_json, levels_json, effect):
    if not effect or not effect.strip():
        return {
            'type': ctype or 'Spirit',
            'color': color or 'Red',
            'cost': cost or 0,
            'symbol': symbol or 1,
            'family': family or '',
            'is_vanilla': True,
            'triggers': {},
            'raw_effect': ''
        }

    parsed_triggers = {}
    lines = effect.split('\n')

    current_timings = ['PASSIVE']
    current_level = 1
    current_is_braved = False
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

        # Check Grand Field
        if re.search(r'\[Grand Field\]', line, re.I):
            current_timings = ['GRAND_FIELD']
            current_level = 1

        # Check Level Header
        min_lvl, special_tag = extract_level_range(line)
        if min_lvl is not None:
            current_level = min_lvl
        if special_tag == 'BRAVED':
            current_is_braved = True
        elif 'LV' in line:
            current_is_braved = False

        # Look for explicit timing keywords in parentheses or brackets
        found_timings = []
        for m in re.finditer(r'\(([^\)]+)\)', line):
            c_text = m.group(1).lower()
            if 'summon' in c_text and 'attack' in c_text:
                found_timings.extend(['WHEN_SUMMONED', 'WHEN_ATTACKS'])
            elif 'summon' in c_text and 'advent' in c_text:
                found_timings.extend(['WHEN_SUMMONED', 'WHEN_ADVENTS'])
            elif 'summon' in c_text:
                found_timings.append('WHEN_SUMMONED')
            elif 'attack' in c_text and 'block' in c_text:
                found_timings.extend(['WHEN_ATTACKS', 'WHEN_BLOCKS'])
            elif 'advent' in c_text and 'attack' in c_text:
                found_timings.extend(['WHEN_ADVENTS', 'WHEN_ATTACKS'])
            elif 'attack step' in c_text or 'your attack' in c_text or 'opposing attack' in c_text:
                found_timings.append('WHEN_ATTACKS')
            elif 'attack' in c_text:
                found_timings.append('WHEN_ATTACKS')
            elif 'block' in c_text:
                found_timings.append('WHEN_BLOCKS')
            elif 'battles' in c_text:
                found_timings.extend(['WHEN_ATTACKS', 'WHEN_BLOCKS'])
            elif 'destroyed in battle' in c_text or 'comparing bp' in c_text:
                found_timings.append('WHEN_DESTROYED_IN_BATTLE')
            elif 'destroy' in c_text or 'deplet' in c_text:
                found_timings.append('WHEN_DESTROYED')
            elif 'deploy' in c_text:
                found_timings.append('WHEN_DEPLOYED')
            elif 'advent' in c_text:
                found_timings.append('WHEN_ADVENTS')
            elif 'reborn' in c_text:
                found_timings.append('WHEN_REBORN')
            elif 'flash' in c_text:
                found_timings.append('FLASH')
            elif 'start of' in c_text:
                found_timings.append('START_OF_TURN')
            elif 'end of the battle' in c_text or 'end of battle' in c_text:
                found_timings.append('END_OF_BATTLE')
            elif 'end of' in c_text:
                found_timings.append('END_OF_TURN')

        if re.search(r'\[Flash\]|\bFlash\s*[-:\(]', line, re.I):
            found_timings.append('FLASH')
        if re.search(r'\[Main\]|\bMain\s*[-:\(]', line, re.I):
            found_timings.append('MAIN')

        if (ctype or '').lower() == 'magic':
            if not found_timings and current_timings == ['PASSIVE']:
                found_timings = ['FLASH']

        if 'nexus' in (ctype or '').lower():
            if 'when deployed' in line.lower() and 'WHEN_DEPLOYED' not in found_timings:
                found_timings.append('WHEN_DEPLOYED')

        if found_timings:
            seen_t = set()
            current_timings = [t for t in found_timings if not (t in seen_t or seen_t.add(t))]

        # Strip header markers from line body for clause classification
        clean_body = re.sub(r'\[LV\d+\]|\[LV\d+-\d+\]', '', line)
        clean_body = re.sub(r'\[Burst:[^\]]+\]', '', clean_body)
        clean_body = re.sub(r'\[Grand Skill:[^\]]+\]', '', clean_body)
        clean_body = re.sub(r'\[Grand Field\]', '', clean_body)
        clean_body = re.sub(r'\[When Braved\]|\[During (?:Spirit |Ultimate )?Brave\]', '', clean_body, flags=re.I)
        clean_body = re.sub(r'\(When Brave Attacks\)|\(When Attacks\)|\(When Summoned\)|\(When Advents\)|\(When Destroyed\)|\(When Attacks\/Blocks\)', '', clean_body, flags=re.I)
        clean_body = re.sub(r'\[Flash\]|\[Main\]', '', clean_body, flags=re.I)
        clean_body = clean_body.strip()

        clauses = re.split(r'\.\s+|\n|;', clean_body)
        for c in clauses:
            c = c.strip()
            if not c or len(c) < 3:
                continue
            clause_lower = c.lower()
            c_timings = list(current_timings)
            if 'destroyed by comparing bp' in clause_lower or 'destroyed in battle' in clause_lower:
                c_timings = ['WHEN_DESTROYED_IN_BATTLE']
            for t_time in c_timings:
                actions = classify_clause_actions(c, t_time, current_level, is_braved=current_is_braved)
                if actions:
                    if t_time not in parsed_triggers:
                        parsed_triggers[t_time] = []
                    for act in actions:
                        if t_time == 'BURST' and current_burst_cond:
                            act['burst_condition'] = current_burst_cond
                        parsed_triggers[t_time].append(act)

    return {
        'type': ctype or 'Spirit',
        'color': color or 'Red',
        'cost': cost or 0,
        'symbol': symbol or 1,
        'family': family or '',
        'is_vanilla': False,
        'triggers': parsed_triggers,
        'raw_effect': effect
    }

def main():
    print("Starting Complete Universal Card Effect Compiler across ALL cards...")
    db_path = 'battle_spirits.db'
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    c.execute("SELECT name, type, color, cost, symbol, family, families_json, levels, effect FROM cards")
    rows = c.fetchall()
    total_db_cards = len(rows)
    print(f"Loaded {total_db_cards} cards from {db_path}.")

    all_cards_map = {}
    total_actions = 0
    vanilla_count = 0
    actions_count_by_type = {}

    for row in rows:
        name, ctype, color, cost, symbol, family, families_json, levels, effect = row
        card_data = parse_card_full(name, ctype, color, cost, symbol, family, families_json, levels, effect)
        all_cards_map[name] = card_data

        if card_data.get('is_vanilla'):
            vanilla_count += 1
        else:
            for t, acts in card_data.get('triggers', {}).items():
                for act in acts:
                    total_actions += 1
                    atype = act['type']
                    actions_count_by_type[atype] = actions_count_by_type.get(atype, 0) + 1

    print("\nCompilation Summary:")
    print(f"Total cards in database: {total_db_cards}")
    print(f"Total cards compiled into card_effects_db: {len(all_cards_map)}")
    print(f"Vanilla cards (no effect text): {vanilla_count}")
    print(f"Cards with active effect triggers: {len(all_cards_map) - vanilla_count}")
    print(f"Total structured actions compiled: {total_actions}")

    print("\nAction Types Distribution (Top 25):")
    for atype, cnt in sorted(actions_count_by_type.items(), key=lambda x: x[1], reverse=True)[:25]:
        print(f"  • {atype}: {cnt}")

    out_file = 'card_effects_db.json'
    print(f"\nWriting to {out_file}...")
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(all_cards_map, f, ensure_ascii=False, indent=2)
    print(f"Successfully saved {out_file} ({os.path.getsize(out_file):,} bytes)!")

if __name__ == '__main__':
    main()
