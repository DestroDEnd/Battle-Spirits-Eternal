const text1 = 'if you control any “The PartnerDemonLord Javad”, by sending two cores';
const text2 = '[Summon Condition: You control one or more "The PartnerDemonLord Javad", including';
const text3 = 'When your "Ancient Dragon"/"Astral Dragon"/"Ogre Wizard" family Spirit attacks';
const text4 = 'including 「The PartnerDemonLord Javad」 in soul state';

const exclude = new Set([
  'Ancient Dragon', 'Astral Dragon', 'Ogre Wizard', 'Evil God', 'DemonLord',
  'Hell Contract', 'Purple', 'Red', 'Green', 'White', 'Yellow', 'Blue',
  'Your Turn', "Opponent's Turn", 'Either Attack Step', 'Your Attack Step', "Opponent's Attack Step"
]);

function replaceRefs(safe) {
  return safe.replace(/(?:&quot;|"|[“”「」])([A-Za-z0-9\s,'\-\.]+?)(?:&quot;|"|[“”「」])/gu, (match, cardName) => {
    const trimmed = cardName.trim();
    if (exclude.has(trimmed)) return match;
    if (trimmed.startsWith('The ') || (typeof CardEffectsDB !== 'undefined' && CardEffectsDB[trimmed])) {
      const safeJs = trimmed.replace(/'/g, "\\'");
      return `"<span class="card-ref-link" onclick="event.stopPropagation(); if (typeof openCardDetail === 'function') openCardDetail('${safeJs}')" style="color:#60a5fa; text-decoration:underline; font-weight:700; cursor:pointer;" title="Click to inspect ${trimmed}">${trimmed}</span>"`;
    }
    return match;
  });
}

console.log("1:", replaceRefs(text1));
console.log("2:", replaceRefs(text2));
console.log("3:", replaceRefs(text3));
console.log("4:", replaceRefs(text4));
