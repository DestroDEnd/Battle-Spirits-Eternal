import sys
sys.stdout.reconfigure(encoding='utf-8')
import json

with open('card_effects_db.json', 'r', encoding='utf-8') as f:
    db = json.load(f)

javad_effects = {
    "type": "Ultimate",
    "color": "Purple",
    "cost": 3,
    "symbol": "Gold core",
    "family": "Hell Contract, Evil God",
    "is_vanilla": False,
    "triggers": {
        "PASSIVE": [
            {
                "type": "SPECIAL_EFFECT",
                "desc": "When your cores or the opposing cores are sent to the Void/Trash by Evil God family effects, your counters +2",
                "raw_text": "(Can't Stack) When your cores or the opposing cores are sent to the Void/Trash from the Life/Field/Reserve/Trash by your \"Evil God\" family effects, your counters +2. Also, if that's a \"DemonLord\" effect, you can draw a card.",
                "min_level": 3,
                "is_braved": False,
                "require_braved": False,
                "canva_rules": {
                    "is_mandatory": True,
                    "is_optional": False,
                    "do_as_much_as_possible": True,
                    "by_condition": None,
                    "if_condition": None,
                    "timing_relation": "STANDARD",
                    "limit": None,
                    "burst_lock_target": None,
                    "name_filter": "Evil God",
                    "penetration": False,
                    "unaffected": False
                }
            }
        ],
        "FLASH": [
            {
                "type": "CORE_DRAIN",
                "desc": "Send 2 core(s) from opposing spirit/ultimate to reserve",
                "raw_text": "Once per turn, you can send a core from your Field/Reserve to the Trash. When you've done so, send two cores from an opposing Spirit/Ultimate to the Reserve.",
                "min_level": 3,
                "is_braved": False,
                "require_braved": False,
                "canva_rules": {
                    "is_mandatory": False,
                    "is_optional": True,
                    "do_as_much_as_possible": False,
                    "by_condition": {
                        "condition_raw": "send a core from your Field/Reserve to the Trash",
                        "is_cost_gated": True,
                        "requires_completion": True,
                        "cost_type": "SEND_CORE_TO_TRASH"
                    },
                    "if_condition": None,
                    "timing_relation": "STANDARD",
                    "limit": "Once per Turn",
                    "burst_lock_target": None,
                    "name_filter": None,
                    "penetration": False,
                    "unaffected": False
                },
                "count": 2,
                "target": "spirit/ultimate",
                "destination": "reserve"
            }
        ]
    },
    "raw_effect": "[Summon Condition: Your Life is at two or more]\n\n[Soul State][Contract Pre-Advent]/[Ultimate] [LV3][LV4]\n(Can't Stack) When your cores or the opposing cores are sent to the Void/Trash from the Life/Field/Reserve/Trash by your \"Evil God\" family effects, your counters +2. Also, if that's a \"DemonLord\" effect, you can draw a card.\n\n[Contract Pre-Advent]/[Ultimate] [LV3][LV4] Flash - (Either Attack Step)\nOnce per turn, you can send a core from your Field/Reserve to the Trash. When you've done so, send two cores from an opposing Spirit/Ultimate to the Reserve."
}

db['The PartnerDemonLord Javad'] = javad_effects

with open('card_effects_db.json', 'w', encoding='utf-8') as f:
    json.dump(db, f, indent=2, ensure_ascii=False)

print("SUCCESSFULLY ADDED The PartnerDemonLord Javad TO card_effects_db.json!")
