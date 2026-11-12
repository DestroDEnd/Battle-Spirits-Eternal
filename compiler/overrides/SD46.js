export const SD46_OVERRIDES = {
  "SD46-CP01": {
    "cardNumber": "SD46-CP01",
    "name": "Mogami Shunta",
    "keywords": [
      {
        "name": "Core Charge",
        "parameter": "(Emperor Beast/Ten Crown/God-King/Worldswalker/Avatar & Cost 3 or more) (Imagine Brave)",
        "wave": 3,
        "hook": "core_charge",
        "bracketed": true,
        "index": 284
      },
      {
        "name": "Grand Skill",
        "parameter": "2",
        "wave": 3,
        "hook": "grand_skill",
        "bracketed": true,
        "index": 806
      },
      {
        "name": "Grand Skill",
        "parameter": "1",
        "wave": 3,
        "hook": "grand_skill",
        "bracketed": true,
        "index": 939
      }
    ],
    "abilities": [
      {
        "id": "SD46-CP01#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [
            "Grandwalker Nexus"
          ],
          "timing": "PASSIVE",
          "timingLabel": "",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "This Nexus can only be affected by effects that target Grandwalker Nexuses. Cores can only be placed on this Nexus via Core Charge or effects that target Grandwalker Nexuses, and cannot be moved from this Nexus except via effects that target Grandwalker Nexuses."
        },
        "clauses": [
          {
            "rawText": "This Nexus can only be affected by effects that target Grandwalker Nexuses.",
            "cleanText": "This Nexus can only be affected by effects that target Grandwalker Nexuses",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "GRANDWALKER_PROTECTION"
            }
          },
          {
            "rawText": "Cores can only be placed on this Nexus via Core Charge or effects that target Grandwalker Nexuses, and cannot be moved from this Nexus except via effects that target Grandwalker Nexuses.",
            "cleanText": "Cores can only be placed on this Nexus via Core Charge or effects that target Grandwalker Nexuses, and cannot be moved from this Nexus except via effects that target Grandwalker Nexuses",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "GRANDWALKER_CORE_RULE"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD46-CP01#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [],
          "timing": "PASSIVE",
          "timingLabel": "",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": "Core Charge: (Emperor Beast/Ten Crown/God-King/Worldswalker/Avatar & Cost 3 or more) (Imagine Brave)",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": ""
        },
        "clauses": [],
        "unsupported": []
      },
      {
        "id": "SD46-CP01#a2",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [],
          "timing": "WHEN_TARGET_SPIRIT_BRAVE_SUMMONED",
          "timingLabel": "",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "◆When you summon/advent a target Spirit/Brave, put a core from the Void onto this Nexus."
        },
        "clauses": [
          {
            "rawText": "◆When you summon/advent a target Spirit/Brave, put a core from the Void onto this Nexus.",
            "cleanText": "When you summon/advent a target Spirit/Brave, put a core from the Void onto this Nexus",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MOVE_CORE",
              "count": 1,
              "from": { "zone": "void" },
              "to": { "zone": "field", "target": "self" },
              "filter": { "costGte": 3, "familiesAny": ["Emperor Beast", "Ten Crown", "God-King", "Worldswalker", "Avatar"] }
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD46-CP01#a3",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [],
          "timing": "WHEN_DEPLOYED",
          "timingLabel": "",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "◆When this Nexus is deployed, if you do not control a Grandwalker Nexus with the same card name, you can send three cards from your decktop to the Trash. For each target card among them, put a core from the Void onto this Nexus."
        },
        "clauses": [
          {
            "rawText": "◆When this Nexus is deployed, if you do not control a Grandwalker Nexus with the same card name, you can send three cards from your decktop to the Trash.",
            "cleanText": "When this Nexus is deployed, if you do not control a Grandwalker Nexus with the same card name, you can send three cards from your decktop to the Trash",
            "link": null,
            "isOptional": true,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "CORE_CHARGE_TRIGGER",
              "millCount": 3,
              "uniqueGrandwalkerName": true,
              "filter": {
                "costGte": 3,
                "familiesAny": ["Emperor Beast", "Ten Crown", "God-King", "Worldswalker", "Avatar"]
              }
            }
          },
        ],
        "unsupported": []
      },
      {
        "id": "SD46-CP01#a4",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [],
          "timing": "WHEN_REVEALED_BY_BOMBARDMENT",
          "timingLabel": "",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "When this card is revealed by \"Bombardment\"-named effects, send an opposing Life to their Reserve."
        },
        "clauses": [
          {
            "rawText": "When this card is revealed by \"Bombardment\"-named effects, send an opposing Life to their Reserve.",
            "cleanText": "When this card is revealed by \"Bombardment\"-named effects, send an opposing Life to their Reserve",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MOVE_CORE",
              "count": 1,
              "from": {
                "zone": "life",
                "side": "opp"
              },
              "to": {
                "zone": "reserve",
                "side": "opp"
              }
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD46-CP01#a5",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2
          ],
          "levelExplicit": true,
          "prefixes": [
            "Grand Skill: 2"
          ],
          "timing": "MAIN_STEP",
          "timingLabel": "Your Main Step",
          "timingStep": "ANY",
          "limit": "ONCE_PER_TURN",
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "(Once per turn, send two cores from this Nexus to the Void) Draw a card."
        },
        "clauses": [
          {
            "rawText": "(Once per turn, send two cores from this Nexus to the Void) Draw a card.",
            "cleanText": "(Once per turn, send two cores from this Nexus to the Void) Draw a card",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "GRANDWALKER_ACTION",
              "costCores": 2
            }
          },
          {
            "rawText": "Draw a card.",
            "cleanText": "Draw a card",
            "link": "byDoing",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DRAW",
              "count": 1,
              "chooser": "self"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD46-CP01#a6",
        "type": "ABILITY",
        "header": {
          "levels": [
            2
          ],
          "levelExplicit": true,
          "prefixes": [
            "During Seal",
            "Grand Skill: 1"
          ],
          "timing": "ATTACK_STEP",
          "timingLabel": "Either Attack Step",
          "timingStep": "ANY",
          "limit": "ONCE_PER_TURN",
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": true,
          "isMain": false,
          "cleanBody": "(Once per turn, send one core from this Nexus to the Void) Destroy an opposing 15000 BP or less Spirit/Ultimate."
        },
        "clauses": [
          {
            "rawText": "(Once per turn, send one core from this Nexus to the Void) Destroy an opposing 15000 BP or less Spirit/Ultimate.",
            "cleanText": "(Once per turn, send one core from this Nexus to the Void) Destroy an opposing 15000 BP or less Spirit/Ultimate",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "GRANDWALKER_ACTION",
              "costCores": 1
            }
          },
          {
            "rawText": "Destroy an opposing 15000 BP or less Spirit/Ultimate.",
            "cleanText": "Destroy an opposing 15000 BP or less Spirit/Ultimate",
            "link": "byDoing",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DESTROY",
              "count": 1,
              "target": {
                "side": "opp",
                "types": [
                  "Spirit",
                  "Ultimate"
                ],
                "filters": {
                  "bpLte": 15000
                }
              }
            }
          }
        ],
        "unsupported": []
      }
    ],
    "compiledClausesCount": 8,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD46-X01": {
    "cardNumber": "SD46-X01",
    "name": "The BlueThunderGodKing Blitz-Tiger-Z",
    "keywords": [
      {
        "name": "Seal",
        "parameter": "Seal",
        "wave": 2,
        "hook": "seal",
        "bracketed": true,
        "index": 230
      }
    ],
    "abilities": [
      {
        "id": "SD46-X01#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "WHEN_SUMMONED",
          "timingLabel": "When Summoned",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Destroy an opposing 8000 BP or less Spirit. Then, destroy an opposing Spirit/Ultimate with the same family as the destroyed Spirit. These effects can't be prevented by \"Armor\"-named effects."
        },
        "clauses": [
          {
            "rawText": "Destroy an opposing 8000 BP or less Spirit.",
            "cleanText": "Destroy an opposing 8000 BP or less Spirit",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DESTROY",
              "count": 1,
              "ignoreArmor": true,
              "target": {
                "side": "opp",
                "types": [
                  "Spirit"
                ],
                "filters": {
                  "bpLte": 8000
                }
              }
            }
          },
          {
            "rawText": "destroy an opposing Spirit/Ultimate with the same family as the destroyed Spirit.",
            "cleanText": "destroy an opposing Spirit/Ultimate with the same family as the destroyed Spirit",
            "link": "then",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DESTROY",
              "count": 1,
              "ignoreArmor": true,
              "target": {
                "side": "opp",
                "types": [
                  "Spirit",
                  "Ultimate"
                ],
                "filters": {
                  "sameFamilyAsPrevious": true
                }
              }
            }
          },
          {
            "rawText": "These effects can't be prevented by \"Armor\"-named effects.",
            "cleanText": "These effects can't be prevented by \"Armor\"-named effects",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "COMBAT_RESTRICTION"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD46-X01#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2
          ],
          "levelExplicit": true,
          "prefixes": [
            "Seal: Seal"
          ],
          "timing": "WHEN_ATTACKS",
          "timingLabel": "When Attacks",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "You can send [Soul Core] from this Spirit to your Life."
        },
        "clauses": [
          {
            "rawText": "You can send [Soul Core] from this Spirit to your Life.",
            "cleanText": "You can send [Soul Core] from this Spirit to your Life",
            "link": null,
            "isOptional": true,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MOVE_SOUL_CORE",
              "destination": "life",
              "requireSourceSoul": true
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD46-X01#a2",
        "type": "ABILITY",
        "header": {
          "levels": [
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "WHEN_ATTACKS",
          "timingLabel": "When Attacks",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Return a \"Z\"-named Spirit card from your Trash to the Hand."
        },
        "clauses": [
          {
            "rawText": "Return a \"Z\"-named Spirit card from your Trash to the Hand.",
            "cleanText": "Return a \"Z\"-named Spirit card from your Trash to the Hand",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "SALVAGE",
              "count": 1,
              "target": {
                "side": "self",
                "zone": "grave",
                "types": ["Spirit"],
                "filters": { "nameIncludes": "Z" }
              }
            }
          }
        ],
        "unsupported": []
      }
    ],
    "compiledClausesCount": 5,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD46-005": {
    "cardNumber": "SD46-005",
    "name": "The NinthThunderclap ThreeSacredHorses Byerley-Dark-Z",
    "keywords": [
      {
        "name": "Burst",
        "parameter": "After Spirits/Braves are summoned by an opposing effect",
        "wave": 2,
        "hook": "burst",
        "bracketed": true,
        "index": 165
      }
    ],
    "abilities": [
      {
        "id": "SD46-005#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [],
          "timing": "WHEN_GODKING_ATTACKS",
          "timingLabel": "",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "When your \"God-King\" family Spirit attacks, you can pay one cost to summon this set card. When you've done so, you can set a card with Burst effect from your Hand."
        },
        "clauses": [
          {
            "rawText": "When your \"God-King\" family Spirit attacks, you can pay one cost to summon this set card.",
            "cleanText": "When your \"God-King\" family Spirit attacks, you can pay one cost to summon this set card",
            "link": null,
            "isOptional": true,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "SUMMON_FREE",
              "target": "this_card",
              "from": "BURST",
              "costCores": 1
            }
          },
          {
            "rawText": "you can set a card with Burst effect from your Hand.",
            "cleanText": "you can set a card with Burst effect from your Hand",
            "link": "byDoing",
            "isOptional": true,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "SET_BURST_FROM_HAND",
              "count": 1
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD46-005#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [],
          "timing": "BURST",
          "timingLabel": "Burst",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": "AFTER_OPPONENT_SUMMON_EFFECT",
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Destroy three opposing 12000 BP or less Spirits. After this effect resolves, summon this card without paying the cost."
        },
        "clauses": [
          {
            "rawText": "Destroy three opposing 12000 BP or less Spirits.",
            "cleanText": "Destroy three opposing 12000 BP or less Spirits",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DESTROY",
              "count": 3,
              "target": {
                "side": "opp",
                "types": [
                  "Spirit",
                  "Brave"
                ],
                "filters": {
                  "bpLte": 12000
                }
              }
            }
          },
          {
            "rawText": "summon this card without paying the cost.",
            "cleanText": "summon this card without paying the cost",
            "link": "afterResolves",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "SUMMON_FREE",
              "target": "this_card",
              "from": "BURST"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD46-005#a2",
        "type": "ABILITY",
        "header": {
          "levels": [
            2,
            3
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "WHEN_ATTACKS",
          "timingLabel": "When Attacks",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Draw two cards."
        },
        "clauses": [
          {
            "rawText": "Draw two cards.",
            "cleanText": "Draw two cards",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DRAW",
              "count": 2,
              "chooser": "self",
              "forEach": null
            }
          }
        ],
        "unsupported": []
      }
    ],
    "compiledClausesCount": 5,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD46-X02": {
    "cardNumber": "SD46-X02",
    "name": "The RedThunderGodKing Revol-Tiger-Z",
    "keywords": [
      {
        "name": "Seal",
        "parameter": "Seal",
        "wave": 2,
        "hook": "seal",
        "bracketed": true,
        "index": 16
      },
      {
        "name": "Seal",
        "parameter": "During Seal",
        "wave": 2,
        "hook": "seal",
        "bracketed": true,
        "index": 106
      },
      {
        "name": "Grand Bombardment",
        "parameter": null,
        "wave": 4,
        "hook": "bombardment",
        "bracketed": true,
        "index": 142
      }
    ],
    "abilities": [
      {
        "id": "SD46-X02#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": true,
          "prefixes": [
            "Seal: Seal"
          ],
          "timing": "WHEN_SUMMONED",
          "timingLabel": "When Summoned/Attacks",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "You can send this Spirit's [Soul Core] to the Life."
        },
        "clauses": [
          {
            "rawText": "You can send this Spirit's [Soul Core] to the Life.",
            "cleanText": "You can send this Spirit's [Soul Core] to the Life",
            "link": null,
            "isOptional": true,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MOVE_SOUL_CORE",
              "destination": "life",
              "requireSourceSoul": true
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD46-X02#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": true,
          "prefixes": [
            "Seal: During Seal"
          ],
          "timing": "WHEN_ATTACKS",
          "timingLabel": "When Attacks",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": "Grand Bombardment",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "You can reveal two cards from your decktop. For each \"Z\"/\"Steel\" among them, +1 core to any Red Grandwalker Nexus you control, and send an opposing Life to the Reserve. Add the revealed cards to the Hand."
        },
        "clauses": [
          {
            "rawText": "You can reveal two cards from your decktop.",
            "cleanText": "You can reveal two cards from your decktop",
            "link": null,
            "isOptional": true,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "REVEAL_DECKTOP",
              "count": 2
            }
          },
          {
            "rawText": "For each \"Z\"/\"Steel\" among them, +1 core to any Red Grandwalker Nexus you control",
            "cleanText": "For each \"Z\"/\"Steel\" among them, +1 core to any Red Grandwalker Nexus you control",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "GRANDWALKER_ACTION",
              "countFrom": "REVEALED_MATCHES",
              "targetColor": "Red",
              "filter": { "nameIncludesAny": ["Z", "Steel"] }
            }
          },
          {
            "rawText": "send an opposing Life to the Reserve.",
            "cleanText": "send an opposing Life to the Reserve",
            "link": "also",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MOVE_CORE",
              "isCost": false,
              "countFrom": "REVEALED_MATCHES",
              "filter": { "nameIncludesAny": ["Z", "Steel"] },
              "from": { "zone": "life", "side": "opp" },
              "to": { "zone": "reserve", "side": "opp" }
            }
          },
          {
            "rawText": "Add the revealed cards to the Hand.",
            "cleanText": "Add the revealed cards to the Hand",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "ADD_TO_HAND",
              "count": 2
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD46-X02#a2",
        "type": "ABILITY",
        "header": {
          "levels": [
            2,
            3
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "WHEN_ATTACKS",
          "timingLabel": "When Attacks",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Destroy an opposing 15000 BP or less Spirit."
        },
        "clauses": [
          {
            "rawText": "Destroy an opposing 15000 BP or less Spirit.",
            "cleanText": "Destroy an opposing 15000 BP or less Spirit",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DESTROY",
              "count": 1,
              "target": {
                "side": "opp",
                "types": [
                  "Spirit",
                  "Ultimate"
                ],
                "filters": {
                  "bpLte": 15000
                }
              }
            }
          }
        ],
        "unsupported": []
      }
    ],
    "compiledClausesCount": 6,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD46-X03": {
    "cardNumber": "SD46-X03",
    "name": "The SteelThunderKing Igridios-Z",
    "keywords": [
      {
        "name": "Accel",
        "parameter": "Cost 6 ([White Core",
        "wave": 2,
        "hook": "accel",
        "bracketed": true,
        "index": 160
      }
    ],
    "abilities": [
      {
        "id": "SD46-X03#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [],
          "timing": "WHEN_OPPONENT_WOULD_REDUCE_LIFE",
          "timingLabel": "",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "When your Life would be reduced by an opposing effect, by paying one cost to summon this card from your Hand/Removed Zone, your Life won't be reduced."
        },
        "clauses": [
          {
            "rawText": "When your Life would be reduced by an opposing effect, by paying one cost to summon this card from your Hand/Removed Zone, your Life won't be reduced.",
            "cleanText": "When your Life would be reduced by an opposing effect, by paying one cost to summon this card from your Hand/Removed Zone, your Life won't be reduced",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "SUMMON_THIS_CARD",
              "from": "HAND_OR_REMOVED",
              "costCores": 1,
              "preventsLifeLoss": true
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD46-X03#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [],
          "timing": "FLASH",
          "timingLabel": "Flash",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": "Red Core",
          "burstCondition": null,
          "isFlash": true,
          "isMain": false,
          "cleanBody": "Return three opposing Spirits/Ultimates to the Hand. After this effect resolves, put this card face-up onto the Removed Zone."
        },
        "clauses": [
          {
            "rawText": "Return three opposing Spirits/Ultimates to the Hand.",
            "cleanText": "Return three opposing Spirits/Ultimates to the Hand",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "BOUNCE",
              "count": 3,
              "target": {
                "side": "opp",
                "types": ["Spirit", "Ultimate"]
              }
            }
          },
          {
            "rawText": "put this card face-up onto the Removed Zone.",
            "cleanText": "put this card face-up onto the Removed Zone",
            "link": "afterResolves",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "OPEN_ZONE"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD46-X03#a2",
        "type": "ABILITY",
        "header": {
          "levels": [
            2,
            3
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "WHEN_ATTACKS_OR_BLOCKS",
          "timingLabel": "When Attacks/Blocks",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Destroy an opposing 10000 BP or less Spirit/Ultimate. Also, this attacking Spirit can't be blocked by opposing Spirits."
        },
        "clauses": [
          {
            "rawText": "Destroy an opposing 10000 BP or less Spirit/Ultimate.",
            "cleanText": "Destroy an opposing 10000 BP or less Spirit/Ultimate",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DESTROY",
              "count": 1,
              "target": {
                "side": "opp",
                "types": [
                  "Spirit",
                  "Ultimate"
                ],
                "filters": {
                  "bpLte": 10000
                }
              }
            }
          },
          {
            "rawText": "this attacking Spirit can't be blocked by opposing Spirits.",
            "cleanText": "this attacking Spirit can't be blocked by opposing Spirits",
            "link": "also",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "UNBLOCKABLE",
              "cannotBeBlockedByFilter": { "types": ["Spirit"] }
            }
          }
        ],
        "unsupported": []
      }
    ],
    "compiledClausesCount": 5,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD46-006": {
    "cardNumber": "SD46-006",
    "name": "The SteelThunderKnight Licospiros",
    "keywords": [
      {
        "name": "Accel",
        "parameter": "Cost 6 ([White Core",
        "wave": 2,
        "hook": "accel",
        "bracketed": true,
        "index": 8
      }
    ],
    "abilities": [
      {
        "id": "SD46-006#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [],
          "timing": "FLASH",
          "timingLabel": "Flash",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": "Red Core",
          "burstCondition": null,
          "isFlash": true,
          "isMain": false,
          "cleanBody": "Return an opposing Spirit to the deckbottom. After this effect resolves, put this card onto the Removed Zone."
        },
        "clauses": [
          {
            "rawText": "Return an opposing Spirit to the deckbottom.",
            "cleanText": "Return an opposing Spirit to the deckbottom",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "BOUNCE",
              "count": 1,
              "target": {
                "side": "opp",
                "types": [
                  "Spirit"
                ]
              },
              "destination": "deck_bottom"
            }
          },
          {
            "rawText": "put this card onto the Removed Zone.",
            "cleanText": "put this card onto the Removed Zone",
            "link": "afterResolves",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "OPEN_ZONE"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD46-006#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "WHEN_SUMMONED",
          "timingLabel": "When Summoned",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "For each three cards in the opposing Hand, put a core from the Void to this Spirit."
        },
        "clauses": [
          {
            "rawText": "For each three cards in the opposing Hand, put a core from the Void to this Spirit.",
            "cleanText": "For each three cards in the opposing Hand, put a core from the Void to this Spirit",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MOVE_CORE",
              "count": 1,
              "countFrom": "OPPONENT_HAND_DIV3",
              "from": {
                "zone": "void"
              },
              "to": {
                "zone": "field",
                "target": "self"
              }
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD46-006#a2",
        "type": "ABILITY",
        "header": {
          "levels": [
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "WHEN_DESTROYED",
          "timingLabel": "When Destroyed by the Opponent",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "You can return this Spirit to the Hand."
        },
        "clauses": [
          {
            "rawText": "You can return this Spirit to the Hand.",
            "cleanText": "You can return this Spirit to the Hand",
            "link": null,
            "isOptional": true,
            "isCost": false,
            "condition": "destroyed_by_opponent",
            "duration": null,
            "op": {
              "op": "BOUNCE",
              "count": 1,
              "target": {
                "target": "self"
              }
            }
          }
        ],
        "unsupported": []
      }
    ],
    "compiledClausesCount": 4,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD46-007": {
    "cardNumber": "SD46-007",
    "name": "The SteelThunderKnight Tigrigoreus",
    "keywords": [
      {
        "name": "Accel",
        "parameter": "Cost 3 ([White Core",
        "wave": 2,
        "hook": "accel",
        "bracketed": true,
        "index": 7
      }
    ],
    "abilities": [
      {
        "id": "SD46-007#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [],
          "timing": "MAIN",
          "timingLabel": "Main",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": "Red Core",
          "burstCondition": null,
          "isFlash": false,
          "isMain": true,
          "cleanBody": "Draw a card. After this effect resolves, put this card onto the Removed Zone."
        },
        "clauses": [
          {
            "rawText": "Draw a card.",
            "cleanText": "Draw a card",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DRAW",
              "count": 1,
              "chooser": "self",
              "forEach": null
            }
          },
          {
            "rawText": "put this card onto the Removed Zone.",
            "cleanText": "put this card onto the Removed Zone",
            "link": "afterResolves",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "OPEN_ZONE"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD46-007#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "PASSIVE",
          "timingLabel": "",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "This Spirit is unaffected by opposing Spirit/Nexus effects."
        },
        "clauses": [
          {
            "rawText": "This Spirit is unaffected by opposing Spirit/Nexus effects.",
            "cleanText": "This Spirit is unaffected by opposing Spirit/Nexus effects",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "IMMUNITY",
              "immuneTo": "OPPOSING_EFFECTS",
              "sourceTypes": ["Spirit", "Nexus"]
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD46-007#a2",
        "type": "ABILITY",
        "header": {
          "levels": [
            2,
            3
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "ATTACK_STEP",
          "timingLabel": "Opposing Attack Step",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "This Spirit gains +3000 BP, and can block while exhausted."
        },
        "clauses": [
          {
            "rawText": "This Spirit gains +3000 BP, and can block while exhausted.",
            "cleanText": "This Spirit gains +3000 BP, and can block while exhausted",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "BP_BUFF",
              "amount": 3000,
              "target": { "state": "attacking_or_blocking" },
              "forEach": "EXHAUSTED_SPIRIT_COUNT",
              "duration": "THIS_TURN",
              "canBlockWhileExhausted": true
            }
          }
        ],
        "unsupported": []
      }
    ],
    "compiledClausesCount": 4,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD46-003": {
    "cardNumber": "SD46-003",
    "name": "Thunder-Z-Grizzly",
    "keywords": [
      {
        "name": "Accel",
        "parameter": "Cost 4 ([Red Core",
        "wave": 2,
        "hook": "accel",
        "bracketed": true,
        "index": 8
      }
    ],
    "abilities": [
      {
        "id": "SD46-003#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [],
          "timing": "FLASH",
          "timingLabel": "Flash",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": "Core",
          "burstCondition": null,
          "isFlash": true,
          "isMain": false,
          "cleanBody": "Destroy an opposing Brave, and draw a card. After this effect resolves, put this card face-up onto the Removed Zone."
        },
        "clauses": [
          {
            "rawText": "Destroy an opposing Brave",
            "cleanText": "Destroy an opposing Brave",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DESTROY",
              "count": 1,
              "target": {
                "side": "opp",
                "types": [
                  "Brave"
                ]
              }
            }
          },
          {
            "rawText": "draw a card.",
            "cleanText": "draw a card",
            "link": "also",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DRAW",
              "count": 1,
              "chooser": "self",
              "forEach": null
            }
          },
          {
            "rawText": "put this card face-up onto the Removed Zone.",
            "cleanText": "put this card face-up onto the Removed Zone",
            "link": "afterResolves",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "OPEN_ZONE"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD46-003#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "WHEN_SUMMONED",
          "timingLabel": "When Summoned",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Destroy an opposing Nexus. Also, when summoned from the Removed Zone, destroy an opposing 10000 BP or more Spirit/Ultimate."
        },
        "clauses": [
          {
            "rawText": "Destroy an opposing Nexus.",
            "cleanText": "Destroy an opposing Nexus",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DESTROY",
              "count": 1,
              "target": {
                "side": "opp",
                "types": [
                  "Nexus"
                ]
              }
            }
          },
          {
            "rawText": "when summoned from the Removed Zone, destroy an opposing 10000 BP or more Spirit/Ultimate.",
            "cleanText": "when summoned from the Removed Zone, destroy an opposing 10000 BP or more Spirit/Ultimate",
            "link": "also",
            "isOptional": false,
            "isCost": false,
            "condition": "summoned_from_removed",
            "duration": null,
            "op": {
              "op": "DESTROY",
              "count": 1,
              "target": {
                "side": "opp",
                "types": ["Spirit", "Ultimate"],
                "filters": { "bpGte": 10000 }
              }
            }
          }
        ],
        "unsupported": []
      }
    ],
    "compiledClausesCount": 5,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD46-001": {
    "cardNumber": "SD46-001",
    "name": "Thunder-Z-Puma",
    "keywords": [
      {
        "name": "Bombardment",
        "parameter": null,
        "wave": 4,
        "hook": "bombardment",
        "bracketed": true,
        "index": 385
      },
      {
        "name": "Twinkle Bombardment",
        "parameter": null,
        "wave": 4,
        "hook": "bombardment",
        "bracketed": true,
        "index": 399
      },
      {
        "name": "Grand Bombardment",
        "parameter": null,
        "wave": 4,
        "hook": "bombardment",
        "bracketed": true,
        "index": 421
      }
    ],
    "abilities": [
      {
        "id": "SD46-001#a0",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "WHEN_SUMMONED",
          "timingLabel": "When Summoned",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "You can reveal three cards from your decktop. Among them, add an exactly-named \"Mogami Shunta\", and a Red/White \"Worldswalker\"/\"Ten Crown\"/\"God-King\" family Spirit card to the Hand. Discard any remaining cards."
        },
        "clauses": [
          {
            "rawText": "You can reveal three cards from your decktop.",
            "cleanText": "You can reveal three cards from your decktop",
            "link": null,
            "isOptional": true,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "REVEAL_DECKTOP",
              "count": 3
            }
          },
          {
            "rawText": "Among them, add an exactly-named \"Mogami Shunta\", and a Red/White \"Worldswalker\"/\"Ten Crown\"/\"God-King\" family Spirit card to the Hand.",
            "cleanText": "Among them, add an exactly-named \"Mogami Shunta\", and a Red/White \"Worldswalker\"/\"Ten Crown\"/\"God-King\" family Spirit card to the Hand",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "ADD_TO_HAND",
              "filterGroups": [
                { "count": 1, "filter": { "cardNumber": "SD46-CP01" } },
                { "count": 1, "filter": { "types": ["Spirit"], "colorsAny": ["Red", "White"], "familiesAny": ["Worldswalker", "Ten Crown", "God-King"] } }
              ]
            }
          },
          {
            "rawText": "Discard any remaining cards.",
            "cleanText": "Discard any remaining cards",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DISCARD_REVEALED"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD46-001#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "PASSIVE",
          "timingLabel": "",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "This Spirit's color and symbol are also treated as White."
        },
        "clauses": [
          {
            "rawText": "This Spirit's color and symbol are also treated as White.",
            "cleanText": "This Spirit's color and symbol are also treated as White",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "TREAT_COLOR_SYMBOL",
              "color": "White"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD46-001#a2",
        "type": "ABILITY",
        "header": {
          "levels": [
            2
          ],
          "levelExplicit": true,
          "prefixes": [
            "During Seal"
          ],
          "timing": "ATTACK_STEP",
          "timingLabel": "Your Attack Step",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "The amount of cards revealed by your [Bombardment]/[Twinkle Bombardment]/[Grand Bombardment] becomes three."
        },
        "clauses": [
          {
            "rawText": "The amount of cards revealed by your [Bombardment]/[Twinkle Bombardment]/[Grand Bombardment] becomes three.",
            "cleanText": "The amount of cards revealed by your [Bombardment]/[Twinkle Bombardment]/[Grand Bombardment] becomes three",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "REVEAL_BONUS",
              "amount": 3,
              "appliesTo": "BOMBARDMENT"
            }
          }
        ],
        "unsupported": []
      }
    ],
    "compiledClausesCount": 5,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "LM16-01": {
    "cardNumber": "LM16-01",
    "abilities": [
      {
        "id": "LM16-01#a0",
        "type": "ABILITY",
        "header": { "levels": [1, 2, 3], "levelExplicit": false, "prefixes": ["Accel"], "timing": "MAIN", "timingLabel": "Main", "timingStep": "ANY", "limit": null, "cantStack": false, "keyword": "Accel", "burstCondition": null, "isFlash": false, "isMain": true, "cleanBody": "Reveal three cards from your deck. Add an Imagine family Brave and a God-King or Ten Crown Spirit among them to your hand, discard the rest, then place this card face-up in the Removed Zone." },
        "clauses": [
          { "rawText": "You can reveal three cards from your decktop.", "cleanText": "Reveal three cards from your decktop", "link": null, "isOptional": true, "isCost": false, "condition": null, "duration": null, "op": { "op": "REVEAL_DECKTOP", "count": 3 } },
          { "rawText": "Add an Imagine family Brave card and a God-King or Ten Crown family Spirit card to your Hand.", "cleanText": "Add the matching cards to your Hand", "link": null, "isOptional": false, "isCost": false, "condition": null, "duration": null, "op": { "op": "ADD_TO_HAND", "filterGroups": [ { "count": 1, "filter": { "types": ["Brave"], "family": "Imagine" }, "title": "Choose an Imagine Brave" }, { "count": 1, "filter": { "types": ["Spirit"], "familiesAny": ["God-King", "Ten Crown"] }, "title": "Choose a God-King or Ten Crown Spirit" } ] } },
          { "rawText": "Discard any remaining cards.", "cleanText": "Discard any remaining revealed cards", "link": null, "isOptional": false, "isCost": false, "condition": null, "duration": null, "op": { "op": "DISCARD_REVEALED" } },
          { "rawText": "After this effect resolves, put this card face-up onto the Removed Zone.", "cleanText": "After this effect resolves, put this card face-up onto the Removed Zone", "link": "afterResolves", "isOptional": false, "isCost": false, "condition": null, "duration": null, "op": { "op": "OPEN_ZONE" } }
        ],
        "unsupported": []
      },
      {
        "id": "LM16-01#a1",
        "type": "ABILITY",
        "header": { "levels": [1, 2, 3], "levelExplicit": true, "prefixes": [], "timing": "WHEN_SUMMONED", "timingLabel": "When Summoned", "timingStep": "ANY", "limit": null, "cantStack": false, "keyword": null, "burstCondition": null, "isFlash": false, "isMain": false, "cleanBody": "When summoned from the Removed Zone, you can summon an Imagine family Brave card from your Hand without paying its cost." },
        "clauses": [
          { "rawText": "When summoned from the Removed Zone, you can summon an Imagine family Brave card from your Hand without paying its cost.", "cleanText": "Summon an Imagine family Brave from your Hand without paying its cost", "link": null, "isOptional": true, "isCost": false, "condition": "summoned_from_removed", "duration": null, "op": { "op": "SUMMON", "from": "hand", "free": true, "filter": { "types": ["Brave"], "family": "Imagine" } } }
        ],
        "unsupported": []
      }
    ],
    "compiledClausesCount": 5,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  }
};
