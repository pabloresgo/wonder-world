// Balance Scale
// The left pan holds the question; the child loads the right pan until the
// beam is level. The tilt shows "too heavy" / "too light" all the time, so
// he can reason his way to the answer (early "=" and missing-number thinking).
(function () {
  'use strict';

  const { rand, range, tensOnes } = KW.util;

  const LEVELS = KW.levelsOf('balance');

  const $ = id => document.getElementById(id);
  const els = {
    levels: $('levels'), eq: $('eq'), bubble: $('bubble'), scale: $('scale'),
    left: $('leftItems'), right: $('rightItems'), shelf: $('shelf'),
    choices: $('choices'), next: $('nextBtn'), repeat: $('repeatBtn'),
    overlay: $('startOverlay'), play: $('playBtn')
  };

  let picker = null;
  let problem = null;
  let state = null;   // { tens, ones, weight, phase, lastDiff }
  let busy = false;
  let token = 0;
  let started = false;
  let lastKey = '';

  const R = n => `<span class="num-red">${n}</span>`;
  const O = n => `<span class="num-orange">${n}</span>`;
  const B = n => `<span class="num-blue">${n}</span>`;
  const Q = '<span class="q">?</span>';
  const split = n => ({ tens: Math.floor(n / 10), ones: n % 10 });

  // ---------- Problems ----------
  // mode: 'ones' (add 1-blocks), 'weights' (pick one numbered weight),
  //       'tens' (add 10-bars and 1-blocks)
  function generate(lv) {
    switch (lv) {
      case 1: {
        const n = rand(2, 10);
        return { mode: 'ones', left: [{ tens: 0, ones: n, color: 'red' }], leftValue: n, fixed: 0, key: 's' + n,
          eqBuild: `${R(n)} = ${Q}`, eqDone: `${R(n)} = ${B(n)}`,
          say: `Make the scale balance! This side has ${n}. Add blocks to the other side.`,
          text: 'Make both sides the same', success: `Yes! ${n} and ${n} balance!` };
      }
      case 2: {
        const t = rand(4, 10), a = rand(1, t - 1), b = t - a;
        return { mode: 'ones', left: [{ tens: 0, ones: t, color: 'red' }], leftValue: t, fixed: a, answer: b, key: `m${t}-${a}`,
          eqBuild: `${R(t)} = ${O(a)} + ${Q}`, eqDone: `${R(t)} = ${O(a)} + ${B(b)}`,
          say: `This side has ${t}. That side has ${a}. Add blocks until it balances.`,
          text: 'Add blocks until it balances', question: 'How many blue did you add?',
          success: `Yes! ${a} plus ${b} is ${t}!` };
      }
      case 3: {
        const a = rand(1, 6), b = rand(1, Math.min(6, 10 - a)), s = a + b;
        return { mode: 'weights', weights: [a, b], leftValue: s, fixed: 0, key: `w${a}+${b}`,
          picks: KW.game.nearChoices(s, { min: 1, max: 12 }).sort((x, y) => x - y),
          eqBuild: `${R(a)} + ${O(b)} = ${Q}`, eqDone: `${R(a)} + ${O(b)} = ${B(s)}`,
          say: `${a} plus ${b}. Which weight makes it balance?`,
          text: 'Pick a weight', success: `Yes! ${a} plus ${b} is ${s}!` };
      }
      case 4: {
        const n = rand(12, 49);
        return { mode: 'tens', left: [{ ...split(n), color: 'red' }], leftValue: n, fixed: 0, key: 't' + n,
          eqBuild: `${R(n)} = ${Q}`, eqDone: `${R(n)} = ${B(n)}`,
          say: `Make ${n} with tens and ones.`,
          text: 'Use 10s and 1s', success: `Yes! ${tensOnes(n)} is ${n}!` };
      }
      default: {
        const a = rand(10, 29), b = rand(5, 19), s = a + b;
        return { mode: 'tens', left: [{ ...split(a), color: 'red' }, { ...split(b), color: 'orange' }],
          leftValue: s, fixed: 0, key: `T${a}+${b}`,
          eqBuild: `${R(a)} + ${O(b)} = ${Q}`, eqDone: `${R(a)} + ${O(b)} = ${B(s)}`,
          say: `${a} plus ${b}. Balance it with tens and ones!`,
          text: 'Use 10s and 1s', success: `Yes! ${a} plus ${b} is ${s}!` };
      }
    }
  }

  function makeProblem(lv) {
    let p, tries = 0;
    do { p = generate(lv); } while (p.key === lastKey && ++tries < 10);
    lastKey = p.key;
    return p;
  }

  const rightValue = () => problem.fixed + state.tens * 10 + state.ones + (state.weight || 0);
  const diff = () => rightValue() - problem.leftValue;

  // ---------- Rendering ----------
  // Bars sit at the bottom of a pan, then 1-blocks in rows of five.
  function groupHtml(g, removable) {
    let html = '';
    for (let i = 0; i < g.tens; i++) {
      html += `<div class="bar ${g.color}"${removable ? ' data-rm="ten" aria-label="Take off a ten"' : ''}><span>10</span></div>`;
    }
    for (let r = 0; r < g.ones; r += 5) {
      html += '<div class="row">' + range(r, Math.min(g.ones, r + 5))
        .map(() => `<span class="cube ${g.color}"${removable ? ' data-rm="one"' : ''}></span>`).join('') + '</div>';
    }
    return html;
  }

  function weightHtml(n, color, removable) {
    return `<div class="weight ${color}" style="--n:${n}"${removable ? ' data-rm="weight"' : ''}><span>${n}</span></div>`;
  }

  function renderPans() {
    const p = problem;
    els.left.innerHTML = p.mode === 'weights'
      ? `<div class="row">${weightHtml(p.weights[0], 'red')}${weightHtml(p.weights[1], 'orange')}</div>`
      : p.left.map(g => groupHtml(g)).join('');

    let right = '';
    if (p.fixed) right += groupHtml({ tens: 0, ones: p.fixed, color: 'orange' });
    if (p.mode === 'weights') {
      if (state.weight) right += `<div class="row">${weightHtml(state.weight, 'blue', true)}</div>`;
    } else {
      right += groupHtml({ tens: state.tens, ones: state.ones, color: 'blue' }, true);
    }
    els.right.innerHTML = right;

    const d = diff();
    const tilt = d === 0 ? 0 : Math.sign(d) * Math.min(12, 3 + Math.abs(d) * 1.2);
    els.scale.style.setProperty('--tilt', tilt + 'deg');
    els.scale.classList.toggle('balanced', d === 0);
  }

  function renderShelf() {
    const p = problem;
    const cube = '<button class="add-btn" data-add="1" aria-label="Add one"><span class="cube blue"></span>+1</button>';
    const bar = '<button class="add-btn" data-add="10" aria-label="Add ten"><div class="bar blue"><span>10</span></div>+10</button>';
    const reset = '<button class="icon-btn" data-reset aria-label="Take everything off">↺</button>';
    if (p.mode === 'weights') {
      els.shelf.innerHTML = p.picks.map(n =>
        `<button class="weight-pick${state.weight === n ? ' chosen' : ''}" data-w="${n}" aria-label="Weight ${n}">` +
        weightHtml(n, 'gray') + '</button>').join('');
    } else {
      els.shelf.innerHTML = (p.mode === 'tens' ? bar : '') + cube + reset;
    }
  }

  function renderPrompt() {
    els.eq.innerHTML = state.phase === 'done' ? problem.eqDone : problem.eqBuild;
  }

  function setBubble(text) {
    els.bubble.textContent = text;
  }

  function showControls(mode) {
    els.shelf.hidden = mode !== 'build';
    els.choices.hidden = mode !== 'answer';
    els.next.hidden = mode !== 'done';
  }

  function popLast(selector) {
    const items = els.right.querySelectorAll(selector);
    const el = items[items.length - 1];
    if (el) el.classList.add('pop');
  }

  async function say(text, opts) {
    if (!started) return;
    await KW.speech.say(text, opts);
  }

  // ---------- Game flow ----------
  function newProblem() {
    token++;
    busy = false;
    KW.speech.stop();
    problem = makeProblem(picker.level);
    state = { tens: 0, ones: 0, weight: null, phase: 'build', lastDiff: -1, mistakes: 0 };
    els.scale.classList.toggle('tall', problem.mode === 'tens');
    renderPrompt();
    renderPans();
    renderShelf();
    showControls('build');
    setBubble(problem.text);
    say(problem.say);
  }

  // Called after every change to the right pan.
  function changed(added) {
    renderPans();
    if (problem.mode === 'weights') renderShelf();
    const d = diff();
    if (d === 0) {
      onBalanced();
    } else if (problem.mode === 'weights') {
      state.mistakes++;
      const msg = d > 0 ? 'Too heavy! Try a smaller weight.' : 'Too light! Try a bigger weight.';
      setBubble(msg);
      say(msg);
    } else if (d > 0 && state.lastDiff <= 0) {
      setBubble('Too heavy! Take some off.');
      say('Oops, too heavy! Take some off.');
    } else if (d < 0) {
      setBubble(problem.text);
      if (added && problem.mode === 'ones') say(String(state.ones), { quick: true, rate: 1 });
    }
    state.lastDiff = d;
  }

  async function add(size) {
    if (busy || state.phase !== 'build') return;
    if (problem.mode === 'ones') {
      if (state.ones >= 10) { KW.sound.oops(); return; }
      state.ones++;
      KW.sound.pop();
      changed(true);
      popLast('.cube.blue');
      return;
    }
    if (size === 10) {
      if (state.tens >= 6) { KW.sound.oops(); return; }
      state.tens++;
      KW.sound.pop();
      changed(true);
      popLast('.bar.blue');
      return;
    }
    state.ones++;
    KW.sound.pop();
    if (state.ones === 10) {
      // Ten 1-blocks become one 10-bar right in front of him.
      const my = token;
      busy = true;
      renderPans();
      setBubble('10 ones make 1 ten!');
      say('Ten ones make one ten!');
      await KW.ui.wait(900);
      if (my !== token) return;
      state.ones = 0;
      state.tens++;
      KW.sound.ten();
      busy = false;
      changed(true);
      popLast('.bar.blue');
      return;
    }
    changed(true);
    popLast('.cube.blue');
  }

  function remove(kind) {
    if (busy || state.phase !== 'build') return;
    if (kind === 'ten') state.tens--;
    else if (kind === 'one') state.ones--;
    else state.weight = null;
    KW.sound.unpop();
    changed(false);
  }

  function pickWeight(n) {
    if (busy || state.phase !== 'build') return;
    state.weight = n;
    KW.sound.pop();
    changed(true);
    popLast('.weight');
  }

  function reset() {
    if (busy || state.phase !== 'build') return;
    state.tens = 0;
    state.ones = 0;
    state.weight = null;
    KW.sound.unpop();
    changed(false);
  }

  async function onBalanced() {
    const my = token;
    busy = true;
    KW.sound.ding();
    setBubble('It balances!');
    await KW.ui.wait(900);
    if (my !== token) return;
    if (problem.question) await startAnswer();
    else await success();
    if (my === token) busy = false;
  }

  async function startAnswer() {
    state.phase = 'answer';
    KW.game.renderChoices(els.choices, KW.game.nearChoices(problem.answer, { min: 1, max: 10 }));
    showControls('answer');
    setBubble(problem.question);
    await say(problem.question);
  }

  async function countBlue(my) {
    const cubes = [...els.right.querySelectorAll('.cube.blue')];
    for (let i = 0; i < cubes.length; i++) {
      cubes[i].classList.add('counted');
      cubes[i].textContent = i + 1;
      await say(String(i + 1), { quick: true, rate: 1 });
      if (my !== token) return;
    }
  }

  async function pick(btn) {
    if (busy || state.phase !== 'answer') return;
    const my = token;
    busy = true;
    if (+btn.dataset.v === problem.answer) {
      btn.classList.add('right');
      await success();
    } else {
      KW.sound.oops();
      state.mistakes++;
      btn.classList.add('wrong');
      btn.disabled = true;
      setBubble("Let's count the blue ones!");
      await say("Hmm. Let's count the blue blocks together.");
      if (my !== token) return;
      await countBlue(my);
      if (my !== token) return;
      setBubble(problem.question);
      await say('Which number is it?');
    }
    if (my === token) busy = false;
  }

  async function success() {
    state.phase = 'done';
    KW.game.celebrate();
    picker.addStar(state.mistakes === 0);
    renderPrompt();
    showControls('done');
    setBubble(problem.success);
    await say(problem.success);
  }

  // ---------- Events ----------
  els.shelf.addEventListener('click', e => {
    const addBtn = e.target.closest('[data-add]');
    const w = e.target.closest('[data-w]');
    if (addBtn) add(+addBtn.dataset.add);
    else if (w) pickWeight(+w.dataset.w);
    else if (e.target.closest('[data-reset]')) reset();
  });
  els.right.addEventListener('click', e => {
    const item = e.target.closest('[data-rm]');
    if (item) remove(item.dataset.rm);
  });
  els.choices.addEventListener('click', e => {
    const b = e.target.closest('.choice');
    if (b) pick(b);
  });
  els.next.addEventListener('click', newProblem);
  els.repeat.addEventListener('click', () => {
    if (!state) return;
    const text = state.phase === 'answer' ? problem.question
      : state.phase === 'done' ? problem.success : problem.say;
    KW.speech.say(text);
  });

  KW.game.onStart(els.overlay, els.play, () => {
    started = true;
    say(problem.say);
  });

  picker = KW.game.levelPicker({ el: els.levels, levels: LEVELS, key: 'balance', onChange: newProblem });
  KW.ui.bindSoundToggle($('soundBtn'));
  KW.ui.updateStars();
  newProblem();
})();
