// Letter Land: letter names, big and little letters, first sounds,
// "which picture starts with...", and alphabet order.
(function () {
  'use strict';

  const R = KW.reading;
  const { shuffle } = KW.util;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const UP = l => l.toUpperCase();
  const cap = s => s[0].toUpperCase() + s.slice(1);

  const $ = id => document.getElementById(id);
  const els = {
    levels: $('levels'), show: $('show'), bubble: $('bubble'), choices: $('choices'),
    next: $('nextBtn'), repeat: $('repeatBtn'), overlay: $('startOverlay'), play: $('playBtn')
  };

  let picker = null;
  let problem = null;
  let state = null;   // { phase: 'ask' | 'done', mistakes }
  let busy = false;
  let started = false;
  let lastKey = '';

  // n different letters from `pool`, always including `must`.
  function withDistractors(must, pool, n) {
    const others = shuffle(pool.filter(l => l !== must)).slice(0, n - 1);
    return shuffle([must, ...others]);
  }

  // ---------- Problems ----------
  // Each problem: show (HTML for the big box), say, text, options [{v, label, pic}],
  // answer, wrongSay(v), success (spoken) and shown (the same, written with letters).
  function generate(lv) {
    switch (lv) {
      case 1: {
        const l = pick(R.ABC);
        return {
          key: 'f' + l, answer: l, show: '<span class="ear">👂</span>',
          say: `Find the letter ${R.name(l)}.`, text: 'Find the letter you hear',
          options: withDistractors(l, R.ABC, 4).map(v => ({ v, label: UP(v) })),
          wrongSay: v => `That's ${R.name(v)}. Find ${R.name(l)}!`,
          success: `Yes! That's ${R.name(l)}!`, shown: `Yes! That's ${UP(l)}!`
        };
      }
      case 2: {
        const l = pick(R.ABC);
        return {
          key: 'l' + l, answer: l, show: UP(l),
          say: `This is big ${R.name(l)}. Find little ${R.name(l)}.`, text: 'Find the little letter',
          options: withDistractors(l, R.ABC, 4).map(v => ({ v, label: v })),
          wrongSay: v => `That's little ${R.name(v)}. Find little ${R.name(l)}!`,
          success: `Yes! Big ${R.name(l)}, little ${R.name(l)}!`, shown: `Yes! ${UP(l)} and ${l}!`
        };
      }
      case 3: {
        const w = pick(R.STARTS);
        const firsts = [...new Set(R.STARTS.map(s => s.first))];
        return {
          key: 's' + w.word, answer: w.first, show: w.emoji,
          say: `${w.word}. What sound does ${w.word} start with?`, text: `What does ${w.word} start with?`,
          options: withDistractors(w.first, firsts, 3).map(v => ({ v, label: v })),
          wrongSay: v => `That's ${R.sound(v)}. Listen: ${w.word}. ${R.sound(w.first)}... ${w.word}.`,
          success: `Yes! ${w.word} starts with ${R.sound(w.first)}. ${R.name(w.first)}!`,
          shown: `Yes! ${cap(w.word)} starts with ${w.first}!`
        };
      }
      case 4: {
        const w = pick(R.STARTS);
        const others = shuffle(R.STARTS.filter(s => s.first !== w.first)).slice(0, 2);
        return {
          key: 'p' + w.word, answer: w.word, show: `${UP(w.first)}<span class="lower">${w.first}</span>`,
          say: `Which one starts with ${R.sound(w.first)}? ${R.name(w.first)}.`, text: `Which one starts with ${w.first}?`,
          options: shuffle([w, ...others]).map(s => ({ v: s.word, label: s.emoji, pic: true })),
          wrongSay: v => `${v} starts with ${R.sound(v[0])}. Try again!`,
          success: `Yes! ${w.word} starts with ${R.sound(w.first)}!`, shown: `Yes! ${cap(w.word)} starts with ${w.first}!`
        };
      }
      default: {
        const i = Math.floor(Math.random() * 23);
        const seq = R.ABC.slice(i, i + 3);
        const ans = R.ABC[i + 3];
        const nearby = R.ABC.slice(Math.max(0, i - 2), i + 7).filter(l => !seq.includes(l));
        return {
          key: 'n' + i, answer: ans,
          show: seq.map(l => `<span class="seq">${UP(l)}</span>`).join('') + '<span class="q">?</span>',
          say: `${seq.map(R.name).join(', ')}... What comes next?`, text: 'What comes next?',
          options: withDistractors(ans, nearby, 3).map(v => ({ v, label: UP(v) })),
          wrongSay: v => `That's ${R.name(v)}. Let's sing it: ${seq.map(R.name).join(', ')}...`,
          success: `Yes! ${seq.map(R.name).join(', ')}, ${R.name(ans)}!`,
          shown: `Yes! ${seq.map(UP).join(', ')}, ${UP(ans)}!`,
          done: seq.map(l => `<span class="seq">${UP(l)}</span>`).join('') + `<span class="num-green">${UP(ans)}</span>`
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
  function say(text) {
    return started ? KW.speech.say(text) : Promise.resolve();
  }

  function render() {
    els.show.innerHTML = state.phase === 'done' && problem.done ? problem.done : problem.show;
    els.show.classList.remove('bounce');
    void els.show.offsetWidth;
    els.show.classList.add('bounce');
    els.choices.innerHTML = problem.options.map(o =>
      `<button class="choice${o.pic ? ' pic' : ''}" data-v="${o.v}" aria-label="${o.pic ? o.v : R.name(o.v)}">${o.label}</button>`).join('');
  }

  function newProblem() {
    busy = false;
    KW.speech.stop();
    problem = makeProblem(picker.level);
    state = { phase: 'ask', mistakes: 0 };
    render();
    els.bubble.textContent = problem.text;
    els.next.hidden = true;
    say(problem.say);
  }

  async function choose(btn) {
    if (busy || state.phase !== 'ask') return;
    const v = btn.dataset.v;
    if (v === problem.answer) {
      busy = true;
      state.phase = 'done';
      btn.classList.add('right');
      KW.game.celebrate();
      picker.addStar(state.mistakes === 0);
      els.show.innerHTML = problem.done || problem.show;
      els.bubble.textContent = problem.shown;
      els.next.hidden = false;
      await say(problem.success);
      busy = false;
      return;
    }
    busy = true;
    state.mistakes++;
    KW.sound.oops();
    btn.classList.add('wrong');
    btn.disabled = true;
    await say(problem.wrongSay(v));
    // After two misses, the right answer glows to help.
    if (state.mistakes >= 2) {
      const right = els.choices.querySelector(`[data-v="${problem.answer}"]`);
      if (right) right.classList.add('glow');
    }
    busy = false;
  }

  // ---------- Events ----------
  els.choices.addEventListener('click', e => {
    const b = e.target.closest('.choice');
    if (b) choose(b);
  });
  els.next.addEventListener('click', newProblem);
  const repeat = () => { if (problem) KW.speech.say(state.phase === 'done' ? problem.success : problem.say); };
  els.repeat.addEventListener('click', repeat);
  els.show.addEventListener('click', repeat);

  KW.game.onStart(els.overlay, els.play, () => {
    started = true;
    say(problem.say);
  });

  picker = KW.game.levelPicker({ el: els.levels, levels: KW.levelsOf('letters'), key: 'letters', onChange: newProblem });
  KW.ui.bindSoundToggle($('soundBtn'));
  KW.ui.updateStars();
  newProblem();
})();
