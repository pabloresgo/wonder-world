// Ten-Frame Builder
// Counters always fill a ten frame in reading order (top row first), so a
// full frame is always exactly one "ten". Red counters are given by the game,
// blue counters are the ones the child adds.
(function () {
  'use strict';

  const LEVELS = KW.levelsOf('tenframe');

  const $ = id => document.getElementById(id);
  const els = {
    levels: $('levels'), eq: $('eq'), bubble: $('bubble'), board: $('board'),
    readout: $('readout'), controls: $('controls'), tray: $('tray'),
    check: $('checkBtn'), next: $('nextBtn'), choices: $('choices'),
    repeat: $('repeatBtn'), overlay: $('startOverlay'), play: $('playBtn')
  };

  const { rand, range, tensOnes } = KW.util;

  let picker = null;
  let problem = null;
  let state = null;      // { added, removed, phase: 'build' | 'answer' | 'done' }
  let busy = false;      // true while the game is talking / counting
  let token = 0;         // bumps on every new problem so old async work stops
  let started = false;
  let lastKey = '';
  let cells = [];
  let wraps = [];

  // ---------- Problems ----------
  function generate(lv) {
    switch (lv) {
      case 1: {
        const n = rand(1, 10);
        return { kind: 'build', frames: 1, given: 0, need: n, key: 'c' + n,
          say: `Show me ${n}.`, text: `Put in ${n}`, success: `Yes! That's ${n}!` };
      }
      case 2: {
        const a = rand(1, 8), b = rand(1, 10 - a);
        return { kind: 'add', frames: 1, given: a, need: b, answer: a + b, key: `a${a}+${b}`,
          say: `${a} plus ${b}. Add ${b} blue.`, text: `Add ${b} blue`,
          question: 'How many in all?', success: `Yes! ${a} plus ${b} is ${a + b}!` };
      }
      case 3: {
        const a = rand(1, 9), b = 10 - a;
        return { kind: 'make10', frames: 1, given: a, need: b, answer: b, key: 'm' + a,
          say: `${a} plus what makes 10? Fill the frame with blue.`, text: 'Fill the whole frame',
          question: 'How many blue did you add?', success: `Yes! ${a} plus ${b} makes 10!` };
      }
      case 4: {
        const n = rand(11, 30);
        return { kind: 'build', frames: 3, given: 0, need: n, key: 't' + n,
          say: `Show me ${n}.`, text: `Put in ${n}. A full frame is a ten!`,
          success: `Yes! ${tensOnes(n)} is ${n}!` };
      }
      default: {
        if (Math.random() < 0.5) {
          const a = rand(11, 24), b = rand(2, Math.min(9, 30 - a));
          return { kind: 'add', frames: 3, given: a, need: b, answer: a + b, key: `A${a}+${b}`,
            say: `${a} plus ${b}. Add ${b} blue.`, text: `Add ${b} blue`,
            question: 'How many in all?', success: `Yes! ${a} plus ${b} is ${a + b}!` };
        }
        const a = rand(12, 30), b = rand(2, Math.min(9, a - 2));
        return { kind: 'sub', frames: 3, given: a, need: b, answer: a - b, key: `S${a}-${b}`,
          say: `${a} take away ${b}. Tap ${b} counters to take them away.`, text: `Take away ${b}`,
          question: 'How many are left?', success: `Yes! ${a} take away ${b} is ${a - b}!` };
      }
    }
  }

  function makeProblem(lv) {
    let p, tries = 0;
    do { p = generate(lv); } while (p.key === lastKey && ++tries < 10);
    lastKey = p.key;
    return p;
  }

  function eqHtml(p, phase) {
    const R = n => `<span class="num-red">${n}</span>`;
    const B = n => `<span class="num-blue">${n}</span>`;
    const Q = phase === 'done' ? `<span class="num-green">${p.answer}</span>` : '<span class="q">?</span>';
    switch (p.kind) {
      case 'build':  return B(p.need);
      case 'add':    return phase === 'build' ? `${R(p.given)} + ${B(p.need)}` : `${R(p.given)} + ${B(p.need)} = ${Q}`;
      case 'make10': return `${R(p.given)} + ${Q} = 10`;
      case 'sub':    return phase === 'build' ? `${R(p.given)} − ${p.need}` : `${R(p.given)} − ${p.need} = ${Q}`;
    }
  }

  // ---------- Counting state ----------
  const capacity = () => problem.frames * 10;
  const liveGiven = () => problem.given - state.removed;
  const total = () => liveGiven() + state.added;

  function cellKind(i) {
    if (i < problem.given) return i < liveGiven() ? 'red' : 'ghost';
    if (i < problem.given + state.added) return 'blue';
    return 'empty';
  }

  // ---------- Rendering ----------
  function setBubble(text) {
    els.bubble.textContent = text;
  }

  function renderPrompt() {
    els.eq.innerHTML = eqHtml(problem, state.phase);
  }

  function buildBoard() {
    els.board.innerHTML = '';
    els.board.classList.toggle('multi', problem.frames > 1);
    cells = [];
    wraps = [];
    for (let f = 0; f < problem.frames; f++) {
      const wrap = document.createElement('div');
      wrap.className = 'frame-wrap';
      const frame = document.createElement('div');
      frame.className = 'frame';
      for (let c = 0; c < 10; c++) {
        const cell = document.createElement('button');
        cell.className = 'cell';
        cell.dataset.i = f * 10 + c;
        cell.dataset.kind = 'empty';
        frame.appendChild(cell);
        cells.push(cell);
      }
      const badge = document.createElement('div');
      badge.className = 'badge';
      badge.textContent = '10';
      wrap.append(frame, badge);
      els.board.appendChild(wrap);
      wraps.push(wrap);
    }
    renderBoard(-1, true);
  }

  function renderBoard(popIndex = -1, silent = false) {
    clearCounted();
    cells.forEach((cell, i) => {
      const kind = cellKind(i);
      if (cell.dataset.kind !== kind) {
        cell.dataset.kind = kind;
        cell.innerHTML = kind === 'empty' ? '' : `<span class="counter ${kind}"></span>`;
        if (i === popIndex && kind !== 'empty') cell.firstChild.classList.add('pop');
      }
      cell.setAttribute('aria-label', kind === 'empty' ? 'Empty box' : kind === 'ghost' ? 'Taken away' : kind + ' counter');
    });

    wraps.forEach((wrap, f) => {
      const full = range(f * 10, f * 10 + 10).every(i => {
        const k = cellKind(i);
        return k === 'red' || k === 'blue';
      });
      if (full && !wrap.classList.contains('full') && !silent && problem.frames > 1) KW.sound.ten();
      wrap.classList.toggle('full', full);
    });

    renderReadout();
  }

  // Tens/ones chips. Hidden while the child still has to find the answer.
  function renderReadout() {
    if (problem.frames > 1 && (problem.kind === 'build' || state.phase === 'done')) {
      const t = total();
      els.readout.innerHTML =
        `<span class="chip tens"><b>${Math.floor(t / 10)}</b> tens</span>` +
        `<span class="chip ones"><b>${t % 10}</b> ones</span>`;
    } else {
      els.readout.innerHTML = '';
    }
  }

  function clearCounted() {
    els.board.querySelectorAll('.counted').forEach(el => {
      el.classList.remove('counted');
      el.textContent = '';
    });
    wraps.forEach(w => w.classList.remove('highlight'));
  }

  function replay(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    el.addEventListener('animationend', () => el.classList.remove(cls), { once: true });
  }

  function showControls(mode) {
    // mode: 'build' | 'answer' | 'done'
    els.controls.hidden = mode === 'answer';
    els.tray.hidden = mode !== 'build' || problem.kind === 'sub';
    els.check.hidden = mode !== 'build';
    els.next.hidden = mode !== 'done';
    els.choices.hidden = mode !== 'answer';
  }

  // ---------- Talking ----------
  async function say(text, opts) {
    if (!started) return;
    await KW.speech.say(text, opts);
  }

  // Count counters one by one (full frames count as "ten, twenty...").
  async function countCells(indices, my) {
    clearCounted();
    const set = new Set(indices);
    let n = 0;
    for (let f = 0; f < problem.frames; f++) {
      const ids = range(f * 10, f * 10 + 10).filter(i => set.has(i));
      if (!ids.length) continue;
      if (ids.length === 10 && problem.frames > 1) {
        n += 10;
        wraps[f].classList.add('highlight');
        await say(String(n), { quick: true, rate: 1 });
        if (my !== token) return n;
        continue;
      }
      for (const i of ids) {
        n++;
        const counter = cells[i].firstChild;
        if (counter) {
          counter.classList.add('counted');
          counter.textContent = n;
        }
        await say(String(n), { quick: true, rate: 1 });
        if (my !== token) return n;
      }
    }
    return n;
  }

  // ---------- Game flow ----------
  function newProblem() {
    token++;
    busy = false;
    KW.speech.stop();
    problem = makeProblem(picker.level);
    state = { added: 0, removed: 0, phase: 'build', mistakes: 0 };
    renderPrompt();
    buildBoard();
    showControls('build');
    setBubble(problem.text);
    say(problem.say);
  }

  function canEdit() {
    return !busy && state.phase === 'build';
  }

  function addCounter() {
    if (!canEdit() || problem.kind === 'sub') return;
    if (total() >= capacity()) {
      KW.sound.oops();
      replay(els.board, 'shake');
      return;
    }
    state.added++;
    KW.sound.pop();
    renderBoard(problem.given + state.added - 1);
  }

  function tapCell(i) {
    if (!canEdit()) return;
    const kind = cellKind(i);
    const cell = cells[i];
    if (problem.kind === 'sub') {
      if (kind === 'red') {
        state.removed++;
        KW.sound.unpop();
        renderBoard();
      } else if (kind === 'ghost') {
        state.removed--;
        KW.sound.pop();
        renderBoard(liveGiven() - 1);
      }
      return;
    }
    if (kind === 'red') {
      // Red counters belong to the question; they just wiggle.
      replay(cell.firstChild, 'wiggle');
    } else if (kind === 'blue') {
      state.added--;
      KW.sound.unpop();
      renderBoard();
    } else {
      addCounter();
    }
  }

  async function check() {
    if (!canEdit()) return;
    const my = token;
    busy = true;
    const done = problem.kind === 'sub' ? state.removed : state.added;
    const diff = done - problem.need;
    if (diff === 0) {
      KW.sound.ding();
      if (problem.answer == null) await success(my);
      else await startAnswer(my);
    } else {
      KW.sound.oops();
      state.mistakes++;
      await buildHint(diff, my);
    }
    if (my === token) busy = false;
  }

  async function buildHint(diff, my) {
    const p = problem;
    const moreOrLess = diff < 0 ? 'We need more!' : "That's too many!";

    if (p.kind === 'make10') {
      setBubble('Some boxes are empty. Fill them all!');
      cells.forEach(c => { if (c.dataset.kind === 'empty') replay(c, 'flash'); });
      await say('Look! Some boxes are still empty. Fill them all!');
      return;
    }

    let indices, need;
    if (p.kind === 'sub') {
      indices = range(liveGiven(), p.given);
      need = `We need to take away ${p.need}.`;
    } else if (p.kind === 'add') {
      indices = range(p.given, p.given + state.added);
      need = `We need ${p.need} blue.`;
    } else {
      indices = range(0, state.added);
      need = `We need ${p.need}.`;
    }

    if (indices.length) {
      setBubble("Let's count!");
      await say("Let's count together.");
      if (my !== token) return;
      await countCells(indices, my);
      if (my !== token) return;
    }
    const msg = `${need} ${moreOrLess}`;
    setBubble(msg);
    await say(msg);
  }

  async function startAnswer(my) {
    state.phase = 'answer';
    renderPrompt();
    KW.game.renderChoices(els.choices, KW.game.nearChoices(problem.answer, {
      max: capacity(), tens: problem.frames > 1
    }));
    showControls('answer');
    setBubble(problem.question);
    await say(problem.question);
  }

  function answerIndices() {
    if (problem.kind === 'make10') return range(problem.given, 10);
    return range(0, total());
  }

  async function pick(btn) {
    if (busy || state.phase !== 'answer') return;
    const my = token;
    busy = true;
    if (+btn.dataset.v === problem.answer) {
      btn.classList.add('right');
      await success(my);
    } else {
      KW.sound.oops();
      state.mistakes++;
      btn.classList.add('wrong');
      btn.disabled = true;
      setBubble("Let's count them!");
      await say("Hmm. Let's count together.");
      if (my !== token) return;
      await countCells(answerIndices(), my);
      if (my !== token) return;
      setBubble(problem.question);
      await say('Which number is it?');
    }
    if (my === token) busy = false;
  }

  async function success(my) {
    state.phase = 'done';
    KW.game.celebrate();
    picker.addStar(state.mistakes === 0);
    renderPrompt();
    clearCounted();
    renderReadout();
    showControls('done');
    setBubble(problem.success);
    await say(problem.success);
  }

  // ---------- Dragging a counter from the tray ----------
  function startDrag(e) {
    if (!canEdit()) return;
    e.preventDefault();
    KW.sound.unlock();
    const startX = e.clientX, startY = e.clientY;
    let moved = false;
    let ghost = null;

    const move = ev => {
      if (!moved && Math.hypot(ev.clientX - startX, ev.clientY - startY) > 8) {
        moved = true;
        ghost = document.createElement('span');
        ghost.className = 'counter blue drag-counter';
        document.body.appendChild(ghost);
      }
      if (ghost) {
        ghost.style.left = ev.clientX + 'px';
        ghost.style.top = ev.clientY + 'px';
      }
    };
    const up = ev => {
      els.tray.removeEventListener('pointermove', move);
      els.tray.removeEventListener('pointerup', up);
      els.tray.removeEventListener('pointercancel', up);
      if (ghost) ghost.remove();
      if (!moved) {
        addCounter();                         // a simple tap on the tray adds one
      } else if (ev.type === 'pointerup') {
        const target = document.elementFromPoint(ev.clientX, ev.clientY);
        if (target && target.closest('#board')) addCounter();
      }
    };
    try { els.tray.setPointerCapture(e.pointerId); } catch (err) { /* keep going without capture */ }
    els.tray.addEventListener('pointermove', move);
    els.tray.addEventListener('pointerup', up);
    els.tray.addEventListener('pointercancel', up);
  }

  // ---------- Events ----------
  els.board.addEventListener('click', e => {
    const cell = e.target.closest('.cell');
    if (cell) tapCell(+cell.dataset.i);
  });
  els.tray.addEventListener('pointerdown', startDrag);
  els.tray.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); addCounter(); }
  });
  els.check.addEventListener('click', check);
  els.next.addEventListener('click', newProblem);
  els.choices.addEventListener('click', e => {
    const b = e.target.closest('.choice');
    if (b) pick(b);
  });
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

  picker = KW.game.levelPicker({ el: els.levels, levels: LEVELS, key: 'tenframe', onChange: newProblem });
  KW.ui.bindSoundToggle($('soundBtn'));
  KW.ui.updateStars();
  newProblem();
})();
