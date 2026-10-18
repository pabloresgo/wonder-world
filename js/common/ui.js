// Shared visual helpers: confetti, star counters, sound toggle.
window.KW = window.KW || {};

KW.ui = {
  wait: ms => new Promise(r => setTimeout(r, ms)),

  confetti(count = 26) {
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pieces = ['⭐', '🎉', '🌟', '✨', '🎈'];
    const n = reduce ? 6 : count;
    for (let i = 0; i < n; i++) {
      const el = document.createElement('span');
      el.className = 'confetti-piece';
      el.textContent = pieces[i % pieces.length];
      el.style.left = (35 + Math.random() * 30) + 'vw';
      el.style.top = (30 + Math.random() * 20) + 'vh';
      el.style.setProperty('--dx', (Math.random() * 80 - 40) + 'vw');
      el.style.setProperty('--dy', (Math.random() * 70 - 40) + 'vh');
      el.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1600);
    }
  },

  // Any element with class "star-count" shows the total stars.
  updateStars() {
    const t = KW.stars.total();
    document.querySelectorAll('.star-count').forEach(el => {
      el.textContent = '⭐ ' + t;
    });
  },

  // A button that switches voice + sounds on and off.
  bindSoundToggle(btn) {
    if (!btn) return;
    const paint = () => {
      const muted = KW.isMuted();
      btn.textContent = muted ? '🔇' : '🔈';
      btn.setAttribute('aria-label', muted ? 'Turn sound on' : 'Turn sound off');
    };
    btn.addEventListener('click', () => {
      KW.setMuted(!KW.isMuted());
      if (KW.isMuted()) KW.speech.stop();
      paint();
    });
    paint();
  }
};

// Offline support (see sw.js at the site root, two folders up from this file).
(function registerOffline() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  const swUrl = new URL('../../sw.js', document.currentScript.src);
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(swUrl).catch(() => { /* offline mode just won't be available */ });
  });
})();

// Break reminder: after the minutes chosen in the parent corner, a friendly
// "time for a break" screen appears. It counts play time in this browser tab.
(function breakReminder() {
  const minutes = KW.store.get('breakMinutes', 0);
  if (!minutes || document.body.hasAttribute('data-no-break')) return;

  let start = Date.now();
  try {
    start = +sessionStorage.getItem('kw:playStart') || start;
    sessionStorage.setItem('kw:playStart', start);
  } catch (e) { /* storage blocked: count from this page */ }

  function check() {
    if (Date.now() - start < minutes * 60000 || document.querySelector('.break-overlay')) return;
    const el = document.createElement('div');
    el.className = 'overlay break-overlay';
    el.innerHTML = `<div class="overlay-card">
        <div class="mascot">🌙</div>
        <h1>Time for a break!</h1>
        <p class="break-text">You played for ${minutes} minutes. Great job!</p>
        <button class="act-btn break-ok">👍 OK</button>
      </div>`;
    document.body.appendChild(el);
    KW.speech.say(`Great playing! You played for ${minutes} minutes. Time for a little break!`);
    el.querySelector('.break-ok').addEventListener('click', () => {
      el.remove();
      // Remind again in 5 minutes.
      start = Date.now() - (minutes - 5) * 60000;
      try { sessionStorage.setItem('kw:playStart', start); } catch (e) { /* ignore */ }
    });
  }

  setInterval(check, 15000);
  check();
})();
