export const SD30_OVERRIDES = {
  "SD30-001": {
    "cardNumber": "SD30-001",
    "name": "The SteelBladeDragon Calyvorous",
    "keywords": [],
    "abilities": [
      {
        "id": "SD30-001#a0",
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
          "cleanBody": "Destroy an opposing Nexus. If this Spirit has [Soul Core] (Soul Core) on it, also, draw a card."
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
            "rawText": "If this Spirit has [Soul Core] (Soul Core) on it, also, draw a card.",
            "cleanText": "also, draw a card",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "If this Spirit has [Soul Core] (Soul Core) on it",
            "duration": null,
            "op": {
              "op": "DRAW",
              "count": 1,
              "chooser": "self",
              "forEach": null
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
  "SD30-002": {
    "cardNumber": "SD30-002",
    "name": "The TwinHornDragon Doubhorn",
    "keywords": [
      {
        "name": "True-Clash",
        "parameter": null,
        "wave": 1,
        "hook": "clash",
        "bracketed": true,
        "index": 99
      }
    ],
    "abilities": [
      {
        "id": "SD30-002#a0",
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
          "cleanBody": "While this Spirit has [Soul Core] (Soul Core) on it, this Spirit gains +5000 BP."
        },
        "clauses": [
          {
            "rawText": "While this Spirit has [Soul Core] (Soul Core) on it, this Spirit gains +5000 BP.",
            "cleanText": "this Spirit gains +5000 BP",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": "While this Spirit has [Soul Core] (Soul Core) on it",
            "duration": null,
            "op": {
              "op": "BP_BUFF",
              "amount": 5000,
              "target": "self",
              "duration": "THIS_TURN"
            }
          }
        ],
        "unsupported": []
      },
      {
        "id": "SD30-002#a1",
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
          "keyword": "True-Clash",
          "burstCondition": null,
          "isFlash": false,
          "isMain": false,
          "cleanBody": "The opponent must block with their Spirits/Ultimates if possible."
        },
        "clauses": [
          {
            "rawText": "The opponent must block with their Spirits/Ultimates if possible.",
            "cleanText": "The opponent must block with their Spirits/Ultimates if possible",
            "link": null,
            "isOptional": false,
            "isCost": false,
            "condition": null,
            "duration": null,
            "op": {
              "op": "COMBAT_RULE"
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
  }
};
