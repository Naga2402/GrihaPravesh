/* Guest-facing invitation: door → reveal. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const params = new URLSearchParams(location.search);
  const isPreview = params.has('preview');

  let cfg = GP.loadConfig();
  let guest = GP.readGuest();
  let opened = false;

  const stage = $('#doorStage');
  const invite = $('#invite');

  /* ---------- artwork ---------- */
  const ART = {
    'arch': () => GPArt.arch(false),
    'arch-flip': () => GPArt.arch(true),
    'lamp-long': () => GPArt.lamp(190),
    'lamp-short': () => GPArt.lamp(90),
    'corner-tl': () => GPArt.cornerTop(false),
    'corner-tr': () => GPArt.cornerTop(true),
    'corner-bl': () => GPArt.cornerBottom(false),
    'corner-br': () => GPArt.cornerBottom(true),
    'flourish': () => GPArt.flourish(),
    'lotus': () => GPArt.lotus('#e2b760'),
    'lotus-gold': () => GPArt.lotus('#b98631'),
    'kalash': () => GPArt.kalash(),
  };
  $$('[data-art]').forEach((el) => {
    const make = ART[el.dataset.art];
    if (make) el.innerHTML = make();
  });

  const toranTile = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 100' width='64' height='100'>
    <defs><linearGradient id='g' x1='0' x2='1'><stop offset='0' stop-color='#2f5a22'/><stop offset='.6' stop-color='#5d8d3a'/><stop offset='1' stop-color='#8db35d'/></linearGradient></defs>
    <path d='M0 5 Q32 13 64 5' stroke='#c8942f' stroke-width='3' fill='none'/>
    <path d='M46 8 C57 28 57 62 46 88 C35 62 35 28 46 8Z' fill='url(#g)'/>
    <path d='M46 12 V84' stroke='#244419' stroke-width='1' opacity='.6'/>
    <g transform='translate(16 16)'>
      ${Array.from({ length: 12 }, (_, i) => { const a = (i * Math.PI) / 6; return `<circle cx='${(Math.cos(a) * 7).toFixed(2)}' cy='${(Math.sin(a) * 7).toFixed(2)}' r='4.4' fill='#f59a12' stroke='#c96a04' stroke-width='.6'/>`; }).join('')}
      <circle r='6' fill='#ffb21e'/><circle r='2.6' fill='#e27a06'/>
    </g>
    <g transform='translate(16 38)'>
      ${Array.from({ length: 10 }, (_, i) => { const a = (i * Math.PI) / 5; return `<circle cx='${(Math.cos(a) * 5).toFixed(2)}' cy='${(Math.sin(a) * 5).toFixed(2)}' r='3.4' fill='#ffc62e' stroke='#d99a05' stroke-width='.5'/>`; }).join('')}
      <circle r='3.6' fill='#ffd64d'/>
    </g>
  </svg>`;
  $('#toran').style.backgroundImage = `url("data:image/svg+xml;utf8,${encodeURIComponent(toranTile)}")`;

  /* ---------- text ---------- */
  const hasTelugu = (s) => /[ఀ-౿]/.test(s || '');

  /** Shrinks an element's font so its text fits on one line, measured with canvas. */
  function fitOneLine(el, minRatio = 0.6) {
    if (!el || el.hidden) return;
    el.style.whiteSpace = '';
    el.style.fontSize = '';
    void el.offsetWidth; // reflow at the natural (possibly wrapped) size
    const cs = getComputedStyle(el);
    const boxWidth = el.clientWidth;
    const baseSize = parseFloat(cs.fontSize);
    const text = el.textContent.trim();
    if (!boxWidth || !baseSize || !text) return;
    const canvas = fitOneLine._canvas || (fitOneLine._canvas = document.createElement('canvas'));
    const ctx = canvas.getContext('2d');
    let size = baseSize;
    const minSize = baseSize * minRatio;
    ctx.font = `${cs.fontWeight} ${size}px ${cs.fontFamily}`;
    while (ctx.measureText(text).width > boxWidth - 1 && size > minSize) {
      size -= 0.5;
      ctx.font = `${cs.fontWeight} ${size}px ${cs.fontFamily}`;
    }
    el.style.whiteSpace = 'nowrap';
    el.style.fontSize = size + 'px';
  }

  /** Scales each page's contents down (never up) so everything fits on one screen. */
  function fitPages() {
    $$('.page .fit').forEach((fit) => {
      fit.style.setProperty('--k', 1);
      const box = fit.parentElement;
      const k = Math.min(1, box.clientHeight / fit.offsetHeight, box.clientWidth / fit.offsetWidth);
      fit.style.setProperty('--k', k.toFixed(3));
    });
  }

  function refitAddress() {
    fitOneLine($('.address'));
    $$('.date-row .side').forEach((el) => fitOneLine(el, 0.55));
    fitPages();
  }

  /* The page height is measured once (and again only on rotation), so the card
     does not re-flow when the phone's address bar slides in and out. */
  let lastW = 0, lastH = 0;
  function setAppHeight(force) {
    const w = window.innerWidth, h = window.innerHeight;
    if (!force && w === lastW && Math.abs(h - lastH) < 150) return false;
    lastW = w; lastH = h;
    document.documentElement.style.setProperty('--app-h', h + 'px');
    return true;
  }
  setAppHeight(true);
  window.addEventListener('resize', () => {
    clearTimeout(refitAddress._t);
    refitAddress._t = setTimeout(() => { if (setAppHeight()) refitAddress(); }, 150);
  });

  /** Shows the address as text, or as a tappable QR to the map link, per config. */
  function renderAddress(t) {
    const addrEl = $('.address');
    const qrEl = $('#addrQr');
    const map = (cfg.event && cfg.event.mapUrl) || '';
    const useQr = !!((cfg.event && cfg.event.showMapQr) && map);
    addrEl.hidden = useQr;
    qrEl.hidden = !useQr;
    $('#replayBtn').hidden = useQr; // keep the card short when the map QR takes the space
    if (useQr) {
      qrEl.href = map;
      const code = $('#addrQrCode');
      if (!code.dataset.for || code.dataset.for !== map) {
        code.innerHTML = GP.qrSvg(map, 3, 2);
        code.dataset.for = map;
      }
    }
    requestAnimationFrame(refitAddress);
  }

  function render() {
    const lang = guest.lang || cfg.lang || 'te';
    const t = Object.assign({}, cfg.text.en, cfg.text[lang]);
    document.documentElement.lang = lang;
    document.documentElement.className = 'lang-' + lang + (isPreview ? ' is-preview' : '');
    const theme = guest.theme || cfg.posterTheme || 'cream';
    ['cream', 'maroon', 'green'].forEach((th) => invite.classList.toggle('theme-' + th, th === theme));
    $$('.lang-opt').forEach((el) => el.classList.toggle('on', el.dataset.l === lang));

    $$('[data-t]').forEach((el) => { el.textContent = t[el.dataset.t] || ''; });

    const name = guest.name || t.guestFallback;
    const g1 = $('#guestName');
    g1.textContent = name;
    g1.classList.toggle('te', hasTelugu(name));

    const gl = $('#guestLine');
    gl.hidden = !guest.name;
    const g2 = $('#guestName2');
    g2.textContent = guest.name;
    g2.classList.toggle('te', hasTelugu(guest.name));

    $('.hosts').hidden = !(t.hosts || '').trim();
    const map = (cfg.event && cfg.event.mapUrl) || '';
    $('#mapBtn').hidden = !map;
    if (map) $('#mapBtn').href = map;
    $('#calBtn').hidden = !(cfg.event && cfg.event.start);
    renderAddress(t);
    renderSchedule(lang);
    renderBlessings(t);
    tickCountdown();
    $('#musicBtn').hidden = !(cfg.music && cfg.music.enabled);

    document.title = `${t.title1} ${t.title2}`.trim() + (guest.name ? ` · ${guest.name}` : '');
    return lang;
  }

  const curLang = () => guest.lang || cfg.lang || 'te';
  const curText = () => Object.assign({}, cfg.text.en, cfg.text[curLang()]);

  /* ---------- countdown ---------- */
  const setNum = (id, v) => {
    const el = $(id);
    const s = String(v);
    if (el.textContent !== s) { el.textContent = s; el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick'); }
  };

  function tickCountdown() {
    const t = curText();
    const start = new Date(cfg.event && cfg.event.start);
    const block = $('#cdBlock');
    // The gold "more" button on the card doubles as the countdown.
    const label = $('#moreLabel'), dot = $('#cdDot');
    const pill = { set hidden(h) { dot.hidden = h; if (h) label.textContent = t.scrollHint; } };
    if (isNaN(start)) { pill.hidden = true; block.hidden = true; return; }
    block.hidden = false;
    const now = new Date();
    const end = new Date(start.getTime() + (Number(cfg.event.durationMinutes) || 180) * 60000);
    const sameDay = start.toDateString() === now.toDateString();
    const diff = Math.max(0, start - now);
    const d = Math.floor(diff / 864e5), h = Math.floor(diff / 36e5) % 24, m = Math.floor(diff / 6e4) % 60, s = Math.floor(diff / 1e3) % 60;
    const grid = $('#cdGrid'), msg = $('#cdMsg');

    if (now >= end) {
      pill.hidden = true;
      grid.hidden = true;
      msg.hidden = false; msg.textContent = t.countdownDone;
    } else if (sameDay || diff === 0) {
      pill.hidden = false;
      label.textContent = t.countdownToday;
      msg.hidden = false; msg.textContent = t.countdownToday;
      grid.hidden = diff === 0;
      setNum('#cdD', d); setNum('#cdH', h); setNum('#cdM', m); setNum('#cdS', s);
    } else {
      pill.hidden = false;
      label.textContent = (t.countdownPill || '{d} · {h}').replace('{d}', d).replace('{h}', h);
      grid.hidden = false; msg.hidden = true;
      setNum('#cdD', d); setNum('#cdH', h); setNum('#cdM', m); setNum('#cdS', s);
    }
  }
  setInterval(tickCountdown, 1000);

  /* ---------- schedule ---------- */
  function fmtTime(hhmm, lang) {
    const [H, M] = String(hhmm || '').split(':').map(Number);
    if (isNaN(H)) return hhmm || '';
    const h12 = H % 12 || 12, mm = String(M || 0).padStart(2, '0');
    if (lang === 'te') {
      const p = H >= 4 && H < 12 ? 'ఉదయం' : H >= 12 && H < 16 ? 'మధ్యాహ్నం' : H >= 16 && H < 19 ? 'సాయంత్రం' : 'రాత్రి';
      return `${p} ${h12}:${mm}`;
    }
    return `${h12}:${mm} ${H < 12 ? 'AM' : 'PM'}`;
  }

  function renderSchedule(lang) {
    const items = (cfg.schedule || []).filter((x) => x && (x[lang] || x.en || x.te))
      .slice().sort((a, b) => String(a.time).localeCompare(String(b.time)));
    $('#schedBlock').hidden = !items.length;
    const start = new Date(cfg.event && cfg.event.start);
    const today = !isNaN(start) && start.toDateString() === new Date().toDateString();
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    const mins = (x) => { const [h, m] = String(x.time).split(':').map(Number); return h * 60 + (m || 0); };
    $('#timeline').innerHTML = items.map((x, i) => {
      const isNow = today && nowMin >= mins(x) && (i === items.length - 1 || nowMin < mins(items[i + 1]));
      return `<li class="${isNow ? 'now' : ''}"><span class="t-time">${GP.esc(fmtTime(x.time, lang))}</span><span class="t-what">${GP.esc(x[lang] || x.en || x.te)}</span></li>`;
    }).join('');
  }

  /* ---------- blessings ---------- */
  let blessTimer = null;
  function renderBlessings(t) {
    const lines = String(t.blessings || '').split(/\n+/).map((s) => s.trim()).filter(Boolean);
    const photo = cfg.blessingPhoto || '';
    $('#blessBlock').hidden = !lines.length && !photo;
    const fig = $('#blessPhoto');
    fig.hidden = !photo;
    if (photo && fig.querySelector('img').getAttribute('src') !== photo) fig.querySelector('img').src = photo;

    const box = $('#blessQuotes'), dots = $('#blessDots');
    box.innerHTML = lines.map((l, i) => `<q class="${i === 0 ? 'on' : ''}">${GP.esc(l)}</q>`).join('');
    dots.innerHTML = lines.length > 1 ? lines.map((_, i) => `<i class="${i === 0 ? 'on' : ''}"></i>`).join('') : '';
    clearInterval(blessTimer);
    if (lines.length > 1) {
      let i = 0;
      blessTimer = setInterval(() => {
        const qs = box.querySelectorAll('q'), ds = dots.querySelectorAll('i');
        qs[i].classList.remove('on'); ds[i].classList.remove('on');
        i = (i + 1) % qs.length;
        qs[i].classList.add('on'); ds[i].classList.add('on');
      }, 4500);
    }
  }

  /* ---------- music ---------- */
  const musicBtn = $('#musicBtn');
  function musicOpts() { return { url: (cfg.music && cfg.music.url) || '', volume: cfg.music && typeof cfg.music.volume === 'number' ? cfg.music.volume : 0.5 }; }
  function startMusic() {
    if (!(cfg.music && cfg.music.enabled) || isPreview) return;
    try { GPMusic.start(musicOpts()); musicBtn.setAttribute('aria-pressed', 'true'); } catch (e) { /* no audio support */ }
  }
  musicBtn.addEventListener('click', () => {
    const on = GPMusic.toggle(musicOpts());
    musicBtn.setAttribute('aria-pressed', String(on));
  });

  /* ---------- details section: scroll hint + reveal ---------- */
  $('#scrollHint').addEventListener('click', () => $('#more').scrollIntoView({ behavior: 'smooth' }));

  /* ---------- language switch: show the whole invitation again in the other language ---------- */
  let switching = false;
  $('#langBtn').addEventListener('click', async () => {
    if (switching) return;
    switching = true;
    const next = curLang() === 'te' ? 'en' : 'te';
    const veil = $('#veil');
    veil.classList.remove('hide');
    await Promise.race([GP.fontsReady(next), new Promise((r) => setTimeout(r, 2500))]);
    guest = Object.assign({}, guest, { lang: next });
    render();
    refitAddress();
    invite.style.scrollBehavior = 'auto';
    invite.scrollTop = 0;
    invite.style.scrollBehavior = '';
    $$('.reveal').forEach((el) => el.classList.remove('in'));
    invite.classList.remove('show', 'scrolled');
    void invite.offsetWidth;
    veil.classList.add('hide');
    invite.classList.add('show'); // replays the card animation in the new language
    switching = false;
  });
  invite.addEventListener('scroll', () => invite.classList.toggle('scrolled', invite.scrollTop > 40), { passive: true });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('in'); }),
      { root: invite, threshold: 0.15 });
    $$('.reveal').forEach((el) => io.observe(el));
  } else {
    $$('.reveal').forEach((el) => el.classList.add('in'));
  }

  /* ---------- door ---------- */
  function spawnPetals(count = 44) {
    const box = $('#petals');
    const colors = ['#f28c0f', '#ffc233', '#f5a623', '#e98fa0', '#fff6e8', '#d9364a'];
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const p = document.createElement('i');
      const w = 8 + Math.random() * 10;
      p.className = 'petal';
      p.style.cssText = `left:${Math.random() * 100}%;width:${w}px;height:${w * (1.2 + Math.random() * .5)}px;` +
        `background:${colors[i % colors.length]};--x:${(Math.random() * 240 - 120).toFixed(0)}px;` +
        `--r:${(Math.random() * 900 - 450).toFixed(0)}deg;--t:${(3.6 + Math.random() * 3).toFixed(2)}s;--d:${(Math.random() * 1.4).toFixed(2)}s`;
      frag.appendChild(p);
    }
    box.appendChild(frag);
    setTimeout(() => { box.innerHTML = ''; }, 9000);
  }

  function openDoor() {
    if (opened) return;
    opened = true;
    stage.classList.add('opening');
    spawnPetals();
    if (navigator.vibrate) { try { navigator.vibrate(20); } catch (e) { /* ignore */ } }
    setTimeout(() => invite.classList.add('show'), 700);
    setTimeout(() => musicBtn.classList.add('ready'), 2600);
  }

  /** The guest taps: the diya lights, the music begins, then the door opens. */
  let lighting = false;
  function lightDiya() {
    if (opened || lighting) return;
    lighting = true;
    stage.classList.add('lit');
    startMusic(); // inside the tap, so browsers allow sound
    if (navigator.vibrate) { try { navigator.vibrate(12); } catch (e) { /* ignore */ } }
    setTimeout(() => { lighting = false; openDoor(); }, 1150);
  }

  function resetDoor() {
    opened = false;
    lighting = false;
    invite.classList.remove('show', 'scrolled');
    invite.scrollTop = 0;
    stage.classList.add('instant');
    stage.classList.remove('opening', 'lit');
    void stage.offsetWidth;
    stage.classList.remove('instant');
    $('#openBtn').focus({ preventScroll: true });
  }

  stage.addEventListener('click', lightDiya);
  document.addEventListener('keydown', (e) => {
    if (!opened && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); lightDiya(); }
  });
  $('#replayBtn').addEventListener('click', resetDoor);

  /* ---------- calendar ---------- */
  function icsStamp(d) {
    const z = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}T${z(d.getHours())}${z(d.getMinutes())}00`;
  }
  const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPadOS reports as a Mac
  const isAndroid = () => /Android/i.test(navigator.userAgent);
  const utcStamp = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  /* Save date: Android → Google Calendar (opens the app when it's installed),
     iPhone / iPad → Apple Calendar's "Add event" sheet, computers → .ics file. */
  $('#calBtn').addEventListener('click', () => {
    const lang = guest.lang || cfg.lang;
    const t = Object.assign({}, cfg.text.en, cfg.text[lang]);
    const start = new Date(cfg.event.start);
    if (isNaN(start)) return;
    const end = new Date(start.getTime() + (Number(cfg.event.durationMinutes) || 180) * 60000);
    const title = `${t.title1} ${t.title2}`;
    const details = [t.hostsLabel, t.hosts, cfg.event.mapUrl].filter(Boolean).join(' — ');

    if (isAndroid()) {
      const g = new URL('https://calendar.google.com/calendar/render');
      g.search = new URLSearchParams({
        action: 'TEMPLATE', text: title, dates: `${utcStamp(start)}/${utcStamp(end)}`,
        details, location: t.address || '',
      }).toString();
      // A new tab keeps the invitation open behind it; some in-app browsers block that, so fall back.
      // ('noopener' would make window.open return null, so the opener is cut by hand.)
      const w = window.open(g.href, '_blank');
      if (w) w.opener = null; else location.href = g.href;
      return;
    }

    const clean = (s) => String(s || '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//GrihaPravesam//EN', 'BEGIN:VEVENT',
      `UID:${Date.now()}@grihapravesam`, `DTSTAMP:${icsStamp(new Date())}`,
      `DTSTART:${icsStamp(start)}`, `DTEND:${icsStamp(end)}`,
      `SUMMARY:${clean(title)}`, `LOCATION:${clean(t.address)}`,
      `DESCRIPTION:${clean(details)}`,
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
    if (isIOS()) {
      // Safari opens a text/calendar page straight in Calendar's "Add event" sheet;
      // a downloaded .ics would only land in Files.
      location.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    a.download = 'griha-pravesam.ics';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });

  /* ---------- editor preview bridge ---------- */
  if (isPreview) {
    document.documentElement.classList.add('is-preview');
    document.addEventListener('click', (e) => {
      const el = e.target.closest('[data-t], [data-edit]');
      if (!el || !window.parent || window.parent === window) return;
      e.preventDefault(); e.stopPropagation();
      window.parent.postMessage({ type: 'gp:focus', key: el.dataset.t || el.dataset.edit }, location.protocol === 'file:' ? '*' : location.origin);
    }, true);
    window.addEventListener('message', (e) => {
      if (e.origin !== location.origin && location.protocol !== 'file:') return;
      const m = e.data || {};
      if (m.type === 'gp:config') {
        cfg = m.config;
        guest = { name: m.guestName || '', lang: m.lang || null };
        render();
      } else if (m.type === 'gp:replay') {
        resetDoor();
        if (m.skipDoor) setTimeout(openDoor, 60);
      } else if (m.type === 'gp:more') {
        const wasOpen = opened;
        if (!wasOpen) openDoor();
        setTimeout(() => $('#more').scrollIntoView({ behavior: 'smooth' }), wasOpen ? 0 : 900);
      }
    });
  }

  /* ---------- boot ---------- */
  const lang = render();
  const hideVeil = () => $('#veil').classList.add('hide');
  // Wait for the real fonts and do all the sizing *before* the guest sees anything,
  // so nothing shifts on screen afterwards.
  Promise.race([GP.fontsReady(lang), new Promise((r) => setTimeout(r, 4000))]).then(() => {
    refitAddress();
    requestAnimationFrame(() => { refitAddress(); hideVeil(); });
    setTimeout(() => GP.fontsReady(lang === 'te' ? 'en' : 'te'), 3000); // warm up the other language
    if (params.has('nodoor')) { stage.classList.add('instant'); openDoor(); }
  });

  /* ---------- offline: cache the invitation after the first visit ---------- */
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !isPreview) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
