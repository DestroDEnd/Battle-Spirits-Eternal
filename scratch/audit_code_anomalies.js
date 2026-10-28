const fs = require('fs');

function checkFile(filename) {
  console.log(`\n=== Scanning ${filename} for anomalies ===`);
  const code = fs.readFileSync(filename, 'utf8');
  const lines = code.split('\n');

  // 1. Check for function name collisions at top level
  const fnRegex = /(?:function\s+([a-zA-Z0-9_$]+)\s*\(|const\s+([a-zA-Z0-9_$]+)\s*=\s*(?:function|\([^)]*\)\s*=>))/g;
  let match;
  const declared = new Map();
  const duplicates = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Simple top-level / function declaration check
    const m = line.match(/^\s*(?:async\s+)?function\s+([a-zA-Z0-9_$]+)\s*\(/);
    if (m) {
      const fnName = m[1];
      if (declared.has(fnName)) {
        duplicates.push({ name: fnName, firstLine: declared.get(fnName), secondLine: i + 1 });
      } else {
        declared.set(fnName, i + 1);
      }
    }
  }

  console.log(`Top-level functions declared: ${declared.size}`);
  if (duplicates.length) {
    console.log(`[WARNING] Duplicate function declarations found:`);
    duplicates.forEach(d => console.log(`  - ${d.name} declared on line ${d.firstLine} and line ${d.secondLine}`));
  } else {
    console.log(`  No duplicate function declarations found.`);
  }

  // 2. Check for suspicious comma operator chains (like our previous bug)
  // e.g. ident, ident, ... inside ${ ... } or expressions
  const suspiciousComma = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/\$\{([a-zA-Z0-9_$]+,\s*)+[a-zA-Z0-9_$]+/.test(line)) {
      suspiciousComma.push({ lineNum: i + 1, text: line.trim() });
    }
  }

  if (suspiciousComma.length) {
    console.log(`[SUSPICIOUS] Comma operator inside template literal:`);
    suspiciousComma.forEach(s => console.log(`  Line ${s.lineNum}: ${s.text}`));
  } else {
    console.log(`  No suspicious comma operators in template literals.`);
  }

  // 3. Check for assignment inside conditionals: e.g., if (x = y) where not intentional
  const suspiciousAssignments = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Exclude ==, ===, <=, >=, !=, !==
    if (/if\s*\([^=!<>\n]+=[^=!<>\n]+\)/.test(line)) {
      suspiciousAssignments.push({ lineNum: i + 1, text: line.trim() });
    }
  }
  if (suspiciousAssignments.length) {
    console.log(`[SUSPICIOUS ASSIGNMENT IN IF]:`);
    suspiciousAssignments.forEach(s => console.log(`  Line ${s.lineNum}: ${s.text}`));
  } else {
    console.log(`  No suspicious assignments in conditionals.`);
  }
}

checkFile('app.js');
checkFile('battle_arena.js');
