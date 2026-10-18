// Story Maker: pick a hero, a place, a friend and what happens, and the
// owl reads back a six-page picture book made from those choices.
// Creatures saved in Make a Creature can be the hero too.
(function () {
  'use strict';

  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  const HEROES = [
    { id: 'dog',   emoji: '🐶', label: 'Puppy',     kind: 'puppy',          names: ['Max', 'Biscuit', 'Rocket'] },
    { id: 'dino',  emoji: '🦖', label: 'Dino',      kind: 'little dinosaur', names: ['Rex', 'Stomp', 'Pebbles'] },
    { id: 'robot', emoji: '🤖', label: 'Robot',     kind: 'robot',          names: ['Beep', 'Bolt', 'Zip'] },
    { id: 'cat',   emoji: '🐱', label: 'Kitten',    kind: 'kitten',         names: ['Luna', 'Mimi', 'Whiskers'] },
    { id: 'astro', emoji: '🧑‍🚀', label: 'Astronaut', kind: 'space explorer', names: ['Nova', 'Comet', 'Sky'] },
    { id: 'hero',  emoji: '🦸', label: 'Superhero', kind: 'superhero',      names: ['Captain Zoom', 'Flash Kid'] }
  ];

  const PLACES = [
    { id: 'forest', emoji: '🌲', label: 'Forest', phrase: 'in a big green forest', thing: 'big mushroom',
      bg: 'linear-gradient(#bfe8ff 0 60%, #7ed957 60%)', deco: ['🌲', '🌳', '☁️', '🍄'] },
    { id: 'ocean', emoji: '🌊', label: 'Ocean', phrase: 'by the sparkly blue ocean', thing: 'sand castle',
      bg: 'linear-gradient(#aee3ff 0 45%, #3d8bfd 45% 70%, #ffe2a8 70%)', deco: ['🐚', '⛵', '☀️', '🐠'] },
    { id: 'moon', emoji: '🌙', label: 'Moon', phrase: 'up on the bumpy moon', thing: 'moon rock',
      bg: 'linear-gradient(#1b1440 0 65%, #c9ccd6 65%)', deco: ['🪨', '🛸', '🪐', '⭐'] },
    { id: 'castle', emoji: '🏰', label: 'Castle', phrase: 'in a tall pink castle', thing: 'golden throne',
      bg: 'linear-gradient(#ffe1f0 0 65%, #d9b8ff 65%)', deco: ['🏰', '🌷', '☁️', '🚩'] },
    { id: 'city', emoji: '🏙️', label: 'City', phrase: 'in a busy, noisy city', thing: 'red bus',
      bg: 'linear-gradient(#d6ecff 0 62%, #9aa5c0 62%)', deco: ['🏢', '🚕', '☁️', '🚦'] },
    { id: 'jungle', emoji: '🌴', label: 'Jungle', phrase: 'deep in the jungle', thing: 'banana tree',
      bg: 'linear-gradient(#c8f5d0 0 60%, #3fb36a 60%)', deco: ['🌴', '🌺', '🦜', '🐒'] }
  ];

  const FRIENDS = [
    { id: 'bunny', emoji: '🐰', label: 'Bunny', name: 'Hoppy', kind: 'bunny' },
    { id: 'owl', emoji: '🦉', label: 'Owl', name: 'Hoot', kind: 'owl' },
    { id: 'turtle', emoji: '🐢', label: 'Turtle', name: 'Shelly', kind: 'turtle' },
    { id: 'elephant', emoji: '🐘', label: 'Elephant', name: 'Peanut', kind: 'elephant' },
    { id: 'unicorn', emoji: '🦄', label: 'Unicorn', name: 'Sparkle', kind: 'unicorn' },
    { id: 'bear', emoji: '🐻', label: 'Bear', name: 'Bruno', kind: 'bear' }
  ];

  const PROBLEMS = [
    { id: 'lost', emoji: '🧸', label: 'Lost toy', setupProp: '❓', solveProp: '🧸',
      setup: n => `${n} could not find a favorite teddy bear anywhere!`,
      feeling: 'sad', feelEmoji: '😢', quote: 'Where did my teddy go?',
      solve: (n, f, p) => `${f} looked high and low. "Look! There it is, behind the ${p.thing}!"`,
      ending: 'gave the teddy a great big hug' },
    { id: 'storm', emoji: '⛈️', label: 'Big storm', setupProp: '⛈️', solveProp: '🌈',
      setup: () => 'dark clouds rolled in. BOOM! went the thunder!',
      feeling: 'scared', feelEmoji: '😨', quote: "I don't like thunder!",
      solve: (n, f) => `${f} said, "Let's count while we wait! One, two, three..." When they got to ten, the storm was gone, and a rainbow came out!`,
      ending: 'danced under the rainbow' },
    { id: 'hungry', emoji: '🍎', label: 'Hungry', setupProp: '🍽️', solveProp: '🧺',
      setup: n => `${n}'s tummy went rumble, rumble, rumble!`,
      feeling: 'very hungry', feelEmoji: '😋', quote: 'I need a snack!',
      solve: (n, f) => `${f} had a picnic basket. Inside were 3 apples and 2 cookies. 3 and 2 make 5 snacks to share!`,
      ending: 'shared every last crumb' },
    { id: 'dragon', emoji: '🐉', label: 'A dragon!', setupProp: '🐉', solveProp: '🐉',
      setup: () => 'a big dragon landed with a THUMP!',
      feeling: 'surprised', feelEmoji: '😲', quote: 'Oh my! A dragon!',
      solve: (n, f) => `But the dragon just smiled. "Hello! I'm lonely. Will you play with me?" "Yes!" said ${n} and ${f}.`,
      ending: 'played tag with their new dragon friend' },
    { id: 'party', emoji: '🎂', label: 'Birthday', setupProp: '🎈', solveProp: '🎂',
      setup: n => `it was ${n}'s birthday, but nobody said happy birthday.`,
      feeling: 'a little sad', feelEmoji: '🥺', quote: 'Did everyone forget?',
      solve: (n, f) => `Then ${f} jumped out and shouted, "SURPRISE!" There was a big cake with ${4 + Math.floor(Math.random() * 3)} candles!`,
      ending: 'ate cake and sang songs all day' },
    { id: 'treasure', emoji: '💎', label: 'Treasure', setupProp: '🗺️', solveProp: '💎',
      setup: n => `${n} found an old map with a big red X on it!`,
      feeling: 'excited', feelEmoji: '🤩', quote: "A treasure map! Let's go!",
      solve: (n, f) => `${f} helped follow the map. Ten steps this way, two steps that way... and there it was! A chest full of sparkly jewels!`,
      ending: 'shared the treasure with all their friends' }
  ];

  const STEPS = [
    { key: 'hero', q: 'Who is the hero?' },
    { key: 'place', q: 'Where do they live?' },
    { key: 'friend', q: 'Who is their friend?' },
    { key: 'problem', q: 'What happens?' }
  ];

  const $ = id => document.getElementById(id);
  let step = 0;
  let picks = {};
  let pages = [];
  let page = 0;
  let started = false;
  let starGiven = false;

  // His saved creatures can be heroes too (newest three).
  function heroOptions() {
    const mine = KW.store.get('creatures', []).slice(-3).reverse().map(c => ({
      id: 'c' + c.id, creature: c, label: c.name, kind: 'creature', names: [c.name]
    }));
    // With his name set in the parent corner, he can be the hero himself.
    const name = KW.store.get('childName', '');
    const me = name ? [{ id: 'me', emoji: '🧒', label: name, kind: 'brave kid', names: [name] }] : [];
    return me.concat(mine, HEROES);
  }

  function optionsFor(key) {
    return { hero: heroOptions(), place: PLACES, friend: FRIENDS, problem: PROBLEMS }[key];
  }

  const art = (item, size) => item.creature ? KW.creature.render(item.creature, { size }) : item.emoji;

  function say(text) {
    if (started) KW.speech.say(text);
  }

  // ---------- Choosing ----------
  function renderBuilder() {
    const s = STEPS[step];
    $('picked').innerHTML = STEPS.map((st, i) => {
      const p = picks[st.key];
      return `<button class="slot${p ? '' : ' empty'}${i === step ? ' now' : ''}" data-step="${i}" aria-label="${st.q}">` +
             (p ? art(p, 56) : i + 1) + '</button>';
    }).join('');
    const done = STEPS.every(st => picks[st.key]);
    $('question').textContent = s ? s.q : 'Ready? Tap to hear your story!';
    $('choices').hidden = step === STEPS.length;
    if (step < STEPS.length) {
      $('choices').innerHTML = optionsFor(s.key).map(o =>
        `<button class="story-card${picks[s.key] && picks[s.key].id === o.id ? ' chosen' : ''}" data-id="${o.id}">` +
        `<span class="big">${art(o, 84)}</span>${o.label}</button>`).join('');
    }
    $('tellBtn').hidden = !done;
    $('backBtn').style.visibility = step > 0 ? 'visible' : 'hidden';
  }

  function goStep(i) {
    step = i;
    renderBuilder();
    say(step < STEPS.length ? STEPS[step].q : 'Ready? Tap to hear your story!');
  }

  function choose(id) {
    const s = STEPS[step];
    const item = optionsFor(s.key).find(o => o.id === id);
    if (!item) return;
    picks[s.key] = item;
    KW.sound.pop();
    renderBuilder();
    KW.speech.say(item.label);
    setTimeout(() => {
      // Jump to the next step that still needs a choice.
      const next = STEPS.findIndex(st => !picks[st.key]);
      goStep(next === -1 ? STEPS.length : next);
    }, 700);
  }

  // ---------- Writing the story ----------
  function makeStory() {
    const { hero, place, friend, problem } = picks;
    const name = pick(hero.names);
    const f = friend.name;
    const a = hero.kind === 'creature' ? 'a creature' : `a ${hero.kind}`;
    return [
      { text: `Once upon a time, there was ${a} named ${name}. ${name} lived ${place.phrase}.`, hero: true },
      { text: `One day, ${problem.setup(name)}`, hero: true, prop: problem.setupProp },
      { text: `${name} felt ${problem.feeling}. "${problem.quote}"`, hero: true, feeling: problem.feelEmoji },
      { text: `Just then, ${f} the ${friend.kind} came along. "Don't worry, ${name}. I can help!"`, hero: true, friend: true },
      { text: problem.solve(name, f, place), hero: true, friend: true, prop: problem.solveProp },
      { text: `And so ${name} and ${f} ${problem.ending}. The end!`, hero: true, friend: true, prop: '🎉' }
    ];
  }

  const DECO_SPOTS = ['left:3%;bottom:4%', 'right:4%;bottom:5%', 'right:8%;top:8%', 'left:6%;top:9%'];

  function renderPage() {
    const pg = pages[page];
    const { hero, place, friend } = picks;
    const scene = $('scene');
    scene.style.background = place.bg;
    scene.innerHTML =
      place.deco.map((d, i) => `<span class="deco" style="${DECO_SPOTS[i]}">${d}</span>`).join('') +
      (pg.prop ? `<div class="actor prop">${pg.prop}</div>` : '') +
      (pg.hero ? `<div class="actor hero">${art(hero, 200)}</div>` : '') +
      (pg.feeling ? `<div class="feeling">${pg.feeling}</div>` : '') +
      (pg.friend ? `<div class="actor friend">${friend.emoji}</div>` : '');
    $('pageText').textContent = pg.text;
    $('dots').innerHTML = pages.map((_, i) => `<span class="${i <= page ? 'on' : ''}"></span>`).join('');
    $('prevBtn').style.visibility = page > 0 ? 'visible' : 'hidden';
    const last = page === pages.length - 1;
    $('nextPageBtn').hidden = last;
    $('bookEnd').hidden = !last;
    if (last && !starGiven) {
      starGiven = true;
      KW.stars.add(1);
      KW.progress.made('story');
      KW.ui.updateStars();
      KW.game.celebrate();
    }
    say(pg.text);
  }

  function openBook() {
    pages = makeStory();
    page = 0;
    starGiven = false;
    $('builder').hidden = true;
    $('book').hidden = false;
    KW.sound.ding();
    renderPage();
  }

  function newStory() {
    picks = {};
    $('book').hidden = true;
    $('builder').hidden = false;
    goStep(0);
  }

  // ---------- Events ----------
  $('choices').addEventListener('click', e => {
    const b = e.target.closest('[data-id]');
    if (b) choose(b.dataset.id);
  });
  $('picked').addEventListener('click', e => {
    const b = e.target.closest('[data-step]');
    if (b) goStep(+b.dataset.step);
  });
  $('backBtn').addEventListener('click', () => { if (step > 0) goStep(step - 1); });
  $('tellBtn').addEventListener('click', openBook);
  $('nextPageBtn').addEventListener('click', () => { if (page < pages.length - 1) { page++; KW.sound.pop(); renderPage(); } });
  $('prevBtn').addEventListener('click', () => { if (page > 0) { page--; renderPage(); } });
  $('againBtn').addEventListener('click', () => { page = 0; renderPage(); });
  $('newBtn').addEventListener('click', newStory);
  $('repeatBtn').addEventListener('click', () => {
    if (!$('book').hidden) KW.speech.say(pages[page].text);
    else KW.speech.say(step < STEPS.length ? STEPS[step].q : 'Ready? Tap to hear your story!');
  });

  KW.game.onStart($('startOverlay'), $('playBtn'), () => {
    started = true;
    say(STEPS[step].q);
  });

  KW.ui.bindSoundToggle($('soundBtn'));
  KW.ui.updateStars();
  renderBuilder();
})();
