/**
 * compiler/overrides/SD27.js
 * 
 * Explicit deterministic IR definitions for SD27 cards.
 */

export const SD27_OVERRIDES = {
  "SD27-003": {
    "cardNumber": "SD27-003",
    "name": "Eridanus-Dragon",
    "keywords": [],
    "abilities": [
      {
        "id": "SD27-003#a0",
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
          "cleanBody": "When your Cost 3 or less Spirits are destroyed by opposing effects, they can remain on the Field, exhausted."
        },
        "clauses": [
          {
            "rawText": "When your Cost 3 or less Spirits are destroyed by opposing effects, they can remain on the Field, exhausted.",
            "cleanText": "When your Cost 3 or less Spirits are destroyed by opposing effects, they can remain on the Field, exhausted",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "REMAIN_ON_FIELD_EXHAUSTED",
              "maxCost": 3
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD27-003#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            2
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "MAIN_STEP",
          "timingLabel": "Your Main Step",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "When you're summoning a \"Galaxian\" family Spirit card, by exhausting this Spirit, treat all the reduction symbols of that Spirit card as fulfilled."
        },
        "clauses": [
          {
            "rawText": "When you're summoning a \"Galaxian\" family Spirit card, by exhausting this Spirit, treat all the reduction symbols of that Spirit card as fulfilled.",
            "cleanText": "When you're summoning a \"Galaxian\" family Spirit card, by exhausting this Spirit, treat all the reduction symbols of that Spirit card as fulfilled",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "EXHAUST",
              "target": "self"
            }
          }
        ],
        "unsupported": []
      }
    ],
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD27-005": {
    "cardNumber": "SD27-005",
    "name": "The GenesisDragon Bayer",
    "keywords": [
      {
        "name": "Ultimate Trigger",
        "parameter": "[LV4",
        "wave": 3,
        "hook": "ultimate_trigger",
        "bracketed": true,
        "index": 213
      }
    ],
    "abilities": [
      {
        "id": "SD27-005#a0",
        "type": "CONDITION",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [
            "Summon Condition: You control one or more Cost 1 or higher Spirits"
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
          "cleanBody": ""
        },
        "rawText": "[Summon Condition: You control one or more Cost 1 or higher Spirits]",
        "clauses": [],
        "unsupported": []
      },
      {
        "id": "SD27-005#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            3,
            4,
            5
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "TURN_TRIGGER",
          "timingLabel": "Your Turn",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "When your \"Galaxian\" family Spirit effects would target opposing Spirits, you can also target opposing Ultimates."
        },
        "clauses": [
          {
            "rawText": "When your \"Galaxian\" family Spirit effects would target opposing Spirits, you can also target opposing Ultimates.",
            "cleanText": "When your \"Galaxian\" family Spirit effects would target opposing Spirits, you can also target opposing Ultimates",
            "link": null,
            "isOptional": true,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "GRANT_FAMILY"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD27-005#a2",
        "type": "ABILITY",
        "header": {
          "levels": [
            4,
            5
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "WHEN_ATTACKS",
          "timingLabel": "When Attacks",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": "Ultimate Trigger",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "When Ultimate Trigger hits, return a Spirit card from your Trash to your Hand."
        },
        "clauses": [
          {
            "rawText": "When Ultimate Trigger hits, return a Spirit card from your Trash to your Hand.",
            "cleanText": "When Ultimate Trigger hits, return a Spirit card from your Trash to your Hand",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "SALVAGE",
              "count": 1,
              "family": null,
              "targetType": "Spirit",
              "destination": "HAND"
            }
          }
        ],
        "unsupported": []
      }
    ],
    "compiledClausesCount": 2,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD27-X01": {
    "cardNumber": "SD27-X01",
    "name": "The GenesisDragon Ptolemy",
    "keywords": [
      {
        "name": "Burst",
        "parameter": "After your Life is reduced",
        "wave": 2,
        "hook": "burst",
        "bracketed": true,
        "index": 70
      },
      {
        "name": "Ultimate Trigger",
        "parameter": "[LV4",
        "wave": 3,
        "hook": "ultimate_trigger",
        "bracketed": true,
        "index": 249
      }
    ],
    "abilities": [
      {
        "id": "SD27-X01#a0",
        "type": "CONDITION",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [
            "Summon Condition: You control one or more Cost 3 or higher Spirits"
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
          "cleanBody": ""
        },
        "rawText": "[Summon Condition: You control one or more Cost 3 or higher Spirits]",
        "clauses": [],
        "unsupported": []
      },
      {
        "id": "SD27-X01#a1",
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
          "burstCondition": "AFTER_YOUR_LIFE_REDUCED",
          "isFlash": false,
          "isMain": false,
          "cleanBody": "Summon this Ultimate card without paying the cost. Then, if your Life is three or less, destroy an opposing 12000 BP or less Spirit/Ultimate."
        },
        "clauses": [
          {
            "rawText": "Summon this Ultimate card without paying the cost.",
            "cleanText": "Summon this Ultimate card without paying the cost",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "SUMMON_THIS_CARD",
              "from": "HAND_OR_BURST"
            }
          },
          {
            "rawText": "if your Life is three or less, destroy an opposing 12000 BP or less Spirit/Ultimate.",
            "cleanText": "destroy an opposing 12000 BP or less Spirit/Ultimate",
            "link": "then",
            "isOptional": false,
            "isCost": false,
            "condition": "if your Life is three or less",
            "duration": null,
            "op": {
              "op": "DESTROY",
              "count": 1,
              "target": {
                "side": "opp",
                "types": [
                  "Spirit"
                ],
                "filters": {
                  "bpLte": 12000
                }
              }
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD27-X01#a2",
        "type": "ABILITY",
        "header": {
          "levels": [
            4,
            5
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "WHEN_ATTACKS",
          "timingLabel": "When Attacks",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": "Ultimate Trigger",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "When Ultimate Trigger hits, destroy every opposing Nexus, and draw two cards."
        },
        "clauses": [
          {
            "rawText": "When Ultimate Trigger hits, destroy every opposing Nexus",
            "cleanText": "When Ultimate Trigger hits, destroy every opposing Nexus",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "DESTROY",
              "count": 1,
              "target": {
                "side": "either"
              },
              "isCost": false
            }
          },
          {
            "rawText": "draw two cards.",
            "cleanText": "draw two cards",
            "link": "also",
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
    "compiledClausesCount": 4,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD27-004": {
    "cardNumber": "SD27-004",
    "name": "The TimeGuardian Horolo-Gium",
    "keywords": [],
    "abilities": [
      {
        "id": "SD27-004#a0",
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
          "keyword": null,
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "The cost of this Spirit card in Hand is the same as the number of your Lives."
        },
        "clauses": [
          {
            "rawText": "The cost of this Spirit card in Hand is the same as the number of your Lives.",
            "cleanText": "The cost of this Spirit card in Hand is the same as the number of your Lives",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "COST_MODIFIER"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD27-004#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
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
          "cleanBody": "You can summon any number of \"Galaxian\" family Brave cards from your Hand, without paying the cost."
        },
        "clauses": [
          {
            "rawText": "You can summon any number of \"Galaxian\" family Brave cards from your Hand, without paying the cost.",
            "cleanText": "You can summon any number of \"Galaxian\" family Brave cards from your Hand, without paying the cost",
            "link": null,
            "isOptional": true,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "SUMMON",
              "free": true
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD27-004#a2",
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
          "cleanBody": "This Spirit's symbol is also treated as Purple/Green/White/Yellow/Blue."
        },
        "clauses": [
          {
            "rawText": "This Spirit's symbol is also treated as Purple/Green/White/Yellow/Blue.",
            "cleanText": "This Spirit's symbol is also treated as Purple/Green/White/Yellow/Blue",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "TREAT_RULE"
            }
          }
        ],
        "unsupported": []
      }
    ],
    "compiledClausesCount": 3,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  },
  "SD27-X02": {
    "cardNumber": "SD27-X02",
    "name": "The UltimateStar Ultimate-Zodiac",
    "keywords": [
      {
        "name": "Ultimate Trigger",
        "parameter": "[LV3",
        "wave": 3,
        "hook": "ultimate_trigger",
        "bracketed": true,
        "index": 65
      }
    ],
    "abilities": [
      {
        "id": "SD27-X02#a0",
        "type": "CONDITION",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [
            "Summon Condition: You control one or more Red Spirit/Ultimate"
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
          "cleanBody": ""
        },
        "rawText": "[Summon Condition: You control one or more Red Spirit/Ultimate]",
        "clauses": [],
        "unsupported": []
      },
      {
        "id": "SD27-X02#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            3,
            4,
            5
          ],
          "levelExplicit": true,
          "prefixes": [],
          "timing": "WHEN_ATTACKS",
          "timingLabel": "When Attacks",
          "timingStep": "ANY",
          "limit": null,
          "cantStack": false,
          "keyword": "Ultimate Trigger",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "When Ultimate Trigger hits, reveal up to twelve cards from your decktop. Summon any number of \"Galaxian\" family Spirit cards from among them, without paying the cost. Discard any remaining cards."
        },
        "clauses": [
          {
            "rawText": "When Ultimate Trigger hits, reveal up to twelve cards from your decktop.",
            "cleanText": "When Ultimate Trigger hits, reveal up to twelve cards from your decktop",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "REVEAL_DECKTOP",
              "count": 1,
              "upTo": true
            }
          },
          {
            "rawText": "Summon any number of \"Galaxian\" family Spirit cards from among them, without paying the cost.",
            "cleanText": "Summon any number of \"Galaxian\" family Spirit cards from among them, without paying the cost",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "SUMMON",
              "free": true
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
        "id": "SD27-X02#a2",
        "type": "ABILITY",
        "header": {
          "levels": [
            4,
            5
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
          "cleanBody": "All your \"Galaxian\" family Spirits are treated as being on their highest LVs, and gain +5000 BP."
        },
        "clauses": [
          {
            "rawText": "All your \"Galaxian\" family Spirits are treated as being on their highest LVs, and gain +5000 BP.",
            "cleanText": "All your \"Galaxian\" family Spirits are treated as being on their highest LVs, and gain +5000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "BP_BUFF",
              "amount": 5000,
              "target": {
                "side": "either"
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
  "SD27-006": {
    "cardNumber": "SD27-006",
    "name": "The ZodiacStarblade Zodiacsword",
    "keywords": [
      {
        "name": "Brave",
        "parameter": "\"Galaxian\" family Spirit/Cost 6 or more Ultimate",
        "wave": 3,
        "hook": "brave",
        "bracketed": true,
        "index": 0
      }
    ],
    "abilities": [
      {
        "id": "SD27-006#a0",
        "type": "CONDITION",
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
          "keyword": "Brave Condition: \"Galaxian\" family Spirit/Cost 6 or more Ultimate",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": ""
        },
        "rawText": "[Brave Condition: \"Galaxian\" family Spirit/Cost 6 or more Ultimate]",
        "clauses": [],
        "unsupported": []
      },
      {
        "id": "SD27-006#a1",
        "type": "ABILITY",
        "header": {
          "levels": [
            1
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
          "cleanBody": "Destroy a Brave on an opposing Brave Spirit."
        },
        "clauses": [
          {
            "rawText": "Destroy a Brave on an opposing Brave Spirit.",
            "cleanText": "Destroy a Brave on an opposing Brave Spirit",
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
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD27-006#a2",
        "type": "ABILITY",
        "header": {
          "levels": [
            1,
            2,
            3
          ],
          "levelExplicit": false,
          "prefixes": [
            "During Brave"
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
          "cleanBody": "By discarding an opposing Burst, put two cores from the Void to this Spirit/Ultimate."
        },
        "clauses": [
          {
            "rawText": "By discarding an opposing Burst",
            "cleanText": "By discarding an opposing Burst",
            "link": null,
            "isOptional": false,
            "isCost": true,
            "condition": null,
            "duration": null,
            "op": {
              "op": "KEYWORD_RULE"
            }
          },
          {
            "rawText": "put two cores from the Void to this Spirit/Ultimate.",
            "cleanText": "put two cores from the Void to this Spirit/Ultimate",
            "link": "byDoing",
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "MOVE_CORE",
              "count": 2,
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
      }
    ],
    "compiledClausesCount": 3,
    "unsupportedClausesCount": 0,
    "isFullySupported": true,
    "isVanilla": false
  }
};
