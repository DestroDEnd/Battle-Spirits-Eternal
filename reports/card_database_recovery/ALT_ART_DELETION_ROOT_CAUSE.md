# Battle Spirits Eternal — Alt-Art Deletion Root Cause Forensic Analysis
**Evaluation Date:** 2026-11-24  
**Incident Commit:** `352b91962268e9765affea86d1ef13972efb3ec3`  
**Script Responsible:** `scripts/clean_and_optimize_db.js`  
**Commit Message:** `fix: filter concept art, remove cards without artwork, optimize database, and fix card art fallback`

---

## 1. Exact Mechanism of Data Loss

The deletion of canonical cards occurred during an attempt to clean up "cards without artwork" and "concept art" across the database.

The script `scripts/clean_and_optimize_db.js` executed the following flawed logic:

```javascript
// Step 1: Flawed SQL Selection
const cardsToDelete = db.prepare(`
  SELECT card_number, name FROM cards
  WHERE image_url IS NULL OR TRIM(image_url) = '' OR image_url LIKE '%fallback%' OR image_url LIKE '%pending%'
`).all();

const deletedNumbers = new Set(cardsToDelete.map(c => c.card_number));
const deletedNames = new Set(cardsToDelete.map(c => (c.name || '').toLowerCase().trim()));

// Step 2: Unconditional SQL Delete on cards table
const deleteStmt = db.prepare(`
  DELETE FROM cards
  WHERE image_url IS NULL OR TRIM(image_url) = '' OR image_url LIKE '%fallback%' OR image_url LIKE '%pending%'
`);
deleteStmt.run();

// Step 3: Cascaded deletion by Card Name across JSON databases
for (const [key, card] of Object.entries(detailedData)) {
  const num = card.card_number || key;
  const name = (card.name || '').toLowerCase().trim();
  const noArt = !card.image_url || !String(card.image_url).trim();
  if (deletedNumbers.has(num) || deletedNames.has(name) || noArt) {
    delete detailedData[key];
  }
}
```

---

## 2. Four Compounding Vulnerabilities That Caused The Catastrophe

### Vulnerability 1: Failure to Distinguish Alternate-Art Printing from Canonical Card Identity
The script assumed that any card entry without an explicit `image_url` string in table `cards` was an invalid card that should be permanently deleted. In Battle Spirits, canonical cards exist as game rules entities. A card is not invalid simply because its web image is pending or stored in a separate column.

### Vulnerability 2: Column Confusion Between `image_url` and `image_filename`
In SQLite table `cards`, many cards (including Ubataman, Ultimate-Saviour, and BS-77) had:
- `image_filename = 'BS30-015_official.png'`
- `image_filename = 'BS27_X_X03.png'`
- `image_filename = 'BS77-001.png'`
However, their `image_url` column was `NULL` because the legacy scraper stored the relative filename in `image_filename`.
The SQL query checked ONLY `image_url IS NULL`, completely ignoring `image_filename`!
Meanwhile, in table `cards_v2` and `pre_deletion_cards_detailed.json`, these cards had full, valid URLs (e.g. `https://static.wikia.nocookie.net/battle-spirits/images/BS30-015_official.png`).

### Vulnerability 3: Ambiguous Deletion by Card Name (`deletedNames`)
The script collected `deletedNames` and deleted ANY card in JSON files matching those names:
`if (deletedNumbers.has(num) || deletedNames.has(name) || noArt)`
This violated database normalization principles: cards must ALWAYS be keyed by immutable unique card identifiers (`card_number`), NEVER by ambiguous name strings. Deleting by name risked wiping out legitimate alternate printings and distinct cards sharing similar names.

### Vulnerability 4: Lack of Pre-Deletion Safety Assertions and Dry-Run Verification
The script executed directly against production database files without:
- Dry-run impact report.
- Minimum cardinality invariant check (e.g. `assert(totalCards >= 14600)`).
- Protection for recognized canonical sets (e.g. BS01 through BS77).
- Transactional rollback mechanism.

---

## 3. Impact Assessment

- **Total Canonical Records Deleted:** 188 cards
- **Affected Sets:** 54 distinct set codes, including the entirety of BS-77 (46 cards).
- **Flagship Aces Affected:**
  - `BS30-015` Ubataman (Key competitive Shellman spirit)
  - `BS27-X03` The HolyDragonEmperor Ultimate-Saviour (Key X-Rare)
  - `LM14-06` Ultimate-Saviour-Baby
- **Website Impact:**
  - Search queries for "Ubataman", "Ultimate-Saviour", and BS-77 returned 0 results.
  - Battle simulator and Deck Builder failed to load these cards.
  - Set filter for BS-77 displayed empty grid.

---

## 4. Corrective Architecture & Mandatory Safeguards

1. **Card Identity Preservation Principle:** An alternate-art cleanup operation is STRICTLY restricted to `data/card_artworks.json`. It must NEVER execute `DELETE FROM cards` or remove keys from `cards_detailed.json` or `cards_index.json`.
2. **Cardinality Floor Assertion:** Any future database optimization script must enforce:
   `if (newCount < 14631) throw new Error("Cardinality invariant violation!");`
3. **Primary Key Exclusivity:** Record matching must strictly use canonical `card_number`, never raw name matching.
4. **Zero Silent Discards:** All modifications must produce a dry-run manifest before committing.
