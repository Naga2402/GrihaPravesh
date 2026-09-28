/*
 * Background music for the invitation.
 *
 * If config.music.url is set (for example "assets/audio/nadaswaram.mp3"), that file
 * is played on a loop. Otherwise a soft veena-style melody in raga Mohanam is
 * synthesised live over a tanpura drone, so no audio file is needed.
 *
 * Browsers only allow sound after a tap, so start() must be called from a tap handler.
 */
(function () {
  const SA = 293.66; // D4: the tonic ("Sa")
  const R = { Dl: 5 / 6, S: 1, R: 9 / 8, G: 5 / 4, P: 3 / 2, D: 5 / 3, S2: 2, R2: 9 / 4, G2: 5 / 2 };
  // Mohanam phrases: [swara, beats]
  const PHRASES = [
    [['G', 1], ['P', 1], ['D', 1], ['S2', 2], ['D', 1], ['P', 1], ['G', 3]],
    [['R', 1], ['G', 1], ['P', 1], ['G', 1], ['R', 1], ['S', 3], [null, 1]],
    [['S', 1], ['R', 1], ['G', 1], ['P', 1], ['D', 1], ['P', 1], ['G', 1], ['R', 3]],
    [['G', 1], ['R', 1], ['S', 1], ['Dl', 1], ['S', 4]],
    [['P', 1], ['D', 1], ['S2', 1], ['R2', 1], ['G2', 2], ['R2', 1], ['S2', 1], ['D', 3]],
    [['P', 1], ['G', 1], ['R', 1], ['G', 1], ['P', 2], ['G', 1], ['R', 1], ['S', 4]],
  ];
  const BEAT = 0.62;

  let ctx = null, master = null, wet = null, timer = null, audioEl = null;
  let playing = false, volume = 0.5;
  let nextNote = 0, phrase = 0, step = 0, nextDrone = 0, droneStep = 0;

  function impulse(seconds) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    return buf;
  }

  function setup() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    const verb = ctx.createConvolver();
    verb.buffer = impulse(3.2);
    wet = ctx.createGain();
    wet.gain.value = 0.55;
    wet.connect(verb);
    verb.connect(master);
  }

  /** A plucked, slightly sliding string: the veena's gamaka. */
  function pluck(freq, t, dur, gain, bright = 2600) {
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(gain, t + 0.008);
    out.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(bright, t);
    lp.frequency.exponentialRampToValueAtTime(420, t + dur * 0.8);
    lp.Q.value = 1.2;
    [['triangle', 1, 0.7], ['sawtooth', 1.003, 0.22], ['sine', 2, 0.12]].forEach(([type, mul, g]) => {
      const o = ctx.createOscillator();
      const og = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq * mul * 0.965, t);
      o.frequency.exponentialRampToValueAtTime(freq * mul, t + 0.09);
      og.gain.value = g;
      o.connect(og).connect(lp);
      o.start(t);
      o.stop(t + dur + 0.05);
    });
    lp.connect(out);
    out.connect(master);
    out.connect(wet);
  }

  function schedule() {
    const ahead = ctx.currentTime + 1.2;
    while (nextNote < ahead) {
      const [sw, beats] = PHRASES[phrase][step];
      const dur = beats * BEAT;
      if (sw) pluck(SA * R[sw], nextNote, Math.max(1.4, dur * 1.8), 0.22);
      nextNote += dur;
      step++;
      if (step >= PHRASES[phrase].length) {
        step = 0;
        phrase = (phrase + 1) % PHRASES.length;
        nextNote += BEAT; // a breath between phrases
      }
    }
    // Tanpura: Pa – Sa' – Sa' – Sa, one string every beat and a bit
    const TANPURA = [SA * 0.75, SA, SA, SA / 2]; // low Pa, Sa, Sa, low Sa
    while (nextDrone < ahead) {
      pluck(TANPURA[droneStep % 4], nextDrone, 3.6, 0.09, 1400);
      nextDrone += BEAT * 1.5;
      droneStep++;
    }
  }

  function fadeTo(v, secs) {
    if (!master) return;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(v, now + secs);
  }

  /** Call from a tap handler. */
  function start(opts = {}) {
    volume = typeof opts.volume === 'number' ? Math.max(0, Math.min(1, opts.volume)) : volume;
    if (opts.url) {
      if (!audioEl || audioEl.dataset.src !== opts.url) {
        if (audioEl) audioEl.pause();
        audioEl = new Audio(opts.url);
        audioEl.dataset.src = opts.url;
        audioEl.loop = true;
      }
      audioEl.volume = volume;
      audioEl.play().catch(() => {});
      playing = true;
      return;
    }
    if (!ctx) setup();
    if (ctx.state === 'suspended') ctx.resume();
    if (!playing) {
      nextNote = ctx.currentTime + 0.4;
      nextDrone = ctx.currentTime + 0.1;
      clearInterval(timer);
      timer = setInterval(schedule, 250);
      schedule();
    }
    fadeTo(volume * 0.6, 3);
    playing = true;
  }

  function stop() {
    playing = false;
    if (audioEl) audioEl.pause();
    if (!ctx) return;
    fadeTo(0, 0.8);
    setTimeout(() => { if (!playing) { clearInterval(timer); ctx.suspend(); } }, 900);
  }

  window.GPMusic = {
    start, stop,
    toggle(opts) { if (playing) stop(); else start(opts); return playing; },
    get playing() { return playing; },
  };
})();
