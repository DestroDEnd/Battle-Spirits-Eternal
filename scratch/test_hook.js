// In test_round3.js, let's capture the appended box or trigger confirmation:
let lastAppendedBox = null;
global.document.body.appendChild = (el) => {
  lastAppendedBox = el;
};
