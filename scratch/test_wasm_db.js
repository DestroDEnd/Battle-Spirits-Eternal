const fs = require('fs');
const initSqlJs = require('sql.js');

async function testWasmSearch() {
  const SQL = await initSqlJs();
  const filebuffer = fs.readFileSync('battle_spirits.db');
  const db = new SQL.Database(filebuffer);

  // Test 1: Check Javad count
  const stmt1 = db.prepare("SELECT COUNT(*) as cnt FROM cards WHERE name = 'The PartnerDemonLord Javad'");
  if (stmt1.step()) {
    console.log("Javad count in db:", stmt1.getAsObject().cnt);
  }
  stmt1.free();

  // Test 2: Search for 'javad'
  const stmt2 = db.prepare("SELECT name, card_number, family FROM cards WHERE name LIKE '%javad%'");
  console.log("\nSearch for 'javad':");
  while (stmt2.step()) {
    console.log(stmt2.getAsObject());
  }
  stmt2.free();

  // Test 3: Search family 'Hell Contract'
  const stmt3 = db.prepare("SELECT name, card_number, family FROM cards WHERE families_json LIKE '%Hell Contract%'");
  console.log("\nCards with family 'Hell Contract':");
  while (stmt3.step()) {
    console.log(stmt3.getAsObject());
  }
  stmt3.free();

  // Test 4: Search set 'SD65'
  const stmt4 = db.prepare("SELECT name, card_number FROM cards WHERE sets_json LIKE '%SD65%'");
  console.log("\nCards in SD65:");
  while (stmt4.step()) {
    console.log(stmt4.getAsObject());
  }
  stmt4.free();
}

testWasmSearch().catch(err => console.error(err));
