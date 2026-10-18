// Space Explorer: day and night, meet the eight planets, find a planet from
// a clue, compare sizes, and put planets in order from the Sun.
(function () {
  'use strict';

  const { shuffle } = KW.util;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const item = (id, html, label, extra) => Object.assign({ id, html, label }, extra);

  // r = real radius in km (used to compare sizes); size = drawing size in px.
  const PLANETS = [
    { id: 'mercury', name: 'Mercury', r: 2440, size: 30, clue: 'the planet closest to the Sun',
      fact: 'Mercury is the smallest planet, and the closest to the Sun.' },
    { id: 'venus', name: 'Venus', r: 6052, size: 48, clue: 'the hottest planet',
      fact: 'Venus is the hottest planet. It is covered in thick clouds.' },
    { id: 'earth', name: 'Earth', r: 6371, size: 50, clue: 'our home planet',
      fact: 'Earth is our home! It has oceans, trees, animals and people.' },
    { id: 'mars', name: 'Mars', r: 3390, size: 38, clue: 'the red planet',
      fact: 'Mars is the red planet. It is covered in red dust and has giant volcanoes.' },
    { id: 'jupiter', name: 'Jupiter', r: 69911, size: 70, clue: 'the biggest planet',
      fact: 'Jupiter is the biggest planet. It has a giant storm called the Great Red Spot.' },
    { id: 'saturn', name: 'Saturn', r: 58232, size: 62, clue: 'the planet with big rings',
      fact: 'Saturn has beautiful rings made of ice and rock.' },
    { id: 'uranus', name: 'Uranus', r: 25362, size: 56, clue: 'the planet that spins on its side',
      fact: 'Uranus is an icy blue-green planet that spins on its side.' },
    { id: 'neptune', name: 'Neptune', r: 24622, size: 55, clue: 'the planet farthest from the Sun',
      fact: 'Neptune is the farthest planet from the Sun. It is very cold and windy.' }
  ];
  const ball = (p, scale = 1) => `<span class="planet ${p.id}" style="--s:${Math.round(p.size * scale)}px"></span>`;
  const planetItem = (p, scale) => item(p.id, ball(p, scale), p.name, { fact: p.fact });

  const DAY_NIGHT = {
    say: 'Day or night?', text: 'Day or night?',
    bins: [{ id: 'day', html: '☀️', label: 'Day', cls: 'day' }, { id: 'night', html: '🌙', label: 'Night', cls: 'night' }],
    items: [
      ['☀️', 'Sun', 'day', 'The Sun shines in the day.'], ['🌈', 'rainbow', 'day', 'Rainbows come when the Sun shines after rain.'],
      ['🌻', 'sunflower', 'day', 'Sunflowers open up in the sunny day.'], ['🐓', 'rooster', 'day', 'Roosters crow when the Sun comes up.'],
      ['🦋', 'butterfly', 'day', 'Butterflies fly in the warm sunny day.'], ['🌙', 'Moon', 'night', 'We usually see the Moon at night.'],
      ['⭐', 'stars', 'night', 'Stars twinkle in the dark night sky.'], ['🦉', 'owl', 'night', 'Owls wake up at night.'],
      ['🦇', 'bat', 'night', 'Bats fly at night.'], ['🛌', 'bedtime', 'night', 'We sleep at night.']
    ]
  };

  function generate(lv) {
    switch (lv) {
      case 1: {
        const [a, b] = DAY_NIGHT.bins.map(bin => shuffle(DAY_NIGHT.items.filter(i => i[2] === bin.id)).slice(0, 3));
        return {
          kind: 'sort', key: 'dn' + Math.random(), say: DAY_NIGHT.say, text: DAY_NIGHT.text, bins: DAY_NIGHT.bins,
          items: shuffle([...a, ...b]).map(([html, label, bin, why]) => item(label, html, label, { bin, why })),
          success: 'You sorted the day and the night!'
        };
      }
      case 2:
        return {
          kind: 'explore', key: 'explore' + Math.random(),
          items: PLANETS.map(p => planetItem(p, 1)),
          say: 'Tap every planet to visit it!', text: 'Tap every planet to visit it',
          success: 'You visited all eight planets! What an explorer!'
        };
      case 3: {
        const p = pick(PLANETS);
        const others = shuffle(PLANETS.filter(x => x !== p)).slice(0, 2);
        return {
          kind: 'pick', key: p.id, answer: p.id,
          show: '<span class="q-show">🔭</span>',
          say: `Find ${p.clue}!`, text: `Find ${p.clue}`,
          options: shuffle([p, ...others]).map(x => planetItem(x, 1)),
          wrongSay: id => {
            const x = PLANETS.find(q => q.id === id);
            return `That's ${x.name}. ${x.fact} Try again!`;
          },
          success: `Yes! ${p.name} is ${p.clue}!`
        };
      }
      case 4: {
        // Two planets that are clearly different in size (at least 30%).
        let a, b;
        do { [a, b] = shuffle(PLANETS.slice()).slice(0, 2); } while (Math.max(a.r, b.r) / Math.min(a.r, b.r) < 1.3);
        const bigger = Math.random() < 0.5;
        const ans = (a.r > b.r) === bigger ? a : b;
        const other = ans === a ? b : a;
        const word = bigger ? 'bigger' : 'smaller';
        return {
          kind: 'pick', key: a.id + b.id, answer: ans.id,
          show: `<span class="q-show">${bigger ? '🐘' : '🐭'}</span>`,
          say: `Which planet is ${word}?`, text: `Which planet is ${word}?`,
          options: [a, b].map(x => planetItem(x, 1.6)),
          wrongSay: () => `${other.name} is ${bigger ? 'smaller' : 'bigger'}. Look again!`,
          success: `Yes! ${ans.name} is ${word} than ${other.name}!`
        };
      }
      default: {
        // The four rocky planets, or the four giants after Mars.
        const inner = Math.random() < 0.6;
        const set = inner ? PLANETS.slice(0, 4) : PLANETS.slice(4);
        const head = inner
          ? `<span class="order-head">${ball({ id: 'sun', size: 70 })}</span>`
          : `<span class="order-head">${ball({ id: 'sun', size: 50 })}${ball(PLANETS[3], 0.6)}</span>`;
        const nth = ['first', 'second', 'third', 'fourth'];
        return {
          kind: 'order', key: inner ? 'inner' : 'outer', head,
          items: set.map(p => planetItem(p, 0.8)),
          say: inner ? 'Put the planets in order, starting next to the Sun!' : 'Now the giant planets! Put them in order after Mars.',
          text: inner ? 'Put them in order from the Sun' : 'The giants, in order after Mars',
          hint: slot => `The ${nth[slot]} one is ${set[slot].name}.`,
          success: `${set.map(p => p.name).join(', ')}! You know the order!`
        };
      }
    }
  }

  KW.quiz({ key: 'space', generate });
})();
