// Letters, letter sounds and picture words for the Reading Island games.
window.KW = window.KW || {};

(function () {
  // How the voice should say each letter's NAME (a lone "A" is often read as "uh").
  const NAMES = {
    a: 'ay', b: 'bee', c: 'see', d: 'dee', e: 'ee', f: 'eff', g: 'jee', h: 'aitch', i: 'eye',
    j: 'jay', k: 'kay', l: 'ell', m: 'em', n: 'en', o: 'oh', p: 'pee', q: 'cue', r: 'ar',
    s: 'ess', t: 'tee', u: 'you', v: 'vee', w: 'double you', x: 'ex', y: 'why', z: 'zee'
  };

  // Rough spellings of each letter's SOUND for the voice. Speech engines can't
  // say pure phonemes, so these are close approximations ("buh", "mmm").
  const SOUNDS = {
    a: 'ah', b: 'buh', c: 'kuh', d: 'duh', e: 'eh', f: 'fff', g: 'guh', h: 'huh', i: 'ih',
    j: 'juh', k: 'kuh', l: 'lll', m: 'mmm', n: 'nnn', o: 'aw', p: 'puh', q: 'kwuh', r: 'rrr',
    s: 'sss', t: 'tuh', u: 'uh', v: 'vvv', w: 'wuh', x: 'ks', y: 'yuh', z: 'zzz'
  };

  // Picture words for "starts with" games. Letters without a clear picture
  // (i, q, x) are left out.
  const STARTS = [
    ['apple', '🍎'], ['ball', '⚽'], ['bee', '🐝'], ['cat', '🐱'], ['cake', '🎂'], ['dog', '🐶'],
    ['duck', '🦆'], ['egg', '🥚'], ['fish', '🐟'], ['frog', '🐸'], ['goat', '🐐'], ['grapes', '🍇'],
    ['hat', '🎩'], ['horse', '🐴'], ['juice', '🧃'], ['kite', '🪁'], ['key', '🔑'], ['lion', '🦁'],
    ['leaf', '🍃'], ['moon', '🌙'], ['monkey', '🐒'], ['nose', '👃'], ['octopus', '🐙'], ['pig', '🐷'],
    ['pizza', '🍕'], ['rabbit', '🐰'], ['rainbow', '🌈'], ['sun', '☀️'], ['snake', '🐍'], ['tiger', '🐯'],
    ['tree', '🌳'], ['umbrella', '☂️'], ['van', '🚐'], ['violin', '🎻'], ['whale', '🐳'],
    ['watermelon', '🍉'], ['yo-yo', '🪀'], ['zebra', '🦓']
  ].map(([word, emoji]) => ({ word, emoji, first: word[0] }));

  // Three-letter words (consonant, short vowel, consonant) with a picture.
  const CVC = [
    ['cat', '🐱'], ['dog', '🐶'], ['pig', '🐷'], ['sun', '☀️'], ['bus', '🚌'], ['hat', '🎩'],
    ['bed', '🛏️'], ['box', '📦'], ['fox', '🦊'], ['hen', '🐔'], ['map', '🗺️'], ['net', '🥅'],
    ['pen', '🖊️'], ['pin', '📌'], ['rat', '🐀'], ['van', '🚐'], ['web', '🕸️'], ['bat', '🦇'],
    ['bag', '👜'], ['bug', '🐛'], ['nut', '🥜'], ['ten', '🔟'], ['leg', '🦵'], ['lip', '👄'],
    ['kid', '🧒'], ['cap', '🧢'], ['can', '🥫'], ['pan', '🍳'], ['tub', '🛁'], ['hug', '🤗'],
    ['jet', '✈️'], ['log', '🪵'], ['six', '6️⃣']
  ].map(([word, emoji]) => ({ word, emoji }));

  // Rhyme families: every word in a family rhymes with the others.
  const RHYMES = [
    [['cat', '🐱'], ['hat', '🎩'], ['bat', '🦇'], ['rat', '🐀']],
    [['dog', '🐶'], ['frog', '🐸'], ['log', '🪵']],
    [['bee', '🐝'], ['tree', '🌳'], ['key', '🔑'], ['three', '3️⃣']],
    [['moon', '🌙'], ['spoon', '🥄'], ['balloon', '🎈']],
    [['hen', '🐔'], ['pen', '🖊️'], ['ten', '🔟']],
    [['clock', '⏰'], ['sock', '🧦'], ['rock', '🪨']],
    [['bear', '🐻'], ['pear', '🍐'], ['chair', '🪑']],
    [['kite', '🪁'], ['night', '🌃'], ['light', '💡']],
    [['bed', '🛏️'], ['sled', '🛷'], ['red', '🟥']],
    [['bug', '🐛'], ['hug', '🤗']],
    [['box', '📦'], ['fox', '🦊']],
    [['cake', '🎂'], ['snake', '🐍']],
    [['house', '🏠'], ['mouse', '🐭']],
    [['train', '🚂'], ['rain', '🌧️']],
    [['fish', '🐟'], ['dish', '🍽️']],
    [['ring', '💍'], ['king', '🤴']],
    [['snail', '🐌'], ['mail', '📬']],
    [['ship', '🚢'], ['lip', '👄']]
  ].map((fam, f) => fam.map(([word, emoji]) => ({ word, emoji, fam: f })));

  // Little rhymes with the last word missing ("The cat put on a ... hat!").
  const COUPLETS = [
    ['The cat put on a', 'hat'], ['The frog sat on a', 'log'], ['A bug gave me a big', 'hug'],
    ['A bee sat in a', 'tree'], ['The fox hid in a', 'box'], ['The mouse ran in the', 'house'],
    ['The bear ate a', 'pear'], ['I fly my kite at', 'night'], ['The snake ate some', 'cake'],
    ['I saw a balloon fly to the', 'moon'], ['The fish sat on a', 'dish'], ['I put my sock on a', 'rock'],
    ['The train went out in the', 'rain'], ['My teddy is red, he sleeps in my', 'bed'],
    ['A snail got some', 'mail'], ['The king has a gold', 'ring'], ['The hen has a', 'pen']
  ].map(([text, word]) => ({ text, word }));

  const ABC = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const VOWELS = ['a', 'e', 'i', 'o', 'u'];

  KW.reading = {
    ABC, VOWELS, STARTS, CVC, RHYMES, COUPLETS,
    rhymeWord: word => RHYMES.flat().find(r => r.word === word),
    name: l => NAMES[l.toLowerCase()],
    sound: l => SOUNDS[l.toLowerCase()],
    // "c... a... t... cat!"
    soundOut: word => word.split('').map(l => SOUNDS[l]).join('... ') + '... ' + word + '!'
  };
})();
