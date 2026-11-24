import { createGame } from '../../engine/index.js';
import { createFieldStack, createCardInstance } from '../../engine/state.js';

async function testE2ELogic() {
  const game = createGame();
  const { state } = game;
  state.activePlayer = 'player';
  state.step = 'ATTACK';

  const atkStack = createFieldStack(createCardInstance({ name: 'Siekwurm Nova', bp: 6000, type: 'Spirit' }, 'player'), { normal: 1, soul: 0 });
  state.players.player.field.push(atkStack);

  const res = await game.declareAttack(atkStack.id, 'player');
  console.log('attack res:', res);
  console.log('window:', game.windows.getCurrentWindow());
}

testE2ELogic().catch(console.error);
