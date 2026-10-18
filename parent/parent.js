// Grown-ups Corner: progress overview and settings, behind a simple
// "grown-ups only" multiplication check.
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const P = KW.progress;

  // ---------- Grown-up check ----------
  let gateAnswer = 0;
  let typed = '';

  function newGateQuestion() {
    const a = 3 + Math.floor(Math.random() * 7), b = 3 + Math.floor(Math.random() * 7);
    gateAnswer = a * b;
    typed = '';
    $('gateQ').textContent = `What is ${a} × ${b}?`;
    $('gateDisplay').textContent = '';
  }

  function unlock() {
    try { sessionStorage.setItem('kw:parentOk', '1'); } catch (e) { /* ignore */ }
    $('gate').hidden = true;
    $('main').hidden = false;
    renderAll();
  }

  $('pad').innerHTML = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']
    .map(k => k ? `<button data-k="${k}" aria-label="${k === '⌫' ? 'Delete' : k}">${k}</button>` : '<span></span>').join('');
  $('pad').addEventListener('click', e => {
    const b = e.target.closest('[data-k]');
    if (!b) return;
    typed = b.dataset.k === '⌫' ? typed.slice(0, -1) : (typed + b.dataset.k).slice(0, 3);
    $('gateDisplay').textContent = typed;
    if (typed.length >= String(gateAnswer).length) {
      if (+typed === gateAnswer) {
        unlock();
      } else {
        const d = $('gateDisplay');
        d.classList.remove('shake');
        void d.offsetWidth;
        d.classList.add('shake');
        setTimeout(newGateQuestion, 500);
      }
    }
  });

  // ---------- Numbers ----------
  const pct = (a, b) => (b ? Math.round(100 * a / b) : 0);
  const recentRate = l => (l.recent && l.recent.length ? l.recent.reduce((s, v) => s + v, 0) / l.recent.length : 0);

  // ready: doing well, try the next level; help: worth sitting together.
  function status(l) {
    if (!l || !l.tries) return null;
    const n = l.recent.length, r = recentRate(l);
    if (n >= 6 && r >= 0.8) return { cls: 'ready', text: '✓ Ready for more' };
    if (n >= 4 && r < 0.5) return { cls: 'help', text: '🤝 Practice together' };
    return { cls: 'going', text: '🌱 Practicing' };
  }

  function lastDays(n) {
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      out.push({ key, date: d });
    }
    return out;
  }

  // ---------- Rendering ----------
  function renderTiles() {
    const all = P.all();
    let solved = 0, first = 0;
    Object.values(all).forEach(g => Object.values(g).forEach(l => { solved += l.solved; first += l.firstTry; }));
    const days = P.days();
    const active = lastDays(14).filter(d => days[d.key]).length;
    const made = Object.values(P.madeCounts()).reduce((s, v) => s + v, 0);
    const tile = (label, value, hint) =>
      `<div class="tile"><div class="label">${label}</div><div class="value">${value}</div>${hint ? `<div class="hint">${hint}</div>` : ''}</div>`;
    $('tiles').innerHTML =
      tile('⭐ Stars', KW.stars.total()) +
      tile('✅ Math problems solved', solved) +
      tile('🎯 Right first try', solved ? pct(first, solved) + '%' : '–', solved ? `${first} of ${solved}` : 'No problems yet') +
      tile('📅 Days played', active, 'in the last 14 days') +
      tile('🎨 Things made', made);
  }

  function renderTips() {
    const all = P.all();
    const tips = [];
    KW.catalog.forEach(g => {
      const levels = all[g.key] || {};
      g.levels.forEach((name, i) => {
        const s = status(levels[i + 1]);
        if (s && s.cls === 'help') {
          tips.push(`🤝 <a href="../${g.href}">${g.name}</a>, level ${i + 1} (${name}) is tricky right now. It's a good one to play side by side.`);
        }
      });
      // Highest level he's doing well on: suggest the next one if not started.
      let best = 0;
      g.levels.forEach((_, i) => { const s = status(levels[i + 1]); if (s && s.cls === 'ready') best = i + 1; });
      if (best && best < g.levels.length && !(levels[best + 1] && levels[best + 1].tries)) {
        tips.push(`⭐ He's doing great on <a href="../${g.href}">${g.name}</a> level ${best}. Try level ${best + 1} (${g.levels[best]}).`);
      }
    });
    if (!tips.length) {
      tips.push(Object.keys(all).length
        ? '🌱 Keep playing. Tips show up here after a few more problems on a level.'
        : '👋 Nothing played yet. A good start is <a href="../games/ten-frame/index.html">Ten Frames</a>, level 1.');
    }
    $('tips').innerHTML = tips.slice(0, 4).map(t => `<li>${t}</li>`).join('');
  }

  function renderChart() {
    const days = P.days();
    const list = lastDays(14).map(d => {
      const v = days[d.key] || { solved: 0, made: 0 };
      return Object.assign(d, { solved: v.solved, made: v.made, total: v.solved + v.made });
    });
    const max = Math.max(1, ...list.map(d => d.total));
    const sum = list.reduce((s, d) => s + d.total, 0);
    const fmt = d => d.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

    $('activitySub').textContent = sum
      ? `${sum} activities: math problems solved plus things made. Hover a bar for the day's details.`
      : 'No activity yet. Bars appear here as he plays.';

    $('chart').innerHTML = list.map((d, i) =>
      `<div class="bar-col" tabindex="0" data-i="${i}" aria-label="${fmt(d)}: ${d.solved} problems, ${d.made} made">` +
      `<div class="bar${d.total ? '' : ' empty'}" style="height:${d.total ? Math.max(4, 100 * d.total / max) : 0}%"></div></div>`).join('');
    let labels = document.querySelector('.chart-labels');
    if (!labels) {
      labels = document.createElement('div');
      labels.className = 'chart-labels';
      $('chart').after(labels);
    }
    labels.innerHTML = list.map((d, i) =>
      `<span class="${i === list.length - 1 ? 'today' : ''}">${i === list.length - 1 ? 'Today' : d.date.getDate()}</span>`).join('');

    $('activityTable').innerHTML = '<tr><th>Day</th><th class="num">Problems solved</th><th class="num">Things made</th></tr>' +
      list.slice().reverse().map(d => `<tr><td>${fmt(d)}</td><td class="num">${d.solved}</td><td class="num">${d.made}</td></tr>`).join('');

    // Hover / focus tooltip
    const tip = $('tooltip');
    const show = col => {
      const d = list[+col.dataset.i];
      const r = col.querySelector('.bar').getBoundingClientRect();
      tip.innerHTML = `<b>${fmt(d)}</b><br>${d.solved} math problems · ${d.made} made`;
      tip.style.left = (r.left + r.width / 2) + 'px';
      tip.style.top = Math.min(r.top, col.getBoundingClientRect().bottom - 8) + 'px';
      tip.hidden = false;
    };
    $('chart').onmouseover = e => { const c = e.target.closest('.bar-col'); if (c) show(c); };
    $('chart').onfocusin = e => { const c = e.target.closest('.bar-col'); if (c) show(c); };
    $('chart').onmouseleave = () => { tip.hidden = true; };
    $('chart').onfocusout = () => { tip.hidden = true; };
  }

  function renderGames() {
    const all = P.all();
    const block = g => {
      const levels = all[g.key] || {};
      const rows = g.levels.map((name, i) => {
        const l = levels[i + 1];
        const s = status(l);
        const rate = l ? Math.round(recentRate(l) * 100) : 0;
        const stats = l && l.tries ? `${l.solved} solved · ${rate}% first try` : 'Not tried yet';
        return `<div class="level-row">
            <div class="level-name"><span class="n">${i + 1}</span>${name}</div>
            <div class="meter" role="img" aria-label="${rate}% right first try"><span style="width:${rate}%"></span></div>
            <div class="level-stats">${stats}${s ? `<span class="badge ${s.cls}">${s.text}</span>` : ''}</div>
          </div>`;
      }).join('');
      return `<div class="game-block">
          <div class="game-head"><span>${g.icon}</span>${g.name}<a href="../${g.href}">Play →</a></div>
          ${rows}</div>`;
    };
    $('games').innerHTML = KW.islands.map(is =>
      `<h3 class="island-title">${is.icon} ${is.name}</h3>` +
      KW.catalog.filter(g => g.island === is.key).map(block).join('')).join('');
  }

  function renderMade() {
    const m = P.madeCounts();
    const drawingsKept = (() => { try { return (JSON.parse(localStorage.getItem('kw:drawings')) || []).length; } catch (e) { return 0; } })();
    const creaturesKept = KW.store.get('creatures', []).length;
    const item = (href, icon, n, label, kept) =>
      `<a href="../${href}"><span class="icon">${icon}</span><span><b>${n}</b><small>${label}${kept != null ? ` · ${kept} kept` : ''}</small></span></a>`;
    $('made').innerHTML =
      item('games/draw/index.html', '🖍️', m.drawing || 0, 'drawings saved', drawingsKept) +
      item('games/creature/index.html', '🐲', m.creature || 0, 'creatures made', creaturesKept) +
      item('games/story/index.html', '📖', m.story || 0, 'stories finished');
  }

  // ---------- Settings ----------
  function note(text) {
    $('savedNote').textContent = text;
    clearTimeout(note.t);
    note.t = setTimeout(() => { $('savedNote').textContent = ''; }, 2500);
  }

  function renderSettings() {
    $('childName').value = KW.store.get('childName', '');
    document.querySelector(`input[name="voice"][value="${KW.store.get('voiceSlow', false) ? 'slow' : 'normal'}"]`).checked = true;
    document.querySelector(`input[name="sound"][value="${KW.isMuted() ? 'off' : 'on'}"]`).checked = true;
    $('breakMinutes').value = String(KW.store.get('breakMinutes', 0));
  }

  $('childName').addEventListener('change', e => {
    const name = e.target.value.trim().replace(/[<>&"]/g, '');
    KW.store.set('childName', name);
    note(name ? `Saved. Hi, ${name}!` : 'Name removed.');
  });
  document.querySelectorAll('input[name="voice"]').forEach(r => r.addEventListener('change', () => {
    KW.store.set('voiceSlow', r.value === 'slow');
    KW.speech.say('This is how I will talk.');
    note('Voice speed saved.');
  }));
  document.querySelectorAll('input[name="sound"]').forEach(r => r.addEventListener('change', () => {
    KW.setMuted(r.value === 'off');
    note(r.value === 'off' ? 'Sound is off.' : 'Sound is on.');
  }));
  $('breakMinutes').addEventListener('change', e => {
    KW.store.set('breakMinutes', +e.target.value);
    try { sessionStorage.removeItem('kw:playStart'); } catch (err) { /* ignore */ }
    note(+e.target.value ? `Break reminder after ${e.target.value} minutes.` : 'Break reminder is off.');
  });

  $('resetBtn').addEventListener('click', e => {
    const btn = e.currentTarget;
    if (!btn.classList.contains('sure')) {
      btn.classList.add('sure');
      btn.textContent = 'Tap again to reset';
      setTimeout(() => { btn.classList.remove('sure'); btn.textContent = 'Reset progress'; }, 4000);
      return;
    }
    try {
      Object.keys(localStorage)
        .filter(k => /^kw:(stars|progress|days|made|[a-z]+:levelStars)$/.test(k))
        .forEach(k => localStorage.removeItem(k));
    } catch (err) { /* ignore */ }
    btn.classList.remove('sure');
    btn.textContent = 'Reset progress';
    renderAll();
    note('Progress reset.');
  });

  function renderAll() {
    renderTiles();
    renderTips();
    renderChart();
    renderGames();
    renderMade();
    renderSettings();
  }

  let ok = false;
  try { ok = sessionStorage.getItem('kw:parentOk') === '1'; } catch (e) { /* ignore */ }
  if (ok) unlock();
  else newGateQuestion();
})();
