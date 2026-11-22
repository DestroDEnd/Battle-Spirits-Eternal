import fs from 'node:fs';
import path from 'node:path';

const arenaHtml = fs.readFileSync('arena.html', 'utf8');
const modals = arenaHtml.match(/id=["'][a-zA-Z0-9_]*Modal["']/gi) || [];
console.log('Modals in arena.html:', [...new Set(modals)]);

const arenaJs = fs.readFileSync('battle_arena.js', 'utf8');
// Check for Prompt / Interaction functions
const fnMatches = arenaJs.match(/function\s+([a-zA-Z0-9_]*(Prompt|Modal|Target|Choose|Option|Interaction)[a-zA-Z0-9_]*)/gi) || [];
console.log('Interaction functions in battle_arena.js:', [...new Set(fnMatches)]);

// Check where BSEngineAdapter is invoked
const adapterUsages = arenaJs.match(/BSEngineAdapter\.[a-zA-Z0-9_]+/g) || [];
console.log('Adapter usages in battle_arena.js:', [...new Set(adapterUsages)]);
