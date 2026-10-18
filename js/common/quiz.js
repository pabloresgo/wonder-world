// A small game engine for picture games, used by the Science Island games.
// A game only supplies generate(level) -> problem, with one of these kinds:
//
//   pick:    { show, options: [item], answer: id, wrongSay(id) }       tap the right picture
//   sort:    { bins: [{id, html, label, cls}], items: [item + bin] }    put each picture in its group
//   order:   { head, items: [item] (in the right order), hint(slot) }  put pictures in order
//   explore: { items: [item + fact] }                                  tap every picture to learn
//
// Every problem also has key, say, text and success. An item is
// { id, html, label } plus `why` (sort: said after a wrong group) or `fact` (explore).
window.KW = window.KW || {};

KW.quiz = function (options) {
  'use strict';

  const { key, generate } = options;
  const { shuffle } = KW.util;
  const $ = id => document.getElementById(id);
  const els = {
    levels: $('levels'), top: $('top'), bubble: $('bubble'), area: $('area'),
    next: $('nextBtn'), repeat: $('repeatBtn'), overlay: $('startOverlay'), play: $('playBtn')
  };

  let picker = null;
  let problem = null;
  let state = null;
  let busy = false;
  let token = 0;
  let started = false;
  let lastKey = '';

  const say = (text, opts) => (started ? KW.speech.say(text, opts) : Promise.resolve());

  const card = (it, cls = '', attrs = '') =>
    `<button class="q-card ${cls}" ${attrs} aria-label="${it.label}"><span class="pic">${it.html}</span><span class="label">${it.label}</span></button>`;

  function replay(el, cls) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  // ---------- Rendering ----------
  function render() {
    const p = problem;
    els.area.className = 'q-area ' + p.kind;
    if (p.kind === 'pick') {
      els.top.innerHTML = p.show || '';
      els.area.innerHTML = p.options.map(o => card(o, '', `data-id="${o.id}"`)).join('');
    } else if (p.kind === 'sort') {
      const it = p.items[state.idx];
      els.top.innerHTML = it ? card(it, 'big', `data-say="${it.label}"`) : '';
      els.area.innerHTML = p.bins.map(b =>
        `<button class="bin ${b.cls || ''}" data-bin="${b.id}" aria-label="${b.label}">` +
        `<span class="bin-icon">${b.html}</span><span class="bin-label">${b.label}</span>` +
        `<span class="bin-items">${(state.sorted[b.id] || []).join('')}</span></button>`).join('');
    } else if (p.kind === 'order') {
      const slots = p.items.map((it, i) => state.placed[i]
        ? card(it, 'placed')
        : `<div class="order-slot${i === state.placed.length ? ' now' : ''}">${i + 1}</div>`).join('<span class="arrow">➜</span>');
      els.top.innerHTML = `<div class="order-row">${p.head || ''}${slots}</div>`;
      els.area.innerHTML = state.tiles.filter(t => !state.placed.includes(t))
        .map(t => card(t, '', `data-id="${t.id}"`)).join('');
    } else {
      els.top.innerHTML = `<span class="q-chip">${state.visited.size} of ${p.items.length}</span>`;
      els.area.innerHTML = p.items.map(it =>
        card(it, state.visited.has(it.id) ? 'visited' : '', `data-id="${it.id}"`)).join('');
    }
  }

  // ---------- Flow ----------
  function newProblem() {
    token++;
    busy = false;
    KW.speech.stop();
    let p, tries = 0;
    do { p = generate(picker.level); } while (p.key === lastKey && ++tries < 10);
    lastKey = p.key;
    problem = p;
    state = { phase: 'ask', mistakes: 0, slotMistakes: 0, idx: 0, sorted: {}, placed: [], visited: new Set() };
    if (p.kind === 'order') {
      do { state.tiles = shuffle(p.items.slice()); } while (state.tiles.every((t, i) => t === p.items[i]));
    }
    render();
    els.bubble.textContent = p.text;
    els.next.hidden = true;
    say(firstSay());
  }

  const firstSay = () => (problem.kind === 'sort' ? `${problem.say} ${problem.items[0].label}.` : problem.say);

  async function win(my) {
    state.phase = 'done';
    KW.game.celebrate();
    picker.addStar(state.mistakes === 0);
    els.bubble.textContent = problem.success;
    els.next.hidden = false;
    await say(problem.success);
    if (my === token) busy = false;
  }

  // One wrong try; after two on the same step the right answer glows.
  function missed(glowSelector) {
    state.mistakes++;
    state.slotMistakes++;
    KW.sound.oops();
    if (state.slotMistakes >= 2) {
      const right = els.area.querySelector(glowSelector);
      if (right) right.classList.add('glow');
    }
  }

  async function onPick(btn) {
    const my = token;
    const id = btn.dataset.id;
    const item = problem.options.find(o => o.id === id);
    busy = true;
    replay(btn, 'talk');
    await say(item.label, { quick: true });
    if (my !== token) return;
    if (id === problem.answer) {
      btn.classList.add('right');
      await win(my);
      return;
    }
    btn.classList.add('wrong');
    btn.disabled = true;
    missed(`[data-id="${problem.answer}"]`);
    await say(problem.wrongSay(id));
    if (my === token) busy = false;
  }

  async function onSort(btn) {
    const my = token;
    const item = problem.items[state.idx];
    const bin = btn.dataset.bin;
    busy = true;
    if (item.bin === bin) {
      KW.sound.pop();
      (state.sorted[bin] = state.sorted[bin] || []).push(item.html);
      state.idx++;
      state.slotMistakes = 0;
      render();
      if (state.idx === problem.items.length) { await win(my); return; }
      busy = false;
      say(problem.items[state.idx].label, { quick: true });
      return;
    }
    replay(btn, 'shake');
    missed(`[data-bin="${item.bin}"]`);
    els.bubble.textContent = item.why || problem.text;
    await say(item.why || 'Try the other one!');
    if (my === token) { busy = false; els.bubble.textContent = problem.text; }
  }

  async function onOrder(btn) {
    const my = token;
    const slot = state.placed.length;
    const want = problem.items[slot];
    busy = true;
    if (btn.dataset.id === want.id) {
      KW.sound.pop();
      state.placed.push(want);
      state.slotMistakes = 0;
      render();
      if (state.placed.length === problem.items.length) { await win(my); return; }
      say(want.label, { quick: true });
      busy = false;
      return;
    }
    replay(btn, 'shake');
    missed(`[data-id="${want.id}"]`);
    await say(problem.hint(slot));
    if (my === token) busy = false;
  }

  async function onExplore(btn) {
    const my = token;
    const item = problem.items.find(it => it.id === btn.dataset.id);
    state.visited.add(item.id);
    KW.sound.ding();
    render();
    els.bubble.textContent = item.fact;
    busy = true;
    await say(`${item.label}! ${item.fact}`);
    if (my !== token) return;
    busy = false;
    if (state.visited.size === problem.items.length && state.phase === 'ask') {
      busy = true;
      await win(my);
    }
  }

  // ---------- Events ----------
  els.area.addEventListener('click', e => {
    if (!problem || state.phase !== 'ask') return;
    const btn = e.target.closest('[data-id], [data-bin]');
    if (!btn) return;
    if (problem.kind === 'explore') {
      // Exploring is free: a new tap simply interrupts the last fact.
      onExplore(btn);
      return;
    }
    if (busy) return;
    if (problem.kind === 'pick') onPick(btn);
    else if (problem.kind === 'sort') onSort(btn);
    else onOrder(btn);
  });
  els.top.addEventListener('click', e => {
    const b = e.target.closest('[data-say]');
    if (b) KW.speech.say(b.dataset.say);
  });
  els.next.addEventListener('click', newProblem);
  els.repeat.addEventListener('click', () => {
    if (!problem) return;
    if (state.phase === 'done') KW.speech.say(problem.success);
    else if (problem.kind === 'sort') KW.speech.say(`${problem.say} ${problem.items[state.idx].label}.`);
    else KW.speech.say(problem.say);
  });

  KW.game.onStart(els.overlay, els.play, () => {
    started = true;
    say(firstSay());
  });

  picker = KW.game.levelPicker({ el: els.levels, levels: KW.levelsOf(key), key, onChange: newProblem });
  KW.ui.bindSoundToggle($('soundBtn'));
  KW.ui.updateStars();
  newProblem();
};
