// Small wrapper around localStorage. Every read/write is guarded because
// storage can be blocked (private windows, strict settings).
window.KW = window.KW || {};

KW.store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem('kw:' + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem('kw:' + key, JSON.stringify(value));
    } catch (e) { /* ignore */ }
  }
};

KW.isMuted = () => KW.store.get('muted', false);
KW.setMuted = (muted) => KW.store.set('muted', !!muted);

KW.stars = {
  total() {
    return KW.store.get('stars', 0);
  },
  add(n = 1) {
    const t = this.total() + n;
    KW.store.set('stars', t);
    return t;
  }
};
