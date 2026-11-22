# Phase 4C.3.1.5 — Semantic Ability Identity & Same-Name Matching Specification

## 1. Executive Summary & Purpose

While **Physical Ability Identity** uniquely distinguishes individual abilities printed on a specific card instance, **Semantic Ability Identity** solves cross-card effect matching.
Specifically, `[Once per turn: Same Name]` and `[Once per game: Same Name]` restrict all physical copies sharing the canonical card name across alternate printings, promo reprints, and errata versions.

---

## 2. Descriptor Fields: Essential vs Excluded

| Field Name | Category | Included in Semantic Identity? | Justification |
|---|---|---|---|
| `canonicalCardName` | Identity Scope | **YES** (Normalized) | Governs the Same-Name pool boundary. Lowercase, punctuation-stripped. |
| `timing` | Core Semantic | **YES** | Flash vs Main vs Passive defines effect trigger domain. |
| `trigger` | Core Semantic | **YES** | e.g. `ON_ATTACK`, `WHEN_DESTROYED`, `LIFE_REDUCED`. |
| `levels` | Core Semantic | **YES** | e.g. `[1, 2]` vs `[2, 3]` alters activation threshold. |
| `conditions` | Core Semantic | **YES** | Prerequisite game states (e.g. counters, braved attributes). |
| `costs` | Core Semantic | **YES** | Required core/card payment before execution. |
| `targetFilters` | Core Semantic | **YES** | Target restrictions (cost, BP, color, family, zone). |
| `operations` | Core Semantic | **YES** | Ordered sequence of op types and parameters. |
| `restrictionScope` | Limit Semantic | **YES** | Scope of limit (`SAME_NAME`, `CARD_INSTANCE`, `PLAYER`). |
| `cardNumber` | Card-Printing Specific | **NO (EXCLUDED)** | Differing card numbers (e.g. `BS01-002` vs `SD01-002`) must share semantic identity. |
| `rarity` / `setCode` | Card-Printing Specific | **NO (EXCLUDED)** | Promotional or rarity variants do not alter game rules. |
| `artworkId` / `flavorText` | Cosmetic | **NO (EXCLUDED)** | Purely visual and narrative metadata. |
| `physicalCardId` | Runtime Instance | **NO (EXCLUDED)** | Engine instance ID (`inst_42`) is physical, not semantic. |
| `placementId` | Runtime Placement | **NO (EXCLUDED)** | Field placement ID is transient. |

---

## 3. Reprints, Errata, and Wording Divergence

### 3.1. Official Errata & Standard Bandai Tournament Policy
Under Bandai Official Floor Rules:
> When a card receives an official errata, all previous printings of that card are treated as bearing the official updated text.

- In Battle Spirits Eternal, canonical cards in `data/cards_detailed.json` are maintained with authoritative errata-applied text.
- If two cards have identical canonical names, their normalized semantic descriptor matches 100%.

### 3.2. Granted Ability Identity Isolation
When an ability is granted to a Spirit (e.g. by a Brave or a Nexus):
- **Formula**: `GRANT:${grantorPlacementId}:${semanticAbilityId}`
- A granted once-per-turn limit is tied to the granting instance. If the Brave detaches or is destroyed, the Spirit does not permanently absorb the restriction as its own native ability.

---

## 4. Verified Same-Name Matching Examples & Counterexamples

| Card A | Card B | Shared Name? | Expected Semantic ID Match? | Architectural Rationale |
|---|---|---|---|---|
| `BS01-002` (The Lizardman) | `SD01-002` (The Lizardman - Reprint) | YES | **MATCH (Identical Pool)** | Identical canonical name, timing, trigger, and clauses. Reprints share `[Once per turn: Same Name]`. |
| `BS52-X01` (Siegwurm-Nova) | `BS52-X01` (Copy 2 on Field) | YES | **MATCH (Identical Pool)** | Two physical copies of the same card share Same-Name restriction pool. |
| `BS52-X01` (Player 1) | `BS52-X01` (Player 2) | YES | **INDEPENDENT (Partitioned)** | Partitioned by `playerSide: 'p1'` vs `'p2'`. Player 2 retains independent limit. |
| `BS25-063#a2` (Cost 1/2/3/4 Destroy) | `BS25-063#a3` (Cost 5/6/7 Destroy) | YES (Same Card) | **DISTINCT (No Collision)** | Different conditions and target cost filters ensure distinct semantic IDs. |
| `BS01-002` (Ability 1) | `BS01-002` (Ability 2) | YES (Same Card) | **DISTINCT (No Collision)** | Distinct timings and clause operations prevent accidental sharing. |
| `BS64-CX02` (Turn 1 Burst) | `BS64-CX02` (Turn 3 Field Copy) | YES | **MATCH (Game-wide Pool)** | Same Name OPG binds across all copies for the entire duel. |
