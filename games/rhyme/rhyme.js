// Rhyme Time: hear whether words rhyme, find a rhyme, spot the odd one out,
// finish a little rhyme, and collect every word that rhymes.
// Tapping any picture says its word first, so he always hears the sounds.
(function () {
  'use strict';

  const R = KW.reading;
  const { shuffle } = KW.util;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const ALL = R.RHYMES.flat();

  const $ = id => document.getElementById(id);
  const els = {
    levels: $('levels'), top: $('top'), bubble: $('bubble'), options: $('options'),
    next: $('nextBtn'), repeat: $('repeatBtn'), overlay: $('startOverlay'), play: $('playBtn')
  };

  let picker = null;
  let problem = null;
  let state = null;   // { phase: 'ask' | 'done', mistakes, found: Set }
  let busy = false;
  let token = 0;
  let started = false;
  let lastKey = '';

  // ---------- Picking words ----------
  const famOf = w => R.RHYMES[w.fam];
  const partner = w => pick(famOf(w).filter(x => x !== w));
  // n words, each from a different family and none from the families in `not`
  function strangers(n, not) {
    const fams = shuffle(R.RHYMES.filter((_, f) => !not.includes(f)));
    return fams.slice(0, n).map(pick);
  }

  const card = (w, cls = '') =>
    `<button class="pic-card ${cls}" data-w="${w.word}" aria-label="${w.word}"><span class="pic">${w.emoji}</span><span class="word">${w.word}</span></button>`;

  // ---------- Problems ----------
  function generate(lv) {
    switch (lv) {
      case 1: {
        const a = pick(ALL);
        const same = Math.random() < 0.5;
        const b = same ? partner(a) : strangers(1, [a.fam])[0];
        return {
          kind: 'yesno', key: a.word + b.word, answer: same ? 'yes' : 'no',
          top: card(a, 'big') + '<span class="q">?</span>' + card(b, 'big'),
          say: `${a.word}... ${b.word}. Do they rhyme?`, text: 'Do they rhyme?',
          options: '<button class="yn yes" data-w="yes">👍<small>Yes</small></button>' +
                   '<button class="yn no" data-w="no">👎<small>No</small></button>',
          wrongSay: () => same
            ? `Listen: ${a.word}, ${b.word}. They end with the same sound. They rhyme!`
            : `Listen: ${a.word}, ${b.word}. They end with different sounds.`,
          success: same ? `Yes! ${a.word} and ${b.word} rhyme!` : `Right! ${a.word} and ${b.word} don't rhyme.`
        };
      }
      case 2: {
        const t = pick(ALL), ans = partner(t);
        const opts = shuffle([ans, ...strangers(2, [t.fam])]);
        return {
          kind: 'pick', key: t.word, answer: ans.word,
          top: card(t, 'big'),
          say: `${t.word}. What rhymes with ${t.word}?`, text: `What rhymes with ${t.word}?`,
          options: opts.map(w => card(w)).join(''),
          wrongSay: w => `${w}, ${t.word}. No, they don't rhyme. Try again!`,
          success: `Yes! ${t.word} and ${ans.word} rhyme!`
        };
      }
      case 3: {
        const a = pick(ALL), b = partner(a), odd = strangers(1, [a.fam])[0];
        const opts = shuffle([a, b, odd]);
        return {
          kind: 'pick', key: a.word + odd.word, answer: odd.word,
          top: '<div class="show">🤔</div>',
          say: `${opts.map(w => w.word).join(', ')}. Which one does not rhyme?`,
          text: "Which one doesn't rhyme?",
          options: opts.map(w => card(w)).join(''),
          wrongSay: w => `${w} rhymes with ${w === a.word ? b.word : a.word}. Find the one that doesn't rhyme!`,
          success: `Yes! ${a.word} and ${b.word} rhyme, but ${odd.word} doesn't!`
        };
      }
      case 4: {
        const c = pick(R.COUPLETS), ans = R.rhymeWord(c.word);
        const opts = shuffle([ans, ...strangers(2, [ans.fam])]);
        return {
          kind: 'pick', key: c.word, answer: ans.word,
          top: `<p class="couplet">${c.text} <span class="gap" id="gap">?</span></p>`,
          say: `${c.text}... what?`, text: 'Which word finishes the rhyme?',
          options: opts.map(w => card(w)).join(''),
          wrongSay: w => `${c.text} ${w}? That doesn't rhyme. Try again!`,
          success: `${c.text} ${ans.word}!`,
          fill: ans.word
        };
      }
      default: {
        const t = pick(ALL.filter(w => famOf(w).length >= 3));
        const targets = famOf(t).filter(w => w !== t);
        const others = strangers(6 - targets.length, [t.fam]);
        return {
          kind: 'collect', key: t.word, targets: targets.map(w => w.word), target: t,
          top: card(t, 'big') + `<span class="counter-chip" id="count">0 of ${targets.length}</span>`,
          say: `Find all the words that rhyme with ${t.word}!`, text: `Find every word that rhymes with ${t.word}`,
          options: shuffle([...targets, ...others]).map(w => card(w)).join(''),
          wrongSay: w => `${w} doesn't rhyme with ${t.word}.`,
          success: `You found them all! ${[t, ...targets].map(w => w.word).join(', ')}!`
        };
      }
    }
  }

  function makeProblem(lv) {
    let p, tries = 0;
    do { p = generate(lv); } while (p.key === lastKey && ++tries < 10);
    lastKey = p.key;
    return p;
  }

  // ---------- Flow ----------
  function say(text, opts) {
    return started ? KW.speech.say(text, opts) : Promise.resolve();
  }

  function newProblem() {
    token++;
    busy = false;
    KW.speech.stop();
    problem = makeProblem(picker.level);
    state = { phase: 'ask', mistakes: 0, found: new Set() };
    els.top.innerHTML = problem.top;
    els.options.innerHTML = problem.options;
    els.bubble.textContent = problem.text;
    els.next.hidden = true;
    say(problem.say);
  }

  async function win(my) {
    state.phase = 'done';
    KW.game.celebrate();
    picker.addStar(state.mistakes === 0);
    if (problem.fill) $('gap').textContent = problem.fill;
    els.bubble.textContent = problem.success;
    els.next.hidden = false;
    await say(problem.success);
    if (my === token) busy = false;
  }

  async function miss(btn, w, my) {
    state.mistakes++;
    KW.sound.oops();
    btn.classList.add('wrong');
    btn.disabled = true;
    await say(problem.wrongSay(w));
    if (my !== token) return;
    // After two misses on a one-answer question, the answer glows.
    if (state.mistakes >= 2 && problem.answer) {
      const right = els.options.querySelector(`[data-w="${problem.answer}"]`);
      if (right) right.classList.add('glow');
    }
    busy = false;
  }

  async function tap(btn) {
    if (busy || state.phase !== 'ask') return;
    const my = token;
    const w = btn.dataset.w;
    busy = true;

    if (problem.kind === 'yesno') {
      if (w === problem.answer) { btn.classList.add('right'); await win(my); }
      else await miss(btn, w, my);
      return;
    }

    // Say the picture's word first.
    btn.classList.remove('talk');
    void btn.offsetWidth;
    btn.classList.add('talk');
    await say(w, { quick: true });
    if (my !== token) return;

    if (problem.kind === 'collect') {
      if (problem.targets.includes(w) && !state.found.has(w)) {
        state.found.add(w);
        btn.classList.add('found');
        btn.disabled = true;
        KW.sound.ding();
        $('count').textContent = `${state.found.size} of ${problem.targets.length}`;
        if (state.found.size === problem.targets.length) { await win(my); return; }
        await say(`${w}, ${problem.target.word}. They rhyme!`);
        if (my === token) busy = false;
      } else {
        await miss(btn, w, my);
      }
      return;
    }

    if (w === problem.answer) { btn.classList.add('right'); await win(my); }
    else await miss(btn, w, my);
  }

  // ---------- Events ----------
  els.options.addEventListener('click', e => {
    const b = e.target.closest('[data-w]');
    if (b) tap(b);
  });
  // The pictures at the top just say their word.
  els.top.addEventListener('click', e => {
    const b = e.target.closest('[data-w]');
    if (b) KW.speech.say(b.dataset.w);
  });
  els.next.addEventListener('click', newProblem);
  els.repeat.addEventListener('click', () => {
    if (problem) KW.speech.say(state.phase === 'done' ? problem.success : problem.say);
  });

  KW.game.onStart(els.overlay, els.play, () => {
    started = true;
    say(problem.say);
  });

  picker = KW.game.levelPicker({ el: els.levels, levels: KW.levelsOf('rhyme'), key: 'rhyme', onChange: newProblem });
  KW.ui.bindSoundToggle($('soundBtn'));
  KW.ui.updateStars();
  newProblem();
})();
