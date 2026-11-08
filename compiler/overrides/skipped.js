/**
 * compiler/overrides/skipped.js
 * 
 * Formally cataloged skipped cards set aside per Requirement R2.
 */

export const SKIPPED_CARDS = [
  {
    "cardNumber": "SD01-029",
    "name": "The Wriggle Catacomb",
    "type": "Nexus",
    "set": "SD01",
    "reason": "Provenance tracking for core additions during opposing turn and re-entrant depletion cascading destructions during effect resolution."
  },
  {
    "cardNumber": "SD01-031",
    "name": "The Cape in the Red Sky",
    "type": "Nexus",
    "set": "SD01",
    "reason": "Provenance tracking for hand additions during opposing turn and global trigger suppression ((When Summoned)/(When Destroyed)) timing contention."
  },
  {
    "cardNumber": "SD01-032",
    "name": "The Protection of Sacred Artifacts",
    "type": "Nexus",
    "set": "SD01",
    "reason": "Forced attack legacy ambiguity regarding step declaration and target prioritization without compulsory attack step entry."
  },
  {
    "cardNumber": "BATTLE-SPIRITS-A404",
    "name": "Armor Purge",
    "type": "Magic",
    "set": "SD01 (Synthetic)",
    "reason": "Synthetic non-canonical ID with malformed phase terminology (\"Your Main Phrase\") and undefined wildcard keyword (\"Immunity: X\")."
  },
  {
    "cardNumber": "BS01-006",
    "name": "Merat",
    "type": "Spirit",
    "set": "BS01",
    "reason": "Manual vs. effect causality distinction on core placement not supported in standard rules engine."
  },
  {
    "cardNumber": "BS01-027",
    "name": "Will-Orb",
    "type": "Spirit",
    "set": "BS01",
    "reason": "Forced attack declaration priority and Attack Step compulsion ambiguity."
  },
  {
    "cardNumber": "BS01-033",
    "name": "Disaster",
    "type": "Spirit",
    "set": "BS01",
    "reason": "Forced attack declaration priority and Attack Step compulsion ambiguity."
  },
  {
    "cardNumber": "BS01-057",
    "name": "Gularva",
    "type": "Spirit",
    "set": "BS01",
    "reason": "Undefined source zone for \"+1 core\" replacement effect and precedence ambiguity."
  },
  {
    "cardNumber": "BS01-059",
    "name": "Shidafukurou",
    "type": "Spirit",
    "set": "BS01",
    "reason": "Ambiguous pre-event timing hook (\"would draw\") and batch draw refresh multiplier ambiguity."
  },
  {
    "cardNumber": "BS01-096",
    "name": "The AutoEmpress Sol",
    "type": "Spirit",
    "set": "BS01",
    "reason": "Legacy translation artifact with ambiguous branching (\"skip the Attack Step. Or end it\")."
  },
  {
    "cardNumber": "BS01-100",
    "name": "The Ruby Sun",
    "type": "Nexus",
    "set": "BS01",
    "reason": "Global provenance tracking of manual vs effect core movements across all White spirits."
  },
  {
    "cardNumber": "BS01-105",
    "name": "The Shackles of Doom",
    "type": "Nexus",
    "set": "BS01",
    "reason": "Non-standard timing (\"After attack declaration\") and immediate self-depletion dispute."
  },
  {
    "cardNumber": "BS02-078",
    "name": "The Evil Coffin",
    "type": "Nexus",
    "set": "BS02",
    "reason": "Opposing Main Step manual vs effect core movement causality distinction (\"Unless via Spirit/Nexus/Magic effects\") not supported in standard rules engine."
  },
  {
    "cardNumber": "BS02-087",
    "name": "The Sealed Spellbook",
    "type": "Nexus",
    "set": "BS02",
    "reason": "Dynamic meta-redirection of Magic effects targeting both players (\"either only you, or only the opponent\") without player interaction protocol."
  },
  {
    "cardNumber": "BS02-108",
    "name": "Magic Book",
    "type": "Magic",
    "set": "BS02",
    "reason": "Non-standard legacy \"Removed Zone\" destination without standardized exclusion timing and retrieval semantics."
  },
  {
    "cardNumber": "BS02-109",
    "name": "Angel Voice",
    "type": "Magic",
    "set": "BS02",
    "reason": "Battle resolution modification replacing standard BP comparison with Level comparison."
  },
  {
    "cardNumber": "BS03-016",
    "name": "The InvisibleMan Eclear",
    "type": "Spirit",
    "set": "BS03",
    "reason": "Non-standard legacy \"Removed Zone\" dependency without standardized modern exclusion tracking semantics."
  },
  {
    "cardNumber": "BS06-054",
    "name": "The FortuneTeller Pentan",
    "type": "Spirit",
    "set": "BS06",
    "reason": "Non-standard legacy \"Removed Zone\" dependency without standardized modern exclusion tracking semantics."
  },
  {
    "cardNumber": "BS06-086",
    "name": "The Opened Spellbook",
    "type": "Nexus",
    "set": "BS06",
    "reason": "Dynamic meta-redirection of Magic effects targeting both players to either player without interaction protocol."
  },
  {
    "cardNumber": "BS06-110",
    "name": "Imagine Field",
    "type": "Magic",
    "set": "BS06",
    "reason": "Battle resolution modification replacing standard BP comparison with spirit core comparison."
  },
  {
    "cardNumber": "BS09-X39",
    "name": "The MagicalEmpress Ambrocius",
    "type": "Spirit",
    "set": "BS09",
    "reason": "Non-standard legacy \"Removed Zone\" dependency without standardized modern exclusion tracking and cast-from-removed semantics."
  },
  {
    "cardNumber": "BS11-X05",
    "name": "The MagicalTwinsDeity Geminize",
    "type": "Spirit",
    "set": "BS11",
    "reason": "Non-standard legacy \"Removed Zone\" dependency without standardized modern exclusion tracking and cast-from-removed semantics."
  },
  {
    "cardNumber": "BS12-011",
    "name": "Mummybird",
    "type": "Spirit",
    "set": "BS12",
    "reason": "Non-standard legacy \"Removed Zone\" dependency without standardized modern exclusion tracking and discard-from-removed semantics."
  },
  {
    "cardNumber": "SD27-001",
    "name": "Pixislizard",
    "type": "Spirit",
    "set": "SD27",
    "reason": "Non-standard legacy \"Removed Zone\" dependency affecting cost of Galaxian family cards in Removed Zone without standardized modern exclusion tracking."
  },
  {
    "cardNumber": "SD27-002",
    "name": "Wyvern-Vela",
    "type": "Spirit",
    "set": "SD27",
    "reason": "Non-standard legacy \"Removed Zone\" dependency putting cards from Hand to Removed Zone to draw cards without standardized modern exclusion tracking."
  }
];
