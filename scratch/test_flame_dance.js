const fs = require('fs');
const initSqlJs = require('sql.js');

async function testFlameDance() {
  const SQL = await initSqlJs();
  const filebuffer = fs.readFileSync('battle_spirits.db');
  const db = new SQL.Database(filebuffer);

  const stmt = db.prepare("SELECT * FROM cards WHERE LOWER(name) = LOWER(?) LIMIT 1");
  stmt.bind(['Flame Dance']);
  if (stmt.step()) {
    const card = stmt.getAsObject();
    console.log("Found card:", card);
  } else {
    console.log("Card not found!");
  }
  stmt.free();
}

testFlameDance().catch(console.error);
