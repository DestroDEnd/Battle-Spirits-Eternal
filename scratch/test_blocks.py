import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
# Check getCardAbilityBlocks on Desperado
desperado_effect = """[LV1][LV2] (When Summoned)
Send all cores on every other Spirit to each respective player's Reserve. Then, for each Spirit depleted by this effect, put one core from the Void to this Spirit."""

print("Testing blocks:")
start = text.find('function getCardAbilityBlocks')
end = text.find('function isEffectLevelMet', start)
blocks_func_code = text[start:end]

# We can run node to test getCardAbilityBlocks
