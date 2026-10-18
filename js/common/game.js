// Pieces every game page shares: level buttons, the Play overlay,
// answer choices and small number helpers.
window.KW = window.KW || {};

KW.util = {
  rand: (a, b) => a + Math.floor(Math.random() * (b - a + 1)),
  range: (a, b) => Array.from({ length: Math.max(0, b - a) }, (_, i) => a + i),
  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },
  // 34 -> "3 tens and 4 ones"
  tensOnes(n) {
    const t = Math.floor(n / 10), o = n % 10;
    const tp = t === 1 ? '1 ten' : `${t} tens`;
    const op = o === 1 ? '1 one' : `${o} ones`;
    if (t === 0) return op;
    return o === 0 ? tp : `${tp} and ${op}`;
  }
};

KW.game = {
  // Level buttons in the top bar. Remembers the chosen level and the stars
  // won on each level under `key` (e.g. "tenframe:level").
  levelPicker({ el, levels, key, onChange }) {
    let level = Math.min(levels.length, Math.max(1, KW.store.get(key + ':level', 1)));
    const stars = KW.store.get(key + ':levelStars', {});

    function render() {
      el.innerHTML = levels.map(l => {
        const s = stars[l.id] || 0;
        const active = l.id === level;
        return `<button class="level-btn${active ? ' active' : ''}" data-level="${l.id}" aria-pressed="${active}">
          <span class="lv">${l.id}</span><small>${l.label}${s ? ' ⭐' + s : ''}</small></button>`;
      }).join('');
    }

    el.addEventListener('click', e => {
      const b = e.target.closest('.level-btn');
      if (!b) return;
      level = +b.dataset.level;
      KW.store.set(key + ':level', level);
      render();
      onChange(level);
    });
    render();

    return {
      get level() { return level; },
      // A solved problem: one star, and a note for the parent corner.
      addStar(firstTry = true) {
        if (KW.progress) KW.progress.record(key, level, firstTry);
        stars[level] = (stars[level] || 0) + 1;
        KW.store.set(key + ':levelStars', stars);
        KW.stars.add(1);
        KW.ui.updateStars();
        render();
      }
    };
  },

  // Sound may only start after a tap, so each game opens with a Play button.
  onStart(overlay, button, fn) {
    button.addEventListener('click', () => {
      KW.sound.unlock();
      overlay.hidden = true;
      fn();
    });
  },

  // The right answer plus two close numbers ("off by ten" too on big numbers).
  nearChoices(answer, { min = 0, max = 100, tens = false } = {}) {
    const near = tens ? [answer + 1, answer - 1, answer + 10, answer - 10]
                      : [answer + 1, answer - 1, answer + 2, answer - 2];
    const ok = KW.util.shuffle(near.filter(v => v >= min && v <= max && v !== answer));
    return KW.util.shuffle([answer, ok[0], ok[1]]);
  },

  renderChoices(el, values) {
    el.innerHTML = values.map(v => `<button class="choice" data-v="${v}">${v}</button>`).join('');
  },

  celebrate() {
    KW.sound.win();
    KW.ui.confetti();
  }
};
