// Make a Creature: mix body, eyes, mouth, head, arms, legs, color and
// pattern. Each option button shows the creature with that part swapped in,
// so he can see the choice before tapping it.
(function () {
  'use strict';

  const TABS = [
    { key: 'body',    icon: '🫧', label: 'Body' },
    { key: 'eyes',    icon: '👀', label: 'Eyes' },
    { key: 'mouth',   icon: '👄', label: 'Mouth' },
    { key: 'top',     icon: '🦄', label: 'Head' },
    { key: 'arms',    icon: '🦋', label: 'Arms' },
    { key: 'legs',    icon: '🦶', label: 'Legs' },
    { key: 'color',   icon: '🎨', label: 'Color' },
    { key: 'pattern', icon: '🔵', label: 'Pattern' }
  ];
  const MAX_SAVED = 24;

  const $ = id => document.getElementById(id);
  const C = KW.creature;

  let creature = KW.store.get('creature:current', null) || C.random();
  let tab = 'body';

  function renderCreature(anim) {
    const poke = $('poke');
    poke.innerHTML = C.render(creature);
    $('name').textContent = creature.name;
    if (anim) {
      poke.classList.remove('bounce', 'wiggle');
      void poke.offsetWidth;
      poke.classList.add(anim);
    }
    KW.store.set('creature:current', creature);
  }

  function renderTabs() {
    $('tabs').innerHTML = TABS.map(t =>
      `<button class="part-tab${t.key === tab ? ' active' : ''}" data-tab="${t.key}" aria-pressed="${t.key === tab}">` +
      `${t.icon}<small>${t.label}</small></button>`).join('');
  }

  function renderOptions() {
    const values = C.PARTS[tab];
    $('options').innerHTML = values.map(v => {
      const active = creature[tab] === v ? ' active' : '';
      if (tab === 'color') {
        return `<button class="option color${active}" data-v="${v}" style="background:${v}" aria-label="Color"></button>`;
      }
      return `<button class="option${active}" data-v="${v}" aria-label="${v}">` +
             C.render(Object.assign({}, creature, { [tab]: v }), { size: 90 }) + '</button>';
    }).join('');
  }

  function set(key, value) {
    creature = Object.assign({}, creature, { [key]: value });
    KW.sound.pop();
    renderCreature('bounce');
    renderOptions();
  }

  function hello() {
    KW.sound.unlock();
    const p = C.pitch(creature);
    KW.sound.slide(300 * p, 700 * p, 0.25);
    renderCreature('wiggle');
    KW.speech.say(`Hi! I'm ${creature.name}!`, { pitch: p });
  }

  // ---------- My creatures ----------
  const loadSaved = () => KW.store.get('creatures', []);

  function renderStrip() {
    const list = loadSaved().slice().reverse();
    $('strip').innerHTML = list.length
      ? list.map(c => `<div class="saved">
          <button class="load" data-load="${c.id}" aria-label="${c.name}">${C.render(c, { size: 108 })}</button>
          ${c.name}
          <button class="del" data-del="${c.id}" aria-label="Let ${c.name} go">✖</button></div>`).join('')
      : '<p class="strip-empty">Tap 💾 Save to keep your creature here.</p>';
  }

  function save() {
    KW.sound.unlock();
    const list = loadSaved();
    list.push(Object.assign({}, creature, { id: Date.now() }));
    while (list.length > MAX_SAVED) list.shift();
    KW.store.set('creatures', list);
    KW.stars.add(1);
    KW.progress.made('creature');
    KW.ui.updateStars();
    KW.ui.confetti();
    KW.sound.win();
    renderStrip();
    renderCreature('wiggle');
    KW.speech.say(`Saved! ${creature.name} lives in your creature house now.`);
  }

  // ---------- Events ----------
  $('tabs').addEventListener('click', e => {
    const b = e.target.closest('[data-tab]');
    if (!b) return;
    tab = b.dataset.tab;
    KW.sound.unlock();
    renderTabs();
    renderOptions();
  });
  $('options').addEventListener('click', e => {
    const b = e.target.closest('[data-v]');
    if (b) { KW.sound.unlock(); set(tab, b.dataset.v); }
  });
  $('poke').addEventListener('click', hello);
  $('renameBtn').addEventListener('click', () => {
    creature = Object.assign({}, creature, { name: C.makeName() });
    hello();
  });
  $('randomBtn').addEventListener('click', () => {
    KW.sound.unlock();
    creature = C.random();
    renderOptions();
    hello();
  });
  $('saveBtn').addEventListener('click', save);
  $('strip').addEventListener('click', e => {
    const load = e.target.closest('[data-load]');
    const del = e.target.closest('[data-del]');
    if (load) {
      const c = loadSaved().find(x => String(x.id) === load.dataset.load);
      if (!c) return;
      creature = Object.assign({}, c);
      delete creature.id;
      renderOptions();
      hello();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (del) {
      if (!del.classList.contains('sure')) {
        del.classList.add('sure');
        del.textContent = 'Bye?';
        return;
      }
      KW.store.set('creatures', loadSaved().filter(x => String(x.id) !== del.dataset.del));
      renderStrip();
    }
  });

  KW.ui.bindSoundToggle($('soundBtn'));
  KW.ui.updateStars();
  renderCreature();
  renderTabs();
  renderOptions();
  renderStrip();
})();
