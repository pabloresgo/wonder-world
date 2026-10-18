// Number Line Hopper
// A frog starts on a number and hops forward (+) or back (−). Each hop leaves
// an arc on the line, so adding and taking away become movement he can see.
// Level 5 splits a jump like +13 into one big jump of 10 and three small hops.
(function () {
  'use strict';

  const { rand, range } = KW.util;

  const LEVELS = KW.levelsOf('hopper');

  const LINES = {
    small: { min: 0, max: 10, pads: true },
    mid:   { min: 0, max: 20, pads: true },
    big:   { min: 0, max: 100, pads: false }
  };

  const HOP_MS = 480;
  const EDGE = 4; // % of empty space at each end of the line

  const $ = id => document.getElementById(id);
  const els = {
    levels: $('levels'), eq: $('eq'), bubble: $('bubble'),
    scroll: $('lineScroll'), line: $('line'), steps: $('steps'),
    choices: $('choices'), next: $('nextBtn'), repeat: $('repeatBtn'),
    overlay: $('startOverlay'), play: $('playBtn')
  };

  let picker = null;
  let problem = null;
  let state = null;   // { pos, done: [hops per group], phase: 'build'|'watch'|'answer'|'done' }
  let busy = false;
  let token = 0;
  let started = false;
  let lastKey = '';
  let frog, arcs, pads;

  // ---------- Problems ----------
  // groups: [[size, count], ...] e.g. +13 on level 5 is [[10, 1], [1, 3]]
  function make(a, groups, dir, line, mode, showTag) {
    const b = groups.reduce((sum, [size, count]) => sum + size * count, 0);
    const answer = a + dir * b;
    const word = dir > 0 ? 'plus' : 'take away';
    const way = dir > 0 ? 'forward' : 'back';
    let say, text;
    if (mode === 'guess') {
      say = `The frog is on ${a}. It will hop ${way} ${b}. Where will it land? Tap a lily pad!`;
      text = 'Where will the frog land? Tap a lily pad!';
    } else if (groups.length > 1) {
      const t = groups[0][1], o = groups[1][1];
      const tw = t === 1 ? '1 big jump' : `${t} big jumps`;
      const ow = o === 1 ? '1 small hop' : `${o} small hops`;
      say = `${a} ${word} ${b}. That's ${tw} of ten, and ${ow}.`;
      text = `${tw} of 10 and ${ow}`;
    } else {
      say = `${a} ${word} ${b}. Hop ${way} ${b} times.`;
      text = `Hop ${way} ${b}`;
    }
    return {
      a, b, dir, answer, mode, showTag,
      groups: groups.map(([size, count]) => ({ size, count })),
      lineName: line, line: LINES[line],
      key: `${a}${dir}${b}`,
      say, text,
      question: 'Where did the frog land?',
      success: `Yes! ${a} ${word} ${b} is ${answer}!`
    };
  }

  function generate(lv) {
    const plus = Math.random() < 0.5;
    switch (lv) {
      case 1: {
        const a = rand(0, 7), b = rand(1, Math.min(6, 10 - a));
        return make(a, [[1, b]], 1, 'small', 'hop', true);
      }
      case 2: {
        const a = rand(3, 10), b = rand(1, Math.min(6, a));
        return make(a, [[1, b]], -1, 'small', 'hop', true);
      }
      case 3: {
        if (plus) {
          const a = rand(0, 7), b = rand(1, Math.min(4, 10 - a));
          return make(a, [[1, b]], 1, 'small', 'guess', true);
        }
        const a = rand(3, 10), b = rand(1, Math.min(4, a));
        return make(a, [[1, b]], -1, 'small', 'guess', true);
      }
      case 4: {
        if (plus) {
          const a = rand(4, 15), b = rand(3, Math.min(9, 20 - a));
          return make(a, [[1, b]], 1, 'mid', 'hop', false);
        }
        const a = rand(9, 20), b = rand(3, Math.min(9, a));
        return make(a, [[1, b]], -1, 'mid', 'hop', false);
      }
      default: {
        const t = rand(1, 2), o = rand(1, 5), b = 10 * t + o;
        const a = plus ? rand(10, 100 - b) : rand(b, 99);
        return make(a, [[10, t], [1, o]], plus ? 1 : -1, 'big', 'hop', false);
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
    const sign = p.dir > 0 ? '+' : '−';
    const left = `${p.a} ${sign} <span class="num-blue">${p.b}</span>`;
    if (phase === 'done') return `${left} = <span class="num-green">${p.answer}</span>`;
    if (p.mode === 'hop' && phase === 'build') return left;
    return `${left} = <span class="q">?</span>`;
  }

  // ---------- Number line ----------
  const pct = n => {
    const L = problem.line;
    return EDGE + (n - L.min) / (L.max - L.min) * (100 - 2 * EDGE);
  };

  function buildLine() {
    const L = problem.line;
    els.line.className = 'line ' + problem.lineName + (problem.mode === 'guess' ? ' guessing' : '');
    let html = '<svg class="arcs" viewBox="0 0 1000 150" preserveAspectRatio="none" aria-hidden="true"></svg>' +
               '<div class="track"></div>';
    for (let n = L.min; n <= L.max; n++) {
      if (L.pads) {
        html += `<button class="pad" data-n="${n}" style="left:${pct(n)}%" aria-label="${n}">` +
                `<span class="pad-label">${n}</span></button>`;
      } else {
        const cls = n % 10 === 0 ? ' major' : n % 5 === 0 ? ' mid' : '';
        html += `<div class="tick${cls}" style="left:${pct(n)}%">${n % 10 === 0 ? `<span>${n}</span>` : ''}</div>`;
      }
    }
    html += '<div class="frog" id="frog"><div class="tag" id="frogTag"></div><div class="frog-body">🐸</div></div>';
    els.line.innerHTML = html;

    frog = $('frog');
    arcs = els.line.querySelector('.arcs');
    pads = {};
    els.line.querySelectorAll('.pad').forEach(p => { pads[p.dataset.n] = p; });
    placeFrog(problem.a, false);
    showTag(true);
    els.scroll.scrollLeft = 0;
    scrollToFrog(problem.a, false);
  }

  function placeFrog(n, animate) {
    frog.style.transition = animate ? `left ${HOP_MS}ms linear` : 'none';
    frog.style.left = pct(n) + '%';
    $('frogTag').textContent = n;
  }

  function showTag(on) {
    frog.classList.toggle('tag-on', on);
  }

  // Wide lines scroll sideways on small screens; keep the frog in view.
  function scrollToFrog(n, smooth = true) {
    const x = pct(n) / 100 * els.line.offsetWidth - els.scroll.clientWidth / 2;
    els.scroll.scrollTo({ left: Math.max(0, x), behavior: smooth ? 'smooth' : 'auto' });
  }

  function drawArc(from, to, size) {
    const x1 = pct(from) * 10, x2 = pct(to) * 10;
    const h = size >= 10 ? 120 : problem.lineName === 'big' ? 30 : 55;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    // Quadratic curve: control point at twice the height gives a peak of h.
    path.setAttribute('d', `M${x1} 140 Q${(x1 + x2) / 2} ${140 - 2 * h} ${x2} 140`);
    path.setAttribute('class', 'arc ' + (size >= 10 ? 'big' : 'small'));
    path.setAttribute('pathLength', '1');
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    arcs.appendChild(path);
    path.getBoundingClientRect();
    path.classList.add('drawn');
  }

  async function hop(size) {
    const from = state.pos, to = from + problem.dir * size;
    state.pos = to;
    if (size >= 10) KW.sound.bigHop(problem.dir); else KW.sound.hop(problem.dir);
    frog.classList.remove('hopping', 'big');
    void frog.offsetWidth;
    frog.classList.add('hopping');
    if (size >= 10) frog.classList.add('big');
    placeFrog(to, true);
    drawArc(from, to, size);
    scrollToFrog(to);
    await KW.ui.wait(HOP_MS);
    frog.classList.remove('hopping', 'big');
  }

  // ---------- Rendering ----------
  function setBubble(text) {
    els.bubble.textContent = text;
  }

  function renderPrompt() {
    els.eq.innerHTML = eqHtml(problem, state.phase);
  }

  function renderSteps() {
    const fwd = problem.dir > 0;
    els.steps.innerHTML = problem.groups.map((g, i) => {
      const done = state.done[i];
      const label = fwd ? `<b>${g.size}</b><span>➜</span>` : `<span>⬅</span><b>${g.size}</b>`;
      const prints = range(0, g.count)
        .map(k => `<span class="print${k < done ? ' on' : ''}">${k < done ? '🐾' : ''}</span>`).join('');
      return `<div class="step-row ${g.size >= 10 ? 'big' : 'small'}">
        <button class="hop-btn" data-g="${i}" ${done >= g.count ? 'disabled' : ''}
          aria-label="Hop ${fwd ? 'forward' : 'back'} ${g.size}">${label}</button>
        <div class="prints">${prints}</div></div>`;
    }).join('');
  }

  function showControls(mode) {
    els.steps.hidden = !(mode === 'build' && problem.mode === 'hop');
    els.choices.hidden = mode !== 'answer';
    els.next.hidden = mode !== 'done';
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
    state = { pos: problem.a, done: problem.groups.map(() => 0), phase: 'build', mistakes: 0 };
    renderPrompt();
    buildLine();
    renderSteps();
    showControls('build');
    setBubble(problem.text);
    say(problem.say);
  }

  async function tapHop(g) {
    if (busy || state.phase !== 'build') return;
    const group = problem.groups[g];
    if (state.done[g] >= group.count) return;
    const my = token;
    busy = true;
    state.done[g]++;
    renderSteps();
    if (!problem.showTag) showTag(false);
    say(String(state.done[g]), { quick: true, rate: 1 });   // count the hops
    await hop(group.size);
    if (my !== token) return;
    busy = false;
    if (state.done.every((d, i) => d >= problem.groups[i].count)) startAnswer();
  }

  async function startAnswer() {
    state.phase = 'answer';
    showTag(false);
    renderPrompt();
    const L = problem.line;
    KW.game.renderChoices(els.choices, KW.game.nearChoices(problem.answer, {
      min: L.min, max: L.max, tens: problem.lineName === 'big'
    }));
    showControls('answer');
    setBubble(problem.question);
    await say(problem.question);
  }

  // Hint: hop again from the start, saying each landing number out loud
  // ("counting on": 3... 4, 5, 6, 7).
  async function replay(my) {
    arcs.innerHTML = '';
    state.pos = problem.a;
    placeFrog(problem.a, false);
    scrollToFrog(problem.a);
    showTag(true);
    await say(`Start at ${problem.a}.`);
    for (const g of problem.groups) {
      for (let k = 0; k < g.count; k++) {
        if (my !== token) return;
        await hop(g.size);
        await say(String(state.pos), { quick: true, rate: 1 });
      }
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
      setBubble("Let's hop again and count!");
      await say("Hmm. Let's hop again and count together.");
      if (my !== token) return;
      await replay(my);
      if (my !== token) return;
      setBubble(problem.question);
      await say('Which number is it?');
    }
    if (my === token) busy = false;
  }

  async function guess(n) {
    if (busy || problem.mode !== 'guess' || state.phase !== 'build') return;
    const my = token;
    busy = true;
    state.phase = 'watch';
    pads[n].classList.add('picked');
    KW.sound.pop();
    renderPrompt();
    setBubble(`You picked ${n}. Let's watch!`);
    await say(`You picked ${n}. Let's watch!`);
    for (let k = 0; k < problem.b; k++) {
      if (my !== token) return;
      await hop(1);
      await say(String(state.pos), { quick: true, rate: 1 });
    }
    if (my !== token) return;
    if (n === problem.answer) {
      await success();
    } else {
      // A wrong guess is still a good try: show where it landed, no star.
      state.phase = 'done';
      KW.progress.record('hopper', picker.level, false, false);
      pads[problem.answer].classList.add('landed');
      renderPrompt();
      showControls('done');
      setBubble(`The frog landed on ${problem.answer}!`);
      await say(`Oh! The frog landed on ${problem.answer}. Good try! Let's play again.`);
    }
    if (my === token) busy = false;
  }

  async function success() {
    state.phase = 'done';
    KW.game.celebrate();
    picker.addStar(state.mistakes === 0);
    renderPrompt();
    showTag(true);
    if (pads[problem.answer]) pads[problem.answer].classList.add('landed');
    showControls('done');
    setBubble(problem.success);
    await say(problem.success);
  }

  // ---------- Events ----------
  els.steps.addEventListener('click', e => {
    const b = e.target.closest('.hop-btn');
    if (b) tapHop(+b.dataset.g);
  });
  els.line.addEventListener('click', e => {
    const pad = e.target.closest('.pad');
    if (pad) guess(+pad.dataset.n);
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
  window.addEventListener('resize', () => { if (frog) scrollToFrog(state.pos, false); });

  KW.game.onStart(els.overlay, els.play, () => {
    started = true;
    say(problem.say);
  });

  picker = KW.game.levelPicker({ el: els.levels, levels: LEVELS, key: 'hopper', onChange: newProblem });
  KW.ui.bindSoundToggle($('soundBtn'));
  KW.ui.updateStars();
  newProblem();
})();
