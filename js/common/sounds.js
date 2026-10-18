// Tiny sound effects made with the Web Audio API (no sound files needed).
window.KW = window.KW || {};

KW.sound = {
  ctx: null,

  // Browsers only allow audio after the first tap, so call this on a tap.
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  tone(freq, dur, type = 'sine', delay = 0, vol = 0.18) {
    if (!this.ctx || KW.isMuted()) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  },

  // A tone that glides from one pitch to another (used for hops).
  slide(from, to, dur, vol = 0.16) {
    if (!this.ctx || KW.isMuted()) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  },

  hop(dir = 1)    { dir > 0 ? this.slide(320, 720, 0.18) : this.slide(720, 320, 0.18); },
  bigHop(dir = 1) { dir > 0 ? this.slide(200, 950, 0.32) : this.slide(950, 200, 0.32); },

  pop()   { this.tone(660, 0.09, 'triangle'); this.tone(990, 0.07, 'triangle', 0.04); },
  unpop() { this.tone(520, 0.08, 'triangle'); this.tone(360, 0.09, 'triangle', 0.05); },
  oops()  { this.tone(330, 0.16, 'sine', 0, 0.14); this.tone(262, 0.2, 'sine', 0.14, 0.14); },
  ding()  { this.tone(880, 0.15, 'sine'); this.tone(1175, 0.25, 'sine', 0.1); },
  ten()   { [784, 988, 1175].forEach((f, i) => this.tone(f, 0.14, 'triangle', i * 0.07)); },
  win()   { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.22, 'triangle', i * 0.1, 0.2)); }
};
