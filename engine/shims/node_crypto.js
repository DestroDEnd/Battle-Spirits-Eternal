
export function createHash() {
  let str = '';
  return {
    update(data) { str += String(data); return this; },
    digest(enc) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash).toString(16).padStart(64, '0');
    }
  };
}
export default { createHash };
