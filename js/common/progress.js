// Remembers how each level is going (for the parent corner):
// how many problems were solved, how many on the first try, and how many
// things were made per day.
window.KW = window.KW || {};

(function () {
  const KEEP_DAYS = 60;

  function today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function bumpDay(field) {
    const days = KW.store.get('days', {});
    const k = today();
    days[k] = days[k] || { solved: 0, made: 0 };
    days[k][field]++;
    // Forget very old days so storage stays small.
    const keys = Object.keys(days).sort();
    keys.slice(0, Math.max(0, keys.length - KEEP_DAYS)).forEach(old => delete days[old]);
    KW.store.set('days', days);
  }

  KW.progress = {
    today,

    // A problem finished: solved (or not, e.g. a wrong guess) and whether
    // it was right the first time with no hints.
    record(game, level, firstTry, solved = true) {
      const all = KW.store.get('progress', {});
      const g = all[game] = all[game] || {};
      const l = g[level] = g[level] || { solved: 0, firstTry: 0, tries: 0, recent: [], last: 0 };
      l.tries++;
      if (solved) l.solved++;
      if (firstTry && solved) l.firstTry++;
      l.recent = l.recent.concat(firstTry && solved ? 1 : 0).slice(-10);
      l.last = Date.now();
      KW.store.set('progress', all);
      bumpDay('solved');
    },

    // Something was made in Create Studio: 'drawing', 'creature' or 'story'.
    made(kind) {
      const made = KW.store.get('made', {});
      made[kind] = (made[kind] || 0) + 1;
      KW.store.set('made', made);
      bumpDay('made');
    },

    all: () => KW.store.get('progress', {}),
    days: () => KW.store.get('days', {}),
    madeCounts: () => KW.store.get('made', {})
  };
})();
