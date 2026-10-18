// Weather Watch: read the sky, dress for the weather, hot or cold,
// things that happen in order (water cycle, seasons, a day), and
// what weather makes happen.
(function () {
  'use strict';

  const { shuffle } = KW.util;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const item = (id, html, label, extra) => Object.assign({ id, html, label }, extra);

  // scene: pictures that hint at the weather without showing its own icon
  const WEATHER = [
    { id: 'sunny', html: '☀️', label: 'Sunny', scene: '😎🏖️🌻', say: "It's a bright, hot day." },
    { id: 'rainy', html: '🌧️', label: 'Rainy', scene: '☔💦🐸', say: 'Drip, drop, splash!' },
    { id: 'snowy', html: '❄️', label: 'Snowy', scene: '⛄🛷🧤', say: 'Everything is white and cold.' },
    { id: 'windy', html: '💨', label: 'Windy', scene: '🪁🍃🌬️', say: 'Whoosh! Things are blowing around.' },
    { id: 'cloudy', html: '☁️', label: 'Cloudy', scene: '🌥️🌳🐑', say: 'The Sun is hiding.' },
    { id: 'stormy', html: '⛈️', label: 'Stormy', scene: '⚡🌩️😨', say: 'Flash! Boom!' }
  ];
  const byId = id => WEATHER.find(w => w.id === id);

  // What to wear: [weather, emoji, label]
  const WEAR = [
    ['sunny', '🕶️', 'sunglasses'], ['sunny', '👒', 'sun hat'], ['sunny', '🩳', 'shorts'],
    ['rainy', '☂️', 'umbrella'], ['rainy', '🥾', 'boots'],
    ['snowy', '🧤', 'mittens'], ['snowy', '🧣', 'scarf'], ['snowy', '🧥', 'warm coat']
  ];

  const HOT_COLD = {
    say: 'Hot or cold?', text: 'Hot day or cold day?',
    bins: [{ id: 'hot', html: '🔥', label: 'Hot', cls: 'a' }, { id: 'cold', html: '🥶', label: 'Cold', cls: 'b' }],
    items: [
      ['🍦', 'ice cream', 'hot', 'Ice cream cools us down on a hot day.'], ['🏖️', 'beach', 'hot', 'We go to the beach when it is hot.'],
      ['🩳', 'shorts', 'hot', 'We wear shorts when it is hot.'], ['🍉', 'watermelon', 'hot', 'Cold watermelon is yummy on a hot day.'],
      ['🏊', 'swimming', 'hot', 'Swimming is fun on a hot day.'], ['☀️', 'Sun', 'hot', 'The hot Sun warms everything up.'],
      ['⛄', 'snowman', 'cold', 'Snowmen need cold snow!'], ['🧤', 'mittens', 'cold', 'Mittens keep our hands warm when it is cold.'],
      ['🧣', 'scarf', 'cold', 'A scarf keeps us warm when it is cold.'], ['❄️', 'snowflake', 'cold', 'Snow only falls when it is cold.'],
      ['☕', 'hot cocoa', 'cold', 'Hot cocoa warms us up on a cold day.'], ['🛷', 'sled', 'cold', 'We ride a sled on cold, snowy days.']
    ]
  };

  const ORDERS = [
    { key: 'water', say: 'How does rain happen? Put it in order.', text: 'How does rain happen?',
      steps: [['🌊', 'water'], ['☀️', 'Sun warms it'], ['☁️', 'clouds'], ['🌧️', 'rain']],
      success: 'The Sun warms the water, it goes up and makes clouds, and the clouds rain it back down!' },
    { key: 'seasons', say: 'Put the seasons in order, starting with spring.', text: 'The seasons, starting with spring',
      steps: [['🌸', 'spring'], ['☀️', 'summer'], ['🍂', 'fall'], ['❄️', 'winter']],
      success: 'Spring, summer, fall, winter! Then spring comes again.' },
    { key: 'day', say: 'Put the day in order, from morning to night.', text: 'From morning to night',
      steps: [['🌅', 'sunrise'], ['☀️', 'midday'], ['🌇', 'sunset'], ['🌙', 'night']],
      success: 'Sunrise, midday, sunset, night!' }
  ];

  // Cause and effect: [question, emoji, label, success]
  const HAPPENS = [
    ['It is very, very cold. What happens to the pond?', '🧊', 'ice', 'Yes! When it is very cold, water freezes into ice.'],
    ['The Sun comes out while it is raining. What can we see?', '🌈', 'rainbow', 'Yes! Sun and rain together make a rainbow.'],
    ['Lots and lots of snow fell. What can we build?', '⛄', 'snowman', 'Yes! We can build a snowman.'],
    ['It is very windy. What can fly up high?', '🪁', 'kite', 'Yes! The wind lifts a kite up high.'],
    ['Ice cream sits in the hot Sun. What happens?', '💧', 'it melts', 'Yes! The hot Sun melts the ice cream.'],
    ['Big dark clouds fill the sky. What is coming?', '🌧️', 'rain', 'Yes! Dark clouds often bring rain.'],
    ['It rained all night. What is on the ground in the morning?', '💦', 'puddles', 'Yes! Rain makes puddles to splash in.'],
    ['The wind blows on a tree in the fall. What comes down?', '🍂', 'leaves', 'Yes! In the fall, leaves blow off the trees.']
  ];

  function generate(lv) {
    switch (lv) {
      case 1: {
        const w = pick(WEATHER);
        const others = shuffle(WEATHER.filter(x => x !== w)).slice(0, 2);
        return {
          kind: 'pick', key: w.id, answer: w.id,
          show: `<span class="q-show">${w.scene}</span>`,
          say: `${w.say} What's the weather?`, text: "What's the weather?",
          options: shuffle([w, ...others]).map(x => item(x.id, x.html, x.label)),
          wrongSay: id => `Hmm, does it look ${byId(id).label.toLowerCase()}? ${w.say}`,
          success: `Yes! It's ${w.label.toLowerCase()}!`
        };
      }
      case 2: {
        const [wid, html, label] = pick(WEAR);
        const w = byId(wid);
        const others = shuffle(WEAR.filter(x => x[0] !== wid)).slice(0, 2);
        return {
          kind: 'pick', key: label, answer: label,
          show: `<button class="q-card big" data-say="${w.label}"><span class="pic">${w.html}</span><span class="label">${w.label}</span></button>`,
          say: `It's ${w.label.toLowerCase()} today! What should we take?`, text: 'What should we take?',
          options: shuffle([[wid, html, label], ...others]).map(x => item(x[2], x[1], x[2])),
          wrongSay: id => `${id}? Hmm, that's for ${byId(WEAR.find(x => x[2] === id)[0]).label.toLowerCase()} days.`,
          success: `Yes! ${label[0].toUpperCase() + label.slice(1)} for a ${w.label.toLowerCase()} day!`
        };
      }
      case 3: {
        const [a, b] = HOT_COLD.bins.map(bin => shuffle(HOT_COLD.items.filter(i => i[2] === bin.id)).slice(0, 3));
        return {
          kind: 'sort', key: 'hc' + Math.random(), say: HOT_COLD.say, text: HOT_COLD.text, bins: HOT_COLD.bins,
          items: shuffle([...a, ...b]).map(([html, label, bin, why]) => item(label, html, label, { bin, why })),
          success: 'You sorted the hot and the cold!'
        };
      }
      case 4: {
        const o = pick(ORDERS);
        const items = o.steps.map(([html, label], i) => item(o.key + i, html, label));
        return {
          kind: 'order', key: o.key, items, say: o.say, text: o.text,
          hint: slot => slot === 0 ? `It starts with ${items[0].label}.` : `What comes after ${items[slot - 1].label}?`,
          success: o.success
        };
      }
      default: {
        const h = pick(HAPPENS);
        const others = shuffle(HAPPENS.filter(x => x !== h)).slice(0, 2);
        return {
          kind: 'pick', key: h[2], answer: h[2],
          show: '<span class="q-show">🤔</span>',
          say: h[0], text: h[0],
          options: shuffle([h, ...others]).map(x => item(x[2], x[1], x[2])),
          wrongSay: () => `Hmm, not that one. ${h[0]}`,
          success: h[3]
        };
      }
    }
  }

  KW.quiz({ key: 'weather', generate });
})();
