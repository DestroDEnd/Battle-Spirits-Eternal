/**
 * Test script verifying client-side SQL queries for wasm_db against battle_spirits.db
 */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const assert = require('assert');

const dbPath = path.join(__dirname, '..', 'battle_spirits.db');
const db = new sqlite3.Database(dbPath);

function queryAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function queryGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function runTests() {
  console.log("=== Testing Client-Side SQLite Query Logic ===");

  // 1. Total cards
  const countRow = await queryGet("SELECT count(*) as total FROM cards");
  console.log(`Total cards: ${countRow.total}`);
  assert.strictEqual(countRow.total, 14529);

  // 2. Single card lookup
  const sieg = await queryGet("SELECT * FROM cards WHERE name = ?", ["The DragonEmperor Siegfried"]);
  assert(sieg, "Siegfried should be found");
  assert.strictEqual(sieg.cost, 6);
  assert.strictEqual(sieg.color, "Red");
  console.log(`✔ Found Siegfried: Cost ${sieg.cost}, Color ${sieg.color}`);

  // 3. Batch lookup
  const names = ["The DragonEmperor Siegfried", "The Ogre Emperor Beelzebat", "The GiantHero Titus"];
  const placeholders = names.map(() => '?').join(',');
  const batch = await queryAll(`SELECT * FROM cards WHERE name IN (${placeholders})`, names);
  assert.strictEqual(batch.length, 3);
  console.log(`✔ Batch lookup succeeded: ${batch.length} cards`);

  // 4. Filter search (Red Spirits with Cost <= 3)
  const redCheapSpirits = await queryAll(
    "SELECT name, cost, color, type FROM cards WHERE color = 'Red' AND type = 'Spirit' AND cost <= 3 ORDER BY cost ASC LIMIT 10"
  );
  assert(redCheapSpirits.length > 0);
  console.log(`✔ Found ${redCheapSpirits.length} Red Cheap Spirits (sample: ${redCheapSpirits[0].name})`);

  // 5. Autocomplete search
  const autoResults = await queryAll(
    "SELECT name, cost, color, type FROM cards WHERE name LIKE ? ORDER BY name ASC LIMIT 5",
    ["Sieg%"]
  );
  assert(autoResults.length > 0);
  console.log(`✔ Autocomplete found ${autoResults.length} matches for 'Sieg%'`);

  console.log("\n🎉 ALL SQL QUERY LOGIC VERIFIED SUCCESSFULLY!");
  db.close();
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
