// Voice narration using the browser's built-in speech (no internet needed).
// say() returns a Promise that resolves when the sentence is finished, so
// games can "count along" one number at a time.
window.KW = window.KW || {};

(function () {
  const synth = window.speechSynthesis;
  let voice = null;

  function pickVoice() {
    if (!synth) return;
    const voices = synth.getVoices().filter(v => /^en([-_]|$)/i.test(v.lang));
    const preferred = ['Samantha', 'Google US English', 'Microsoft Aria', 'Microsoft Jenny', 'Microsoft Zira'];
    voice = preferred.map(name => voices.find(v => v.name.includes(name))).find(Boolean)
      || voices.find(v => /en[-_]US/i.test(v.lang))
      || voices[0]
      || null;
  }

  if (synth) {
    pickVoice();
    synth.onvoiceschanged = pickVoice;
  }

  const wait = ms => new Promise(r => setTimeout(r, ms));

  KW.speech = {
    stop() {
      if (synth) synth.cancel();
    },

    say(text, opts = {}) {
      if (!synth || KW.isMuted()) {
        // Keep the same pacing when muted so animations still feel natural.
        return wait(opts.quick ? 450 : Math.min(500 + text.length * 45, 2500));
      }
      return new Promise(resolve => {
        synth.cancel();
        const u = new SpeechSynthesisUtterance(text);
        if (voice) u.voice = voice;
        u.lang = voice ? voice.lang : 'en-US';
        // Grown-ups can pick a slower voice in the parent corner.
        u.rate = (opts.rate || 0.92) * (KW.store.get('voiceSlow', false) ? 0.8 : 1);
        u.pitch = opts.pitch || 1.1;
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          resolve();
        };
        // Some browsers never fire onend; never leave a game waiting forever.
        const timer = setTimeout(finish, opts.quick ? 1100 : 1500 + text.length * 120);
        u.onend = finish;
        u.onerror = finish;
        synth.speak(u);
      });
    }
  };
})();
