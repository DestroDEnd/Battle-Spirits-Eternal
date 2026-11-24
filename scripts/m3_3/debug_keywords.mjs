import { createGame } from '../../engine/index.js';
import { createFieldStack, createCardInstance } from '../../engine/state.js';

async function testWindstorm() {
  const windSpirit = {
    name: 'Storm Hawk',
    type: 'Spirit',
    effect: '[Windstorm: 1]'
  };

  const game = createGame();
  const p = game.state.players.player;
  const opp = game.state.players.opponent;

  const attackerStack = createFieldStack(createCardInstance(windSpirit, 'player'), { normal: 1, soul: 0 });
  p.field.push(attackerStack);

  const blockerStack = createFieldStack(createCardInstance({ name: 'Blocker' }, 'opponent'), { normal: 1, soul: 0 });
  const otherStack = createFieldStack(createCardInstance({ name: 'Bench' }, 'opponent'), { normal: 1, soul: 0 });
  opp.field.push(blockerStack);
  opp.field.push(otherStack);

  const atkRes = await game.declareAttack(attackerStack.id, 'player');
  console.log('declareAttack res:', atkRes);
  const blkRes = await game.declareBlock(blockerStack.id, 'opponent');
  console.log('declareBlock res:', blkRes);
  console.log('window active:', game.windows.isResponseWindowActive(), game.windows.getCurrentWindow()?.windowType);
}

testWindstorm().catch(console.error);
