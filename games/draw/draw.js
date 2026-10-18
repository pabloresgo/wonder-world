// Drawing studio: brush, rainbow brush, stamps, paint bucket, eraser,
// undo, and a gallery of saved drawings kept in this browser.
(function () {
  'use strict';

  const COLORS = ['#2b2a4c', '#ef5a5a', '#ff9b3d', '#ffd93d', '#2fbf71', '#2ec4b6',
                  '#3d8bfd', '#8b6cf0', '#ff7eb6', '#8b5e3c', '#a0a4b8', '#ffffff'];
  const STAMPS = ['⭐', '❤️', '🌸', '☀️', '🌈', '🐶', '🐱', '🦖', '🦋', '🚗', '🚀', '🍎', '🌳', '🏠', '🎈', '👑'];
  const SIZES = [5, 14, 30];          // brush widths in CSS pixels
  const STAMP_SIZES = [36, 64, 110];
  const MAX_UNDO = 8;
  const MAX_SAVED = 12;
  const SAVE_KEY = 'kw:drawings';

  const $ = id => document.getElementById(id);
  const canvas = $('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const wrap = $('canvasWrap');

  let tool = 'brush';
  let color = COLORS[1];
  let sizeIdx = 1;
  let stamp = STAMPS[0];
  let hue = 0;
  let dpr = 1;
  let undoStack = [];
  let drawing = false;
  let last = null;
  let lastStamp = null;

  // ---------- Canvas size ----------
  function resize() {
    const rect = wrap.getBoundingClientRect();
    const newDpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(rect.width * newDpr), h = Math.round(rect.height * newDpr);
    if (w === canvas.width && h === canvas.height) return;
    // Keep the picture when the screen turns or resizes.
    const old = document.createElement('canvas');
    old.width = canvas.width;
    old.height = canvas.height;
    if (canvas.width) old.getContext('2d').drawImage(canvas, 0, 0);
    canvas.width = w;
    canvas.height = h;
    dpr = newDpr;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    if (old.width) ctx.drawImage(old, 0, 0);
    undoStack = [];
  }

  function point(e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * dpr, y: (e.clientY - r.top) * dpr };
  }

  function pushUndo() {
    undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (undoStack.length > MAX_UNDO) undoStack.shift();
  }

  // ---------- Tools ----------
  function strokeColor() {
    if (tool === 'eraser') return '#fff';
    if (tool === 'rainbow') {
      hue = (hue + 6) % 360;
      return `hsl(${hue}, 90%, 55%)`;
    }
    return color;
  }

  function line(a, b) {
    ctx.strokeStyle = strokeColor();
    ctx.lineWidth = SIZES[sizeIdx] * dpr * (tool === 'eraser' ? 1.8 : 1);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  function placeStamp(p) {
    const size = STAMP_SIZES[sizeIdx] * dpr;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate((Math.random() - 0.5) * 0.5);
    ctx.font = `${size}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(stamp, 0, 0);
    ctx.restore();
    KW.sound.pop();
  }

  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  // Paint bucket: fills the touching area of similar color.
  function fill(p) {
    const w = canvas.width, h = canvas.height;
    const x0 = Math.floor(p.x), y0 = Math.floor(p.y);
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    const start = (y0 * w + x0) * 4;
    const [tr, tg, tb] = [d[start], d[start + 1], d[start + 2]];
    const [fr, fg, fb] = hexToRgb(color);
    if (Math.abs(tr - fr) + Math.abs(tg - fg) + Math.abs(tb - fb) < 10) return;
    const TOL = 90;   // loose enough to also cover the soft edges of lines
    const match = i => Math.abs(d[i] - tr) + Math.abs(d[i + 1] - tg) + Math.abs(d[i + 2] - tb) <= TOL;
    const seen = new Uint8Array(w * h);
    const stack = [x0, y0];
    while (stack.length) {
      const y = stack.pop(), x = stack.pop();
      let xl = x;
      while (xl >= 0 && !seen[y * w + xl] && match((y * w + xl) * 4)) xl--;
      xl++;
      let up = false, down = false;
      for (let xi = xl; xi < w; xi++) {
        const k = y * w + xi;
        if (seen[k] || !match(k * 4)) break;
        seen[k] = 1;
        const i = k * 4;
        d[i] = fr; d[i + 1] = fg; d[i + 2] = fb; d[i + 3] = 255;
        if (y > 0) {
          const ok = !seen[k - w] && match((k - w) * 4);
          if (ok && !up) { stack.push(xi, y - 1); up = true; } else if (!ok) up = false;
        }
        if (y < h - 1) {
          const ok = !seen[k + w] && match((k + w) * 4);
          if (ok && !down) { stack.push(xi, y + 1); down = true; } else if (!ok) down = false;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
    KW.sound.ding();
  }

  // ---------- Pointer ----------
  canvas.addEventListener('pointerdown', e => {
    KW.sound.unlock();
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    const p = point(e);
    pushUndo();
    if (tool === 'fill') { fill(p); return; }
    if (tool === 'stamp') {
      placeStamp(p);
      lastStamp = p;
      drawing = true;
      return;
    }
    drawing = true;
    last = p;
    line(p, { x: p.x + 0.01, y: p.y });   // a tap makes a dot
  });

  canvas.addEventListener('pointermove', e => {
    if (!drawing) return;
    const coalesced = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
    for (const ev of coalesced.length ? coalesced : [e]) {
      const p = point(ev);
      if (tool === 'stamp') {
        if (Math.hypot(p.x - lastStamp.x, p.y - lastStamp.y) > STAMP_SIZES[sizeIdx] * dpr * 0.9) {
          placeStamp(p);
          lastStamp = p;
        }
      } else {
        line(last, p);
        last = p;
      }
    }
  });

  const stop = () => { drawing = false; last = null; };
  canvas.addEventListener('pointerup', stop);
  canvas.addEventListener('pointercancel', stop);

  // ---------- Toolbar ----------
  function renderPalette() {
    $('palette').innerHTML = COLORS.map(c =>
      `<button class="swatch${c === color ? ' active' : ''}" data-color="${c}" style="background:${c}" aria-label="Color ${c}"></button>`).join('');
    $('stamps').innerHTML = STAMPS.map(s =>
      `<button class="stamp-btn${s === stamp ? ' active' : ''}" data-stamp="${s}" aria-label="Stamp ${s}">${s}</button>`).join('');
    $('stamps').hidden = tool !== 'stamp';
    $('palette').hidden = tool === 'stamp' || tool === 'eraser' || tool === 'rainbow';
  }

  $('tools').addEventListener('click', e => {
    const b = e.target.closest('[data-tool]');
    if (!b) return;
    tool = b.dataset.tool;
    document.querySelectorAll('[data-tool]').forEach(t => t.classList.toggle('active', t === b));
    KW.sound.unlock();
    KW.sound.pop();
    renderPalette();
  });
  $('sizes').addEventListener('click', e => {
    const b = e.target.closest('[data-size]');
    if (!b) return;
    sizeIdx = +b.dataset.size;
    document.querySelectorAll('[data-size]').forEach(t => t.classList.toggle('active', t === b));
  });
  $('palette').addEventListener('click', e => {
    const b = e.target.closest('[data-color]');
    if (!b) return;
    color = b.dataset.color;
    if (tool === 'eraser' || tool === 'stamp' || tool === 'rainbow') tool = 'brush';
    renderPalette();
  });
  $('stamps').addEventListener('click', e => {
    const b = e.target.closest('[data-stamp]');
    if (!b) return;
    stamp = b.dataset.stamp;
    renderPalette();
  });

  $('undoBtn').addEventListener('click', () => {
    const img = undoStack.pop();
    if (img && img.width === canvas.width && img.height === canvas.height) {
      ctx.putImageData(img, 0, 0);
      KW.sound.unpop();
    }
  });
  $('clearBtn').addEventListener('click', () => {
    pushUndo();
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    KW.sound.unpop();
  });

  // ---------- Saving ----------
  function loadSaved() {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || []; } catch (e) { return []; }
  }
  function writeSaved(list) {
    // Drop the oldest drawings until it fits in the browser's storage.
    while (list.length) {
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(list)); return true; }
      catch (e) { list.shift(); }
    }
    return false;
  }

  $('saveBtn').addEventListener('click', () => {
    KW.sound.unlock();
    const scale = Math.min(1, 900 / canvas.width);
    const out = document.createElement('canvas');
    out.width = Math.round(canvas.width * scale);
    out.height = Math.round(canvas.height * scale);
    out.getContext('2d').drawImage(canvas, 0, 0, out.width, out.height);
    const list = loadSaved();
    list.push({ id: Date.now(), img: out.toDataURL('image/jpeg', 0.75) });
    while (list.length > MAX_SAVED) list.shift();
    if (writeSaved(list)) {
      KW.stars.add(1);
      KW.progress.made('drawing');
      KW.ui.updateStars();
      KW.ui.confetti();
      KW.sound.win();
      KW.speech.say('Saved! What a great drawing!');
    } else {
      KW.sound.oops();
      KW.speech.say("Oh no, I couldn't save it.");
    }
  });

  function renderGallery() {
    const list = loadSaved().slice().reverse();
    $('galleryGrid').innerHTML = list.length
      ? list.map(d => `<div class="gallery-item">
          <button class="open" data-open="${d.id}" aria-label="Open drawing"><img src="${d.img}" alt=""></button>
          <button class="del" data-del="${d.id}" aria-label="Delete drawing">✖</button></div>`).join('')
      : '<p class="gallery-empty">No drawings yet. Draw something and tap 💾!</p>';
  }

  $('galleryBtn').addEventListener('click', () => {
    renderGallery();
    $('gallery').hidden = false;
  });
  $('closeGallery').addEventListener('click', () => { $('gallery').hidden = true; });
  $('galleryGrid').addEventListener('click', e => {
    const open = e.target.closest('[data-open]');
    const del = e.target.closest('[data-del]');
    if (open) {
      const d = loadSaved().find(x => String(x.id) === open.dataset.open);
      if (!d) return;
      const img = new Image();
      img.onload = () => {
        pushUndo();
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const s = Math.min(canvas.width / img.width, canvas.height / img.height);
        const w = img.width * s, h = img.height * s;
        ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
        $('gallery').hidden = true;
      };
      img.src = d.img;
    } else if (del) {
      // Two taps to delete, so a stray tap never loses a drawing.
      if (!del.classList.contains('sure')) {
        del.classList.add('sure');
        del.textContent = 'Delete?';
        return;
      }
      writeSaved(loadSaved().filter(x => String(x.id) !== del.dataset.del)) || localStorage.removeItem(SAVE_KEY);
      renderGallery();
    }
  });

  window.addEventListener('resize', resize);
  KW.ui.bindSoundToggle($('soundBtn'));
  KW.ui.updateStars();
  renderPalette();
  resize();
})();
