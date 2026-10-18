// Word Builder: build three-letter words (cat, dog, sun) from letter tiles.
// Levels go from one missing letter to spelling the whole word, and every
// finished word is "sounded out": c... a... t... cat!
(function () {
  'use strict';

  const R = KW.reading;
  const { shuffle } = KW.util;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const CONSONANTS = R.ABC.filter(l => !R.VOWELS.includes(l) && !'qxy'.includes(l));
  const wait = KW.ui.wait;

  const $ = id => document.getElementById(id);
  const els = {
    levels: $('levels'), show: $('show'), bubble: $('bubble'), slots: $('slots'), tiles: $('tiles'),
    next: $('nextBtn'), repeat: $('repeatBtn'), soundOut: $('soundOutBtn'),
    overlay: $('startOverlay'), play: $('playBtn')
  };

  let picker = null;
  let problem = null;
  let state = null;   // { slots: [{letter, fixed, tile}], tiles: [{letter, used}], phase, mistakes }
  let busy = false;
  let token = 0;
  let started = false;
  let lastWord = '';

  // ---------- Problems ----------
  // missing: which letter positions he fills in; tiles: letters to choose from.
  function generate(lv) {
    let w;
    do { w = pick(R.CVC); } while (w.word === lastWord);
    lastWord = w.word;
    const L = w.word.split('');
    const others = (pool, not, n) => shuffle(pool.filter(l => !not.includes(l))).slice(0, n);
    switch (lv) {
      case 1: return { ...w, missing: [0], tiles: shuffle([L[0], ...others(CONSONANTS, L, 2)]), text: 'What is the first sound?' };
      case 2: return { ...w, missing: [2], tiles: shuffle([L[2], ...others(CONSONANTS, L, 2)]), text: 'What is the last sound?' };
      case 3: return { ...w, missing: [1], tiles: shuffle([L[1], ...others(R.VOWELS, L, 2)]), text: 'What is the middle sound?' };
      case 4: {
        let t;
        do { t = shuffle(L.slice()); } while (t.join('') === w.word);
        return { ...w, missing: [0, 1, 2], tiles: t, text: 'Put the letters in order' };
      }
      default:
        return { ...w, missing: [0, 1, 2],
          tiles: shuffle([...L, ...others(CONSONANTS, L, 1), ...others(R.VOWELS, L, 1)]), text: 'Spell the word' };
    }
  }

  // ---------- Rendering ----------
  function render() {
    const nextEmpty = state.slots.findIndex(s => !s.letter);
    els.slots.innerHTML = state.slots.map((s, i) => {
      const cls = s.fixed ? 'fixed' : s.letter ? 'filled' : (i === nextEmpty ? 'next-up' : '');
      return `<button class="slot ${cls}" data-slot="${i}" aria-label="${s.letter ? R.name(s.letter) : 'empty'}">${s.letter || ''}</button>`;
    }).join('');
    els.tiles.innerHTML = state.tiles.map((t, i) =>
      `<button class="tile${t.used ? ' used' : ''}" data-tile="${i}" aria-label="${R.name(t.letter)}">${t.letter}</button>`).join('');
  }

  function say(text, opts) {
    return started ? KW.speech.say(text, opts) : Promise.resolve();
  }

  // Light each slot while saying its sound, then say the whole word.
  async function soundOut(letters, my) {
    for (let i = 0; i < letters.length; i++) {
      const slot = els.slots.children[i];
      if (slot) slot.classList.add('lit');
      await say(R.sound(letters[i]), { rate: 0.8 });
      if (slot) slot.classList.remove('lit');
      if (my !== token) return;
    }
  }

  // ---------- Flow ----------
  function newProblem() {
    token++;
    busy = false;
    KW.speech.stop();
    problem = generate(picker.level);
    state = {
      slots: problem.word.split('').map((l, i) => problem.missing.includes(i) ? { letter: '' } : { letter: l, fixed: true }),
      tiles: problem.tiles.map(letter => ({ letter, used: false })),
      phase: 'build',
      mistakes: 0
    };
    els.show.textContent = problem.emoji;
    els.show.classList.remove('bounce');
    void els.show.offsetWidth;
    els.show.classList.add('bounce');
    els.bubble.textContent = problem.text;
    els.next.hidden = true;
    render();
    say(`${problem.word}. ${problem.text}.`);
  }

  function placeTile(i) {
    if (busy || state.phase !== 'build') return;
    const tile = state.tiles[i];
    const slot = state.slots.find(s => !s.letter);
    if (tile.used || !slot) return;
    tile.used = true;
    slot.letter = tile.letter;
    slot.tile = i;
    KW.sound.pop();
    say(R.sound(tile.letter), { rate: 0.9 });
    render();
    if (state.slots.every(s => s.letter)) check();
  }

  function takeBack(i) {
    if (busy || state.phase !== 'build') return;
    const slot = state.slots[i];
    if (slot.fixed || !slot.letter) return;
    state.tiles[slot.tile].used = false;
    slot.letter = '';
    slot.tile = null;
    KW.sound.unpop();
    render();
  }

  async function check() {
    const my = token;
    busy = true;
    await wait(350);
    const made = state.slots.map(s => s.letter).join('');
    if (made === problem.word) {
      state.phase = 'done';
      [...els.slots.children].forEach(s => s.classList.add('good'));
      await soundOut(made, my);
      if (my !== token) return;
      KW.game.celebrate();
      picker.addStar(state.mistakes === 0);
      els.bubble.textContent = `You built ${problem.word}!`;
      els.next.hidden = false;
      await say(`${problem.word}! You did it!`);
      if (my === token) busy = false;
      return;
    }

    // Not yet: say what he built, then send back the letters in the wrong place.
    state.mistakes++;
    KW.sound.oops();
    state.slots.forEach((s, i) => {
      if (!s.fixed && s.letter !== problem.word[i]) els.slots.children[i].classList.add('bad');
    });
    els.bubble.textContent = 'Not quite. Listen!';
    await soundOut(made, my);
    if (my !== token) return;
    await say(`Hmm, that's not ${problem.word}. Listen: ${R.soundOut(problem.word)}`, { rate: 0.85 });
    if (my !== token) return;
    state.slots.forEach((s, i) => {
      if (!s.fixed && s.letter !== problem.word[i]) {
        state.tiles[s.tile].used = false;
        s.letter = '';
        s.tile = null;
      }
    });
    els.bubble.textContent = problem.text;
    render();
    busy = false;
  }

  // ---------- Events ----------
  els.tiles.addEventListener('click', e => {
    const b = e.target.closest('[data-tile]');
    if (b) placeTile(+b.dataset.tile);
  });
  els.slots.addEventListener('click', e => {
    const b = e.target.closest('[data-slot]');
    if (b) takeBack(+b.dataset.slot);
  });
  els.next.addEventListener('click', newProblem);
  els.show.addEventListener('click', () => { if (problem) KW.speech.say(problem.word); });
  els.soundOut.addEventListener('click', () => {
    if (problem) KW.speech.say(R.soundOut(problem.word), { rate: 0.8 });
  });
  els.repeat.addEventListener('click', () => {
    if (problem) KW.speech.say(`${problem.word}. ${problem.text}.`);
  });

  KW.game.onStart(els.overlay, els.play, () => {
    started = true;
    say(`${problem.word}. ${problem.text}.`);
  });

  picker = KW.game.levelPicker({ el: els.levels, levels: KW.levelsOf('words'), key: 'words', onChange: newProblem });
  KW.ui.bindSoundToggle($('soundBtn'));
  KW.ui.updateStars();
  newProblem();
})();
