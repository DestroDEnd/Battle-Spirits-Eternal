import json

with open('card_effects_db.json', 'r', encoding='utf-8') as f:
    db = json.load(f)

print("Current Alphard:", db.get("The PoisonSnakeScythe Alphard"))

db["The PoisonSnakeScythe Alphard"] = {
    "type": "Brave",
    "color": "Purple",
    "cost": 2,
    "brave_cost_boost": 0,
    "brave_bp_boost": 1000,
    "brave_condition": "Cost 3 or more Ultimate",
    "triggers": {
        "WHEN_DESTROYED_IN_BATTLE": [
            {
                "type": "DESTROY_OPPOSING_BATTLER_WHEN_ONLY_HOST_DESTROYED_BY_BP",
                "require_braved": True,
                "desc": "When only this Ultimate is destroyed by comparing BP, destroy an opposing Spirit/Ultimate that was in battle with this Ultimate.",
                "min_level": 1
            }
        ]
    }
}

with open('card_effects_db.json', 'w', encoding='utf-8') as f:
    json.dump(db, f, indent=2, ensure_ascii=False)

print("Updated Alphard successfully.")
