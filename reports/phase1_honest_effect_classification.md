# Phase 1: Honest Card Effect Classification Report
Generated on: 2026-11-13T12:50:54.540Z

## Summary Counts
- **Total Cards Inspected**: 14609
- **VERIFIED**: 746 (5.11%)
- **PARTIAL**: 5632 (38.55%)
- **NEEDS_MANUAL_REVIEW**: 8050 (55.10%)
- **UNIMPLEMENTED**: 181 (1.24%)

## Implementation Source Breakdown
- **Vanilla (No Effect Text)**: 374
- **PerCardRegistry (`engine/cards/`)**: 1907
- **Compiler Explicit Overrides (`compiler/overrides/`)**: 492
- **Compiled IR Only (`data/ir_shards/`)**: 11836

## Top Unhandled Operations (`UNHANDLED_OPERATION` in `engine/ops/index.js`)
| Operation | Clause Count |
| :--- | ---: |
| `CONTRACT_ADVENT_RULE` | 42 |
| `ACTIVATE_CARD_EFFECT` | 32 |
| `COPY_EFFECT` | 29 |
| `TRIGGERED_WATCHER` | 27 |
| `ADVENT_RULE_MODIFIER` | 25 |
| `PUT_UNDERNEATH` | 24 |
| `DECK_BUILDING_RULE` | 23 |
| `ADVENT` | 23 |
| `ACTIVATE_EFFECT_SPECIAL` | 23 |
| `PIERCING_RULE` | 22 |
| `LOOK_HAND` | 21 |
| `MODIFY_DESTINATION` | 20 |
| `REDIRECT_TARGET` | 18 |
| `ACTIVATE_TRIGGER` | 18 |
| `REVEAL_CARDS` | 18 |
| `DISCARD_MIRAGE_COST` | 18 |
| `DISCARD_ZONE` | 18 |
| `ATTACH_CARD_UNDERNEATH` | 18 |
| `SEND_TO_VOID` | 17 |
| `TRIGGER_CONDITION` | 16 |
| `CHOOSE_BLOCKER` | 15 |
| `ADVENT_RULE` | 15 |
| `BRAVE_EFFECT_ACTIVATION` | 15 |
| `REPLACEMENT_EFFECT` | 14 |
| `ADVENT_COST` | 14 |
| `DECREASE_BP_EFFECT` | 13 |
| `TRIGGER_COUNTER` | 13 |
| `CORE_CHARGE` | 13 |
| `REDIRECT_CORE_DESTINATION` | 12 |
| `DISCARD_UNDERNEATH_COST` | 12 |

## Top Silent No-Op / Dummy Modifier Operations
| Operation | Clause Count |
| :--- | ---: |
| `CONTINUOUS_RULE` | 496 |
| `ACTIVATE_FLASH` | 178 |
| `ADVENT_PAY` | 165 |
| `INDESTRUCTIBLE` | 145 |
| `UNPREVENTABLE` | 127 |
| `CONTINUE_BATTLE` | 103 |
| `CHANGE` | 102 |
| `CARD_RULE_MODIFIER` | 92 |
| `MODIFY_EFFECT` | 80 |
| `PREVENT_WHEN_SUMMONED` | 75 |
| `CAST_MAGIC_FREE` | 71 |
| `PLAY_CONDITION` | 60 |
| `ACTIVATE_EFFECT_ACTION` | 52 |
| `SET_BURST` | 38 |
| `FORMAT_MARKER` | 35 |
| `MODIFY_EFFECT_VALUE` | 34 |
| `TOKEN_DEPLOYMENT` | 31 |
| `MIRAGE_OPERATION` | 30 |
| `MAGIC_RESTRICTION` | 24 |
| `RULE_OR_TEXT_MODIFIER` | 21 |
| `ACTIVATE_BURST` | 13 |
| `BP_OR_LEVEL_MODIFIER` | 13 |
| `STEP_MODIFIER` | 9 |
| `COMPARE_LV_INSTEAD_OF_BP` | 5 |
| `PREVENT_LOSS` | 5 |
| `SET_BP` | 5 |
| `SKIP_STEP` | 4 |
| `COMPARE_LEVELS` | 1 |
| `PAY_COST` | 1 |

## Top Unparsed Conditions (Ignored by `evaluateCondition()` in `engine/resolver.js`)
| Condition Text | Clause Count |
| :--- | ---: |
| If the Spirit is currently battling | 96 |
| While [Soul Core] is on this Spirit | 60 |
| While this card is in Soul State | 42 |
| if it has 0 BP | 36 |
| If you have six counters or more | 34 |
| While you have a Burst set | 33 |
| If [Soul Core] is on this Spirit | 33 |
| if you have six counters or more | 33 |
| if you control any "50th"-named Spirit | 30 |
| While there is [Soul Core] on this Spirit | 27 |
| If there is [Soul Core] on this Spirit | 25 |
| If you have four counters or more | 25 |
| If you control any Ultimate | 22 |
| If your Life is at three or less | 20 |
| If you have two counters or more | 20 |
| If you have five counters or more | 20 |
| If your Life is three or less | 19 |
| While you control any Ultimate | 18 |
| If you've done so | 17 |
| While your Hand is five or less | 17 |
| if it's the opposing Attack Step | 16 |
| While [Soul Core] (Soul Core) is on this Spirit | 16 |
| if you don't have a Mirage set | 16 |
| If you have a Burst set | 15 |
| While this card is in the Trash | 14 |
| If you have eight counters or more | 14 |
| if you have eight counters or more | 14 |
| If your Life is five or less | 13 |
| if you have two counters or more | 13 |
| if you have four counters or more | 13 |
