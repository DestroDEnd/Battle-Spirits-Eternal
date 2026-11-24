import fs from 'fs';
const dir = 'C:/Users/namis/Downloads/BSP/tests';
fs.readdirSync(dir).forEach(f => {
  if (f.startsWith('phase_m') && f.endsWith('.test.js')) {
    const c = fs.readFileSync(dir + '/' + f, 'utf8');
    const hasStepAttack = c.includes("state.step = 'ATTACK'");
    const hasDeclareAttack = c.includes('declareAttack(');
    console.log(`${f} -> declareAttack: ${hasDeclareAttack}, stepAttack: ${hasStepAttack}`);
  }
});
