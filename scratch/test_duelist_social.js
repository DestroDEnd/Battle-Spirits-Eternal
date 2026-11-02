const assert = require('assert');

// Mock browser environment
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

global.localStorage = localStorageMock;
global.window = {
  FirebaseService: {
    getFormattedDuelistId: () => '8492-0153',
    getUser: () => ({ displayName: 'TestDuelist', uid: 'test1234' }),
    updateAvatar: (a) => {},
    syncFriends: (f) => {}
  },
  location: { pathname: '/browse.html', search: '' },
  addEventListener: () => {}
};
global.document = {
  getElementById: (id) => null,
  addEventListener: () => {},
  createElement: () => ({ innerHTML: '' }),
  body: { appendChild: () => {} }
};

const app = require('../app.js');
const DuelistSocial = app.DuelistSocial;

console.log('🧪 Testing DuelistSocial...');

assert(DuelistSocial, 'DuelistSocial should be defined');
assert.strictEqual(DuelistSocial.getAvatar(), '🐉', 'Default avatar should be 🐉');

// Test setAvatar
DuelistSocial.setAvatar('🤖');
assert.strictEqual(DuelistSocial.getAvatar(), '🤖', 'Avatar should be updated to 🤖');

// Test addFriend
const friend1 = { id: '1234-5678', name: 'AlphaPlayer', avatar: '⚔️' };
const res1 = DuelistSocial.addFriend(friend1);
assert(res1.success, 'Adding valid friend should succeed');
assert.strictEqual(DuelistSocial.getFriends().length, 1, 'Friend count should be 1');

// Test duplicate add
const resDup = DuelistSocial.addFriend({ id: '12345678', name: 'Duplicate' });
assert(!resDup.success, 'Duplicate friend should be rejected');
assert.strictEqual(DuelistSocial.getFriends().length, 1, 'Friend count should still be 1');

// Test adding self
const resSelf = DuelistSocial.addFriend({ id: '84920153', name: 'Myself' });
assert(!resSelf.success, 'Adding oneself should be rejected');

// Test second friend
const res2 = DuelistSocial.addFriend({ id: '9999-8888', name: 'BetaPlayer', avatar: '🔮' });
assert(res2.success, 'Adding second friend should succeed');
assert.strictEqual(DuelistSocial.getFriends().length, 2, 'Friend count should be 2');

// Test removeFriend
DuelistSocial.removeFriend('1234-5678');
assert.strictEqual(DuelistSocial.getFriends().length, 1, 'Friend count should be 1 after removal');
assert.strictEqual(DuelistSocial.getFriends()[0].id, '9999-8888', 'Remaining friend should be BetaPlayer');

console.log('✅ All DuelistSocial tests passed!');
