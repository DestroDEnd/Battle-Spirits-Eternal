"""
Comprehensive Universal Card Effect Parser & Compiler for Battle Spirits Eternal
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
        # Check When Braved / During Brave
        if re.search(r'\[When Braved\]|\[During (?:Spirit |Ultimate )?Brave\]', text, re.I):
            return 1, 'BRAVED'
        if re.search(r'\[During Set\]|\[Mirage\]', text, re.I):
            return 1, 'MIRAGE_SET'
        return 1, None
    return min(levels), None

def parse_canva_rules_from_clause(text):
    """Extracts Canva rule metadata from an effect clause."""
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
        # classify by_condition type
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
        timing_relation = 'ALSO'  # simultaneous
    elif re.search(r'\bthen\b|その後', text, re.I):
        timing_relation = 'THEN'  # sequential after checks
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
        burst_lock_target = 'BURST_CARD'  # target is the card (immunity protects)
    elif re.search(r'opponent\s+cannot\s+activate\s+(?:their\s+)?burst(?:\s+effects)?', lower):
        burst_lock_target = 'PLAYER'  # target is player (immunity irrelevant)

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

print("Base parser helper functions loaded.")
