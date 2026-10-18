// Draws a creature as an SVG string from a small config object, e.g.
// { body: 'round', eyes: 'two', mouth: 'smile', top: 'horns', arms: 'wings',
//   legs: 'feet', pattern: 'spots', color: '#7ed957', name: 'Zibbo' }
// Used by Make a Creature and by Story Maker (creatures can star in stories).
window.KW = window.KW || {};

(function () {
  const INK = '#2b2a4c';
  let uid = 0;

  const roundRect = (x, y, w, h, r) =>
    `M${x + r} ${y} H${x + w - r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + h - r} ` +
    `A${r} ${r} 0 0 1 ${x + w - r} ${y + h} H${x + r} A${r} ${r} 0 0 1 ${x} ${y + h - r} ` +
    `V${y + r} A${r} ${r} 0 0 1 ${x + r} ${y} Z`;
  const circle = (cx, cy, r) => `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`;

  // top/eye/mouth/bottom are y positions; w = half-width near the eyes,
  // sw/sideY = half-width and y where arms attach.
  const BODIES = {
    round:  { d: circle(150, 165, 85), top: 82, eye: 140, mouth: 195, bottom: 250, w: 80, sw: 84, sideY: 175 },
    tall:   { d: roundRect(95, 55, 110, 205, 55), top: 57, eye: 118, mouth: 172, bottom: 260, w: 52, sw: 55, sideY: 180 },
    blob:   { d: 'M50 200 C40 130 90 100 150 105 C215 108 265 130 255 200 C250 250 200 262 150 258 C95 262 55 250 50 200 Z',
              top: 106, eye: 160, mouth: 210, bottom: 258, w: 95, sw: 102, sideY: 195 },
    square: { d: roundRect(80, 90, 140, 165, 28), top: 92, eye: 145, mouth: 205, bottom: 255, w: 68, sw: 70, sideY: 180 },
    pear:   { d: 'M150 70 C190 70 200 120 205 150 C245 180 250 255 150 258 C50 255 55 180 95 150 C100 120 110 70 150 70 Z',
              top: 72, eye: 125, mouth: 180, bottom: 258, w: 45, sw: 95, sideY: 205 }
  };

  const PARTS = {
    body:    ['round', 'tall', 'blob', 'square', 'pear'],
    eyes:    ['two', 'one', 'three', 'sleepy', 'many'],
    mouth:   ['smile', 'teeth', 'tongue', 'o', 'fangs'],
    top:     ['none', 'horns', 'antennae', 'ears', 'bunny', 'hair'],
    arms:    ['none', 'arms', 'wings', 'claws'],
    legs:    ['feet', 'four', 'tentacles', 'wheels', 'none'],
    pattern: ['none', 'spots', 'stripes', 'belly', 'stars'],
    color:   ['#7ed957', '#3d8bfd', '#ff7eb6', '#ffb02e', '#8b6cf0', '#ef5a5a', '#2ec4b6', '#ffd93d', '#a0a4b8', '#ff8c42']
  };

  // Darker shade of a hex color, for legs and outlines inside the body.
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => Math.round(v * f));
    return `rgb(${c.join(',')})`;
  }

  // Draw something on the left and a mirror copy on the right.
  const mirror = s => s + `<g transform="translate(300 0) scale(-1 1)">${s}</g>`;

  function eye(x, y, r, sleepy, color) {
    let s = `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${INK}" stroke-width="4"/>` +
            `<circle cx="${x + r * 0.15}" cy="${y + r * 0.15}" r="${r * 0.5}" fill="${INK}"/>` +
            `<circle cx="${x - r * 0.05}" cy="${y - r * 0.1}" r="${r * 0.17}" fill="#fff"/>`;
    if (sleepy) {
      s += `<path d="M${x - r - 2} ${y} A${r + 2} ${r + 2} 0 0 1 ${x + r + 2} ${y} Z" fill="${color}" stroke="${INK}" stroke-width="4"/>`;
    }
    return s;
  }

  function eyes(c, b) {
    const y = b.eye, w = b.w;
    const r2 = Math.min(22, w * 0.3);
    switch (c.eyes) {
      case 'one':    return eye(150, y, 32, false, c.color);
      case 'three':  return eye(150 - w * 0.5, y + 6, 15) + eye(150, y - 12, 17) + eye(150 + w * 0.5, y + 6, 15);
      case 'sleepy': return eye(150 - w * 0.38, y, r2, true, c.color) + eye(150 + w * 0.38, y, r2, true, c.color);
      case 'many':   return [[-0.55, 6], [-0.27, -10], [0, 4], [0.27, -10], [0.55, 6]]
                       .map(([dx, dy]) => eye(150 + w * dx, y + dy, 11)).join('');
      default:       return eye(150 - w * 0.38, y, r2) + eye(150 + w * 0.38, y, r2);
    }
  }

  function mouth(c, b) {
    const y = b.mouth, m = Math.min(36, b.w * 0.55);
    const open = `M${150 - m} ${y} Q150 ${y + m * 1.3} ${150 + m} ${y} Z`;
    const line = `<path d="M${150 - m} ${y} Q150 ${y + m * 0.9} ${150 + m} ${y}" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
    switch (c.mouth) {
      case 'teeth':
        return `<path d="${open}" fill="#6b2135" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` +
               `<rect x="${150 - m * 0.5}" y="${y}" width="${m * 0.45}" height="${m * 0.35}" fill="#fff"/>` +
               `<rect x="${150 + m * 0.05}" y="${y}" width="${m * 0.45}" height="${m * 0.35}" fill="#fff"/>`;
      case 'tongue':
        return `<path d="${open}" fill="#6b2135" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` +
               `<ellipse cx="150" cy="${y + m * 0.55}" rx="${m * 0.45}" ry="${m * 0.28}" fill="#ff7e9d"/>`;
      case 'o':
        return `<ellipse cx="150" cy="${y + 8}" rx="13" ry="17" fill="#6b2135" stroke="${INK}" stroke-width="4"/>`;
      case 'fangs':
        return line + `<path d="M${150 - m * 0.45} ${y + m * 0.3} l7 16 l7 -14 Z M${150 + m * 0.45} ${y + m * 0.3} l-7 16 l-7 -14 Z" fill="#fff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
      default:
        return line;
    }
  }

  function top(c, b) {
    const t = b.top, x = 150 - Math.max(28, b.w * 0.5);
    const col = c.color, st = `stroke="${INK}" stroke-width="4" stroke-linejoin="round"`;
    switch (c.top) {
      case 'horns':
        return mirror(`<path d="M${x - 8} ${t + 22} Q${x - 30} ${t - 30} ${x - 8} ${t - 50} Q${x + 2} ${t - 18} ${x + 24} ${t + 14} Z" fill="#fff4d6" ${st}/>`);
      case 'antennae':
        return mirror(`<path d="M${135} ${t + 10} L${112} ${t - 45}" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>` +
                      `<circle cx="112" cy="${t - 50}" r="11" fill="#ffd93d" stroke="${INK}" stroke-width="4"/>`);
      case 'ears':
        return mirror(`<path d="M${x - 14} ${t + 30} L${x - 4} ${t - 34} L${x + 34} ${t + 14} Z" fill="${col}" ${st}/>` +
                      `<path d="M${x - 4} ${t + 18} L${x + 1} ${t - 14} L${x + 20} ${t + 10} Z" fill="#ffb3c8"/>`);
      case 'bunny':
        return mirror(`<ellipse cx="${150 - 26}" cy="${t - 34}" rx="16" ry="50" fill="${col}" ${st} transform="rotate(-10 ${150 - 26} ${t})"/>` +
                      `<ellipse cx="${150 - 26}" cy="${t - 34}" rx="7" ry="36" fill="#ffb3c8" transform="rotate(-10 ${150 - 26} ${t})"/>`);
      case 'hair':
        return `<path d="M115 ${t + 18} L120 ${t - 30} L135 ${t + 2} L150 ${t - 42} L165 ${t + 2} L180 ${t - 30} L185 ${t + 18} Z" fill="${shade(col, 0.7)}" ${st}/>`;
      default:
        return '';
    }
  }

  function arms(c, b) {
    const x = 150 - b.sw, y = b.sideY, col = c.color;
    switch (c.arms) {
      case 'arms':
        return mirror(`<path d="M${x + 14} ${y} Q${x - 30} ${y - 4} ${x - 40} ${y - 40}" fill="none" stroke="${INK}" stroke-width="18" stroke-linecap="round"/>` +
                      `<path d="M${x + 14} ${y} Q${x - 30} ${y - 4} ${x - 40} ${y - 40}" fill="none" stroke="${col}" stroke-width="10" stroke-linecap="round"/>` +
                      `<circle cx="${x - 42}" cy="${y - 44}" r="12" fill="${col}" stroke="${INK}" stroke-width="4"/>`);
      case 'wings':
        return mirror(`<path d="M${x + 24} ${y - 20} C${x - 50} ${y - 100} ${x - 90} ${y - 10} ${x - 30} ${y + 10} C${x - 50} ${y + 30} ${x - 10} ${y + 40} ${x + 24} ${y + 18} Z" fill="#fff" fill-opacity=".9" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`);
      case 'claws':
        return mirror(`<path d="M${x + 14} ${y - 6} Q${x - 26} ${y + 4} ${x - 30} ${y + 40}" fill="none" stroke="${INK}" stroke-width="18" stroke-linecap="round"/>` +
                      `<path d="M${x + 14} ${y - 6} Q${x - 26} ${y + 4} ${x - 30} ${y + 40}" fill="none" stroke="${col}" stroke-width="10" stroke-linecap="round"/>` +
                      `<path d="M${x - 42} ${y + 44} l-6 12 M${x - 31} ${y + 48} l0 13 M${x - 20} ${y + 44} l6 12" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`);
      default:
        return '';
    }
  }

  function legs(c, b) {
    const y = b.bottom, w = Math.max(40, b.w), col = c.color, dark = shade(col, 0.75);
    const st = `stroke="${INK}" stroke-width="4"`;
    switch (c.legs) {
      case 'feet':
        return mirror(`<ellipse cx="${150 - w * 0.5}" cy="${y + 4}" rx="28" ry="15" fill="${dark}" ${st}/>`);
      case 'four':
        return mirror(`<rect x="${150 - w * 0.95}" y="${y - 20}" width="24" height="44" rx="11" fill="${dark}" ${st}/>` +
                      `<rect x="${150 - w * 0.4}" y="${y - 20}" width="24" height="46" rx="11" fill="${dark}" ${st}/>`);
      case 'tentacles':
        return [-0.75, -0.25, 0.25, 0.75].map(f => {
          const x = 150 + w * f;
          const p = `M${x} ${y - 20} q-14 20 0 32 q14 12 -2 28`;
          return `<path d="${p}" fill="none" stroke="${INK}" stroke-width="20" stroke-linecap="round"/>` +
                 `<path d="${p}" fill="none" stroke="${dark}" stroke-width="12" stroke-linecap="round"/>`;
        }).join('');
      case 'wheels':
        return mirror(`<circle cx="${150 - w * 0.55}" cy="${y + 8}" r="24" fill="${INK}"/>` +
                      `<circle cx="${150 - w * 0.55}" cy="${y + 8}" r="10" fill="#c9ccd6"/>`);
      default:
        return '';
    }
  }

  function pattern(c, b) {
    switch (c.pattern) {
      case 'spots':
        return [[110, 120, 14], [190, 110, 10], [95, 200, 16], [205, 190, 13], [150, 235, 11], [170, 80, 9], [235, 150, 10], [65, 160, 10]]
          .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" fill-opacity=".38"/>`).join('');
      case 'stripes':
        return [70, 105, 140, 175, 210, 245].map(y =>
          `<rect x="0" y="${y}" width="300" height="14" fill="#000" fill-opacity=".12" transform="rotate(-8 150 ${y})"/>`).join('');
      case 'belly': {
        const cy = (b.mouth + b.bottom) / 2 + 18;
        return `<ellipse cx="150" cy="${cy}" rx="${b.sw * 0.62}" ry="${(b.bottom - b.mouth) * 0.6}" fill="#fff" fill-opacity=".45"/>`;
      }
      case 'stars':
        return [[105, 120], [195, 130], [120, 215], [190, 220], [150, 90]].map(([x, y]) =>
          `<path d="M${x} ${y - 10} l3 7 l8 1 l-6 5 l2 8 l-7 -4 l-7 4 l2 -8 l-6 -5 l8 -1 Z" fill="#fff" fill-opacity=".6"/>`).join('');
      default:
        return '';
    }
  }

  function render(cfg, { size = 300, className = '' } = {}) {
    const c = Object.assign(random(), cfg);
    const b = BODIES[c.body] || BODIES.round;
    const id = 'cb' + (++uid);
    return `<svg class="creature-svg ${className}" viewBox="0 -20 300 320" width="${size}" height="${size * 320 / 300}" role="img" aria-label="${c.name || 'Creature'}">` +
      `<defs><clipPath id="${id}"><path d="${b.d}"/></clipPath></defs>` +
      legs(c, b) + arms(c, b) + top(c, b) +
      `<path d="${b.d}" fill="${c.color}"/>` +
      `<g clip-path="url(#${id})">${pattern(c, b)}</g>` +
      `<path d="${b.d}" fill="none" stroke="${INK}" stroke-width="5"/>` +
      eyes(c, b) + mouth(c, b) +
      '</svg>';
  }

  const pickOne = arr => arr[Math.floor(Math.random() * arr.length)];

  function makeName() {
    const syl = ['zi', 'bo', 'glo', 'mu', 'fla', 'pi', 'wum', 'ka', 'snu', 'bli', 'ro', 'tik', 'nu', 'fo', 'gub', 'la', 'zor', 'pip'];
    const n = Math.random() < 0.6 ? 2 : 3;
    const s = Array.from({ length: n }, () => pickOne(syl)).join('');
    return s[0].toUpperCase() + s.slice(1);
  }

  function random() {
    const c = {};
    Object.keys(PARTS).forEach(k => { c[k] = pickOne(PARTS[k]); });
    c.name = makeName();
    return c;
  }

  // Voice pitch matches the body: little pear squeaks, big blob rumbles.
  const PITCH = { round: 1.5, tall: 0.8, blob: 0.5, square: 1.0, pear: 1.9 };

  KW.creature = { PARTS, render, random, makeName, pitch: c => PITCH[c.body] || 1.1 };
})();
