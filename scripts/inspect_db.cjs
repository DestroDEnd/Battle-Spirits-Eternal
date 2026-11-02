const fs = require('fs');
let sqlite3;
try {
  sqlite3 = require('sqlite3').verbose();
} catch (e) {
  console.log('sqlite3 module not found in node_modules, checking alternative');
}

if (sqlite3) {
  const db = new sqlite3.Database('battle_spirits.db');
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    console.log('Tables:', tables);
    db.all("PRAGMA table_info(cards)", (err, cols) => {
      console.log('Columns in cards:', cols ? cols.map(c => c.name) : err);
      db.get("SELECT COUNT(*) AS count FROM cards", (err, row) => {
        console.log('Total cards in battle_spirits.db:', row ? row.count : err);
        db.get("SELECT * FROM cards LIMIT 1", (err, sample) => {
          if (sample) {
            console.log('Sample card keys:', Object.keys(sample));
            console.log('Sample card:', sample.name, sample.card_number, sample.type, sample.color, sample.cost, sample.symbol, sample.reduction);
          }
        });
      });
    });
  });
}
