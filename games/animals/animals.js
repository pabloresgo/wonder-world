// Animal World (nature): where animals live, what they eat, sorting by how
// they move or what covers them, how living things grow, and alive or not.
(function () {
  'use strict';

  const { shuffle } = KW.util;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const item = (id, html, label, extra) => Object.assign({ id, html, label }, extra);

  const HOMES = {
    ocean:  { html: '🌊', label: 'Ocean', where: 'in the ocean' },
    farm:   { html: '🚜', label: 'Farm', where: 'on the farm' },
    forest: { html: '🌲', label: 'Forest', where: 'in the forest' },
    snow:   { html: '❄️', label: 'Snow and ice', where: 'in the snow and ice' },
    desert: { html: '🏜️', label: 'Desert', where: 'in the desert' },
    jungle: { html: '🌴', label: 'Jungle', where: 'in the jungle' }
  };
  const LIVES = [
    ['🐳', 'whale', 'ocean'], ['🐙', 'octopus', 'ocean'], ['🦈', 'shark', 'ocean'], ['🦀', 'crab', 'ocean'], ['🐬', 'dolphin', 'ocean'],
    ['🐄', 'cow', 'farm'], ['🐖', 'pig', 'farm'], ['🐑', 'sheep', 'farm'], ['🐔', 'hen', 'farm'], ['🐴', 'horse', 'farm'],
    ['🦊', 'fox', 'forest'], ['🦉', 'owl', 'forest'], ['🦌', 'deer', 'forest'], ['🐿️', 'squirrel', 'forest'], ['🦔', 'hedgehog', 'forest'],
    ['🐧', 'penguin', 'snow'], ['🐻‍❄️', 'polar bear', 'snow'], ['🦭', 'seal', 'snow'],
    ['🐪', 'camel', 'desert'], ['🦂', 'scorpion', 'desert'], ['🦎', 'lizard', 'desert'],
    ['🐒', 'monkey', 'jungle'], ['🦜', 'parrot', 'jungle'], ['🐅', 'tiger', 'jungle'], ['🦍', 'gorilla', 'jungle']
  ];

  // [animal, name, sentence, food emoji, food]
  const EATS = [
    ['🐰', 'rabbit', 'Rabbits eat carrots', '🥕', 'carrots'], ['🐒', 'monkey', 'Monkeys eat bananas', '🍌', 'bananas'],
    ['🐝', 'bee', 'Bees drink nectar from flowers', '🌸', 'flowers'], ['🐼', 'panda', 'Pandas eat bamboo', '🎋', 'bamboo'],
    ['🐄', 'cow', 'Cows eat grass', '🌿', 'grass'], ['🐿️', 'squirrel', 'Squirrels eat nuts', '🌰', 'nuts'],
    ['🐦', 'bird', 'Many birds eat worms', '🪱', 'worms'], ['🐻', 'bear', 'Bears love honey', '🍯', 'honey'],
    ['🐨', 'koala', 'Koalas eat leaves', '🍃', 'leaves'], ['🐔', 'hen', 'Hens eat corn', '🌽', 'corn']
  ];

  const SORTS = [
    { say: 'Does it fly or swim?', text: 'Fly or swim?',
      bins: [{ id: 'fly', html: '☁️', label: 'Fly', cls: 'a' }, { id: 'swim', html: '💧', label: 'Swim', cls: 'b' }],
      items: [
        ['🦅', 'eagle', 'fly', 'Eagles fly high in the sky.'], ['🦋', 'butterfly', 'fly', 'Butterflies fly with their wings.'],
        ['🐝', 'bee', 'fly', 'Bees fly from flower to flower.'], ['🦉', 'owl', 'fly', 'Owls fly at night.'],
        ['🦇', 'bat', 'fly', 'Bats can fly!'], ['🐟', 'fish', 'swim', 'Fish swim in the water.'],
        ['🐬', 'dolphin', 'swim', 'Dolphins swim in the ocean.'], ['🐙', 'octopus', 'swim', 'Octopuses swim in the sea.'],
        ['🐳', 'whale', 'swim', 'Whales swim in the ocean.'], ['🐧', 'penguin', 'swim', "Penguins can't fly, but they swim really well!"]
      ] },
    { say: 'Does it have fur or feathers?', text: 'Fur or feathers?',
      bins: [{ id: 'fur', html: '🧸', label: 'Fur', cls: 'a' }, { id: 'feathers', html: '🪶', label: 'Feathers', cls: 'b' }],
      items: [
        ['🐶', 'dog', 'fur', 'Dogs are covered in soft fur.'], ['🐻', 'bear', 'fur', 'Bears have thick fur.'],
        ['🐱', 'cat', 'fur', 'Cats have fur.'], ['🐰', 'rabbit', 'fur', 'Rabbits have fluffy fur.'],
        ['🦊', 'fox', 'fur', 'Foxes have fur.'], ['🐑', 'sheep', 'fur', 'Sheep have woolly fur.'],
        ['🐔', 'hen', 'feathers', 'Hens have feathers.'], ['🦆', 'duck', 'feathers', 'Ducks have feathers.'],
        ['🦉', 'owl', 'feathers', 'Owls have feathers.'], ['🐧', 'penguin', 'feathers', 'Penguins are birds, so they have feathers.'],
        ['🦜', 'parrot', 'feathers', 'Parrots have colorful feathers.']
      ] }
  ];

  const ALIVE = {
    say: 'Is it alive?', text: 'Alive or not alive?',
    bins: [{ id: 'yes', html: '🌱', label: 'Alive', cls: 'a' }, { id: 'no', html: '🪨', label: 'Not alive', cls: 'b' }],
    items: [
      ['🐶', 'dog', 'yes', 'A dog is alive. It eats, breathes and grows.'], ['🌳', 'tree', 'yes', 'A tree is alive. It drinks water and grows.'],
      ['🌻', 'flower', 'yes', 'A flower is alive. It grows from a seed.'], ['🐟', 'fish', 'yes', 'A fish is alive. It eats and grows.'],
      ['🧒', 'child', 'yes', 'You are alive! You eat, breathe and grow.'], ['🍄', 'mushroom', 'yes', 'A mushroom is alive. It grows!'],
      ['🐝', 'bee', 'yes', 'A bee is alive.'], ['🪨', 'rock', 'no', "A rock is not alive. It doesn't eat or grow."],
      ['🚗', 'car', 'no', "A car moves, but it isn't alive. It doesn't grow."], ['🧸', 'teddy bear', 'no', 'A teddy bear is not alive.'],
      ['⚽', 'ball', 'no', 'A ball is not alive.'], ['🤖', 'robot', 'no', "A robot can move, but it isn't alive. It doesn't grow."],
      ['☁️', 'cloud', 'no', "A cloud moves, but it isn't alive."], ['🏠', 'house', 'no', 'A house is not alive.']
    ]
  };

  const CYCLES = [
    { name: 'a hen', steps: [['🥚', 'egg'], ['🐣', 'hatching'], ['🐥', 'chick'], ['🐔', 'hen']] },
    { name: 'a flower', steps: [['🌰', 'seed'], ['🌱', 'sprout'], ['🌿', 'plant'], ['🌻', 'flower']] },
    { name: 'a butterfly', steps: [['🥚', 'egg'], ['🐛', 'caterpillar'], ['🦋', 'butterfly']] },
    { name: 'a tree', steps: [['🌰', 'acorn'], ['🌱', 'sprout'], ['🌳', 'tree']] },
    { name: 'a person', steps: [['👶', 'baby'], ['🧒', 'child'], ['🧑', 'grown-up'], ['🧓', 'grandparent']] }
  ];

  // A round of 6 pictures to sort, half in each group.
  function sortRound(s, key) {
    const [a, b] = s.bins.map(bin => shuffle(s.items.filter(i => i[2] === bin.id)).slice(0, 3));
    return {
      kind: 'sort', key, say: s.say, text: s.text, bins: s.bins,
      items: shuffle([...a, ...b]).map(([html, label, bin, why]) => item(label, html, label, { bin, why })),
      success: 'You sorted them all!'
    };
  }

  function generate(lv) {
    switch (lv) {
      case 1: {
        const [html, name, home] = pick(LIVES);
        const others = shuffle(Object.keys(HOMES).filter(h => h !== home)).slice(0, 2);
        return {
          kind: 'pick', key: name, answer: home,
          show: `<button class="q-card big" data-say="${name}"><span class="pic">${html}</span><span class="label">${name}</span></button>`,
          say: `Where does the ${name} live?`, text: `Where does the ${name} live?`,
          options: shuffle([home, ...others]).map(h => item(h, HOMES[h].html, HOMES[h].label)),
          wrongSay: h => `The ${name} doesn't live ${HOMES[h].where}. Try again!`,
          success: `Yes! The ${name} lives ${HOMES[home].where}!`
        };
      }
      case 2: {
        const e = pick(EATS);
        const others = shuffle(EATS.filter(x => x !== e)).slice(0, 2);
        return {
          kind: 'pick', key: e[1], answer: e[4],
          show: `<button class="q-card big" data-say="${e[1]}"><span class="pic">${e[0]}</span><span class="label">${e[1]}</span></button>`,
          say: `What does the ${e[1]} eat?`, text: `What does the ${e[1]} eat?`,
          options: shuffle([e, ...others]).map(x => item(x[4], x[3], x[4])),
          wrongSay: f => `Hmm, the ${e[1]} doesn't eat ${f}. Try again!`,
          success: `Yes! ${e[2]}!`
        };
      }
      case 3: {
        const i = Math.floor(Math.random() * SORTS.length);
        return sortRound(SORTS[i], 'sort' + i + Math.random());
      }
      case 4: {
        const c = pick(CYCLES);
        const items = c.steps.map(([html, label], i) => item(label + i, html, label));
        return {
          kind: 'order', key: c.name, items,
          say: `How does ${c.name} grow? Put them in order.`, text: `How does ${c.name} grow?`,
          hint: slot => slot === 0 ? `What comes first? The ${items[0].label}!` : `What comes next, after the ${items[slot - 1].label}?`,
          success: `Yes! ${items.map(it => it.label).join(', then ')}!`
        };
      }
      default:
        return sortRound(ALIVE, 'alive' + Math.random());
    }
  }

  KW.quiz({ key: 'animals', generate });
})();
