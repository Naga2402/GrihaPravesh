/* Text / event editor with live preview. */
(function () {
  const $ = (s) => document.querySelector(s);
  const published = GP.clone(window.GP_CONFIG);
  let cfg = GP.loadConfig();
  let editLang = cfg.lang || 'te';

  const SCHEMA = [
    { legend: 'Door screen (before it opens)', fields: [
      ['welcome', 'Welcome heading'], ['dear', 'Line above the guest name'],
      ['guestFallback', 'Name shown when the link has no guest'], ['lightDiya', 'Diya prompt'],
    ] },
    { legend: 'Invitation card', fields: [
      ['topLine', 'Top line'], ['title1', 'Title, line 1'], ['title2', 'Title, line 2'], ['subLine', 'Line under the title', true],
    ] },
    { legend: 'Date & time (as printed)', cols: 'two', dates: true, fields: [
      ['weekday', 'Weekday'], ['time', 'Time'], ['month', 'Month'], ['day', 'Day'], ['year', 'Year'],
    ] },
    { legend: 'Venue & hosts', fields: [
      ['atLabel', 'Venue label'], ['address', 'Address', true], ['hostsLabel', 'Hosts label'], ['hosts', 'Hosts'],
    ] },
    { legend: 'Countdown & details section', hint: 'In the card countdown, {d} becomes the days and {h} the hours.', fields: [
      ['countdownPill', 'Countdown on the card'], ['countdownTitle', 'Countdown heading'],
      ['countdownToday', 'On the day'], ['countdownDone', 'After the event'],
      ['scheduleTitle', 'Schedule heading'], ['scrollHint', '“More details” button'],
    ] },
    { legend: 'Countdown units', cols: 'two', fields: [
      ['unitDays', 'Days'], ['unitHours', 'Hours'], ['unitMinutes', 'Minutes'], ['unitSeconds', 'Seconds'],
    ] },
    { legend: 'Poster', fields: [
      ['posterFor', 'Line above the guest name'], ['posterScan', 'Text under the QR code'], ['mapQrCaption', 'Text beside the map QR'],
      ['posterTapQr', 'Poster page: “tap the QR” hint'], ['posterOpen', 'Poster page: open button'],
    ] },
    { legend: 'Buttons', cols: 'three', fields: [
      ['directions', 'Directions'], ['calendar', 'Calendar'], ['replay', 'Replay'],
    ] },
  ];

  /* ---------- date → words, in both languages ---------- */
  const TE_MONTHS = ['జనవరి', 'ఫిబ్రవరి', 'మార్చి', 'ఏప్రిల్', 'మే', 'జూన్', 'జూలై', 'ఆగస్టు', 'సెప్టెంబర్', 'అక్టోబర్', 'నవంబర్', 'డిసెంబర్'];
  const TE_DAYS = ['ఆదివారం', 'సోమవారం', 'మంగళవారం', 'బుధవారం', 'గురువారం', 'శుక్రవారం', 'శనివారం'];
  const EN_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const EN_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const DATE_KEYS = ['weekday', 'month', 'day', 'year', 'time'];

  function dateWords(start) {
    const d = new Date(start);
    if (isNaN(d)) return null;
    const h = d.getHours(), m = d.getMinutes();
    const h12 = h % 12 || 12;
    const hm = m ? `${h12}:${String(m).padStart(2, '0')}` : `${h12}`;
    const tePeriod = h >= 4 && h < 12 ? 'ఉదయం' : h >= 12 && h < 16 ? 'మధ్యాహ్నం' : h >= 16 && h < 19 ? 'సాయంత్రం' : 'రాత్రి';
    return {
      te: { weekday: TE_DAYS[d.getDay()], month: TE_MONTHS[d.getMonth()], day: String(d.getDate()), year: String(d.getFullYear()), time: `${tePeriod} ${hm} గం.` },
      en: { weekday: EN_DAYS[d.getDay()], month: EN_MONTHS[d.getMonth()], day: String(d.getDate()), year: String(d.getFullYear()), time: `At ${hm} ${h < 12 ? 'AM' : 'PM'}` },
    };
  }

  function applyDate() {
    const date = $('#evDate').value, time = $('#evTime').value || '08:00';
    if (!date) return;
    cfg.event.start = `${date}T${time}`;
    const w = dateWords(cfg.event.start);
    if (!w) return;
    ['te', 'en'].forEach((l) => { cfg.text[l] = cfg.text[l] || {}; DATE_KEYS.forEach((k) => { cfg.text[l][k] = w[l][k]; }); });
    buildForm(); showDateChip(); changed();
  }

  function showDateChip() {
    const t = cfg.text;
    const te = t.te || {}, en = t.en || {};
    $('#dateChip').innerHTML = cfg.event.start
      ? `<span lang="te">${GP.esc(te.weekday)}, ${GP.esc(te.day)} ${GP.esc(te.month)} ${GP.esc(te.year)} · ${GP.esc(te.time)}</span><span>${GP.esc(en.weekday)}, ${GP.esc(en.day)} ${GP.esc(en.month)} ${GP.esc(en.year)} · ${GP.esc(en.time)}</span>`
      : '';
  }

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2200);
  }

  /** The switch that replaces the printed address with a QR to the Google Maps link. */
  function buildMapQrToggle() {
    const wrap = document.createElement('div');
    wrap.className = 'toggle-field';
    const on = !!(cfg.event && cfg.event.showMapQr);
    const hasMap = !!(cfg.event && cfg.event.mapUrl);
    wrap.innerHTML = `<span class="toggle-text"><b>Show a QR code instead of the address</b>
      <small>${hasMap ? 'Guests scan it to open Google Maps.' : 'Add a Google Maps link below first.'}</small></span>`;
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'switch'; btn.setAttribute('role', 'switch');
    btn.setAttribute('aria-checked', String(on));
    btn.setAttribute('aria-label', 'Show a QR code instead of the address');
    btn.innerHTML = '<span class="knob"></span>';
    btn.addEventListener('click', () => {
      cfg.event.showMapQr = !cfg.event.showMapQr;
      if (cfg.event.showMapQr && !cfg.event.mapUrl) toast('Add a Google Maps link below, so the QR has somewhere to go');
      changed(); buildForm();
    });
    wrap.appendChild(btn);
    return wrap;
  }

  /* ---------- build form ---------- */
  function buildForm() {
    const form = $('#textForm');
    form.innerHTML = '';
    const t = cfg.text[editLang] || (cfg.text[editLang] = {});
    const other = editLang === 'te' ? 'en' : 'te';
    SCHEMA.forEach((grp) => {
      const fs = document.createElement('fieldset');
      fs.className = 'fieldset';
      fs.innerHTML = `<legend>${grp.legend}</legend>` +
        (grp.dates ? '<p class="fs-hint">Filled in from the date picker above. Change the words here if you want your own wording.</p>' : '') +
        (grp.hint ? `<p class="fs-hint">${GP.esc(grp.hint)}</p>` : '');
      const box = grp.cols ? Object.assign(document.createElement('div'), { className: grp.cols }) : fs;
      grp.fields.forEach(([key, label, multi]) => {
        const hint = (cfg.text[other] || {})[key] || '';
        const l = document.createElement('label');
        l.className = 'field';
        l.innerHTML = `<span>${label}${hint ? `<em title="${GP.esc(hint)}">${GP.esc(hint.length > 22 ? hint.slice(0, 22) + '…' : hint)}</em>` : ''}</span>`;
        const input = document.createElement(multi ? 'textarea' : 'input');
        if (!multi) input.type = 'text';
        if (multi) input.rows = 2;
        input.value = t[key] || '';
        input.lang = editLang;
        input.dataset.key = key;
        input.addEventListener('input', () => {
          cfg.text[editLang][key] = input.value; changed();
          if (DATE_KEYS.includes(key)) showDateChip();
        });
        l.appendChild(input);
        box.appendChild(l);
        if (key === 'address' && grp.legend === 'Venue & hosts') box.appendChild(buildMapQrToggle());
      });
      if (grp.cols) fs.appendChild(box);
      form.appendChild(fs);
    });
  }

  function fillEvent() {
    $('#defaultLang').value = cfg.lang || 'te';
    const start = (cfg.event && cfg.event.start) || '';
    $('#evDate').value = start.slice(0, 10);
    $('#evTime').value = start.slice(11, 16);
    showDateChip();
    $('#evDuration').value = (cfg.event && cfg.event.durationMinutes) || 180;
    $('#evMap').value = (cfg.event && cfg.event.mapUrl) || '';
    $('#siteUrl').value = cfg.siteUrl || '';
    fillExtras();
  }

  /* ---------- blessings (both languages at once) + photo ---------- */
  function fillBlessings() {
    document.querySelectorAll('#sec-blessings [data-key]').forEach((el) => {
      el.value = ((cfg.text[el.dataset.lang] || {})[el.dataset.key]) || '';
    });
    const photo = cfg.blessingPhoto || '';
    $('#photoImg').hidden = !photo;
    if (photo) $('#photoImg').src = photo;
    $('#photoEmpty').hidden = !!photo;
    $('#photoChange').hidden = !photo;
    $('#photoRemove').hidden = !photo;
  }
  document.querySelectorAll('#sec-blessings [data-key]').forEach((el) => el.addEventListener('input', () => {
    cfg.text[el.dataset.lang] = cfg.text[el.dataset.lang] || {};
    cfg.text[el.dataset.lang][el.dataset.key] = el.value;
    changed();
  }));

  /** Shrinks a photo to at most 640px, as JPEG, so config.js stays small. */
  function loadPhoto(file) {
    if (!file || !/^image\//.test(file.type)) { toast('Please choose a photo'); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const max = 640, k = Math.min(1, max / Math.max(img.width, img.height));
      const cv = Object.assign(document.createElement('canvas'), { width: Math.round(img.width * k), height: Math.round(img.height * k) });
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      cfg.blessingPhoto = cv.toDataURL('image/jpeg', 0.82);
      URL.revokeObjectURL(url);
      fillBlessings(); changed();
      toast(`Photo added (${Math.round(cfg.blessingPhoto.length / 1024)} KB)`);
    };
    img.onerror = () => { URL.revokeObjectURL(url); toast('That photo could not be read'); };
    img.src = url;
  }
  $('#photoFile').addEventListener('change', (e) => { loadPhoto(e.target.files[0]); e.target.value = ''; });
  const drop = $('#photoDrop');
  ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('ring-4', 'ring-gold-300'); }));
  ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('ring-4', 'ring-gold-300'); }));
  drop.addEventListener('drop', (e) => loadPhoto(e.dataTransfer.files[0]));
  $('#photoRemove').addEventListener('click', () => { cfg.blessingPhoto = ''; fillBlessings(); changed(); });

  /* ---------- schedule editor ---------- */
  function renderScheduleEditor() {
    const list = $('#schedList');
    const items = cfg.schedule || (cfg.schedule = []);
    list.innerHTML = items.length ? '' : '<li class="rounded-2xl border border-dashed border-gold-500/40 p-5 text-center text-[15px] text-ink-soft">No items yet: the timeline is hidden.</li>';
    items.forEach((it, i) => {
      const li = document.createElement('li');
      li.className = 'sched-row';
      li.innerHTML = `
        <input type="time" value="${GP.esc(it.time || '')}" aria-label="Time" data-f="time">
        <input type="text" lang="te" value="${GP.esc(it.te || '')}" placeholder="తెలుగు" aria-label="Telugu" data-f="te">
        <input type="text" value="${GP.esc(it.en || '')}" placeholder="English" aria-label="English" data-f="en">
        <span class="sched-tools">
          <button type="button" class="icon-mini" data-a="up" aria-label="Move up" ${i === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" class="icon-mini" data-a="down" aria-label="Move down" ${i === items.length - 1 ? 'disabled' : ''}>↓</button>
          <button type="button" class="icon-mini danger" data-a="del" aria-label="Remove">✕</button>
        </span>`;
      li.querySelectorAll('[data-f]').forEach((inp) => inp.addEventListener('input', () => { items[i][inp.dataset.f] = inp.value; changed(); }));
      li.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => {
        const a = b.dataset.a;
        if (a === 'del') items.splice(i, 1);
        if (a === 'up' && i > 0) [items[i - 1], items[i]] = [items[i], items[i - 1]];
        if (a === 'down' && i < items.length - 1) [items[i + 1], items[i]] = [items[i], items[i + 1]];
        renderScheduleEditor(); changed();
      }));
      list.appendChild(li);
    });
  }
  $('#schedAdd').addEventListener('click', () => {
    (cfg.schedule = cfg.schedule || []).push({ time: '', te: '', en: '' });
    renderScheduleEditor(); changed();
    const rows = document.querySelectorAll('#schedList .sched-row');
    rows[rows.length - 1].querySelector('input').focus();
  });
  $('#schedSort').addEventListener('click', () => {
    (cfg.schedule || []).sort((a, b) => String(a.time || '99').localeCompare(String(b.time || '99')));
    renderScheduleEditor(); changed();
  });

  /* ---------- music + default poster theme ---------- */
  function fillMusic() {
    cfg.music = Object.assign({ enabled: true, url: '', volume: 0.5 }, cfg.music);
    $('#musicToggle').setAttribute('aria-checked', String(!!cfg.music.enabled));
    $('#musicOpts').classList.toggle('opacity-50', !cfg.music.enabled);
    selectTrack(cfg.music.url || '');
    $('#musicVol').value = Math.round((cfg.music.volume ?? 0.5) * 100);
    $('#volLabel').textContent = `${$('#musicVol').value}%`;
  }

  /* The dropdown lists the audio files in assets/audio. Locally the folder listing is
     read directly; on a hosted site (no folder listings) assets/audio/tracks.json is used. */
  const AUDIO_DIR = 'assets/audio/';
  const AUDIO_RE = /\.(mp3|m4a|aac|ogg|oga|wav|webm)$/i;
  let tracks = [];
  const trackLabel = (file) => decodeURIComponent(file.replace(/^.*\//, '')).replace(AUDIO_RE, '')
    .replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/\b\w/g, (c) => c.toUpperCase());

  async function loadTracks() {
    const found = new Set();
    try {
      const res = await fetch(AUDIO_DIR, { cache: 'no-store' });
      if (res.ok && /html/i.test(res.headers.get('content-type') || '')) {
        const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
        doc.querySelectorAll('a[href]').forEach((a) => {
          const href = a.getAttribute('href').split(/[?#]/)[0];
          if (AUDIO_RE.test(href) && !href.includes('/')) found.add(decodeURIComponent(href));
        });
      }
    } catch (e) { /* no folder listing on this host */ }
    try {
      const res = await fetch(AUDIO_DIR + 'tracks.json', { cache: 'no-store' });
      if (res.ok) (await res.json()).forEach((f) => { if (AUDIO_RE.test(f)) found.add(String(f).replace(/^.*\//, '')); });
    } catch (e) { /* no manifest */ }
    tracks = [...found].sort((a, b) => a.localeCompare(b)).map((f) => AUDIO_DIR + f);
    $('#musicFound').textContent = tracks.length ? `${tracks.length} song${tracks.length > 1 ? 's' : ''} in assets/audio` : 'no songs in assets/audio yet';
    selectTrack(cfg.music.url || '');
  }

  function selectTrack(url) {
    const sel = $('#musicUrl');
    const list = tracks.slice();
    if (url && !list.includes(url)) list.push(url); // keep a saved choice even if the file is missing
    sel.innerHTML = '<option value="">Built-in veena tune (raga Mohanam)</option>' + list.map((u) =>
      `<option value="${GP.esc(u)}">${GP.esc(trackLabel(u))}${tracks.includes(u) ? '' : ' (file not found)'}</option>`).join('');
    sel.value = url;
  }
  const musicOpts = () => ({ url: cfg.music.url || '', volume: cfg.music.volume ?? 0.5 });
  function setTestState(on) {
    $('#musicTestLabel').textContent = on ? 'Stop' : 'Listen';
    $('#musicTestIcon').innerHTML = on ? '<path d="M7 5h4v14H7zM13 5h4v14h-4z"/>' : '<path d="M8 5v14l11-7z"/>';
  }
  $('#musicToggle').addEventListener('click', () => { cfg.music.enabled = !cfg.music.enabled; fillMusic(); changed(); });
  $('#musicUrl').addEventListener('input', (e) => {
    cfg.music.url = e.target.value.trim(); changed();
    if (GPMusic.playing) { GPMusic.stop(); setTestState(false); }
  });
  $('#musicVol').addEventListener('input', (e) => {
    cfg.music.volume = Number(e.target.value) / 100;
    $('#volLabel').textContent = `${e.target.value}%`;
    changed();
    if (GPMusic.playing) GPMusic.start(musicOpts());
  });
  $('#musicTest').addEventListener('click', () => setTestState(GPMusic.toggle(musicOpts())));
  loadTracks();

  function drawThemeDefault() {
    const box = $('#themeDefault');
    const cur = cfg.posterTheme || 'cream';
    box.innerHTML = Object.entries(GPPoster.THEMES).map(([key, th]) => `
      <button type="button" class="theme-swatch" data-theme="${key}" aria-pressed="${key === cur}">
        <span class="sw" style="background:radial-gradient(circle at 50% 38%, ${th.bg[0]}, ${th.bg[1]} 55%, ${th.bg[2]});"><span style="color:${th.ink}">ॐ</span></span>
        <span class="lbl">${GP.esc(th.label)}</span>
      </button>`).join('');
    box.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { cfg.posterTheme = b.dataset.theme; drawThemeDefault(); changed(); }));
  }

  function fillExtras() {
    fillBlessings();
    renderScheduleEditor();
    fillMusic();
    drawThemeDefault();
  }

  /* ---------- section jump bar: highlight where you are ---------- */
  const secLinks = [...document.querySelectorAll('#secNav a')];
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      secLinks.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === `#${e.target.id}`));
    }), { rootMargin: '-40% 0px -55% 0px' });
    secLinks.forEach((a) => { const t = document.querySelector(a.getAttribute('href')); if (t) spy.observe(t); });
  }

  /* ---------- state ---------- */
  let deb;
  function changed() {
    GP.saveDraft(cfg);
    updateStatus();
    clearTimeout(deb); deb = setTimeout(pushPreview, 120);
  }

  function updateStatus() {
    const draft = JSON.stringify(cfg) !== JSON.stringify(published);
    $('#dot').classList.toggle('draft', draft);
    $('#statusText').textContent = draft
      ? 'Unpublished edits on this device. Export config.js to publish.'
      : 'Matches published config.js';
  }

  /* ---------- preview ---------- */
  const frame = $('#preview');
  function pushPreview() {
    if (!frame.contentWindow) return;
    frame.contentWindow.postMessage({ type: 'gp:config', config: cfg, guestName: $('#pvName').value.trim(), lang: editLang }, '*');
  }
  frame.addEventListener('load', () => setTimeout(pushPreview, 50));
  $('#pvName').addEventListener('input', () => { clearTimeout(deb); deb = setTimeout(pushPreview, 150); });
  $('#pvDoor').addEventListener('click', () => { pushPreview(); frame.contentWindow.postMessage({ type: 'gp:replay', skipDoor: false }, '*'); });
  $('#pvCard').addEventListener('click', () => { pushPreview(); frame.contentWindow.postMessage({ type: 'gp:replay', skipDoor: true }, '*'); });

  // Tapping text in the preview jumps to the box that edits it.
  window.addEventListener('message', (e) => {
    const m = e.data || {};
    if (m.type !== 'gp:focus' || e.source !== frame.contentWindow) return;
    const k = CSS.escape(m.key);
    const input = document.querySelector(`#textForm [data-key="${k}"]`)
      || document.querySelector(`[data-key="${k}"][data-lang="${editLang}"]`)
      || document.querySelector(`[data-key="${k}"]`);
    if (!input) {
      const sec = { schedule: '#sec-schedule', blessingPhoto: '#sec-blessings', blessings: '#sec-blessings' }[m.key];
      if (sec) $(sec).scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    input.focus({ preventScroll: true });
    input.select && input.select();
    const f = input.closest('.field');
    f.classList.remove('flash'); void f.offsetWidth; f.classList.add('flash');
  });
  $('#pvMore').addEventListener('click', () => frame.contentWindow.postMessage({ type: 'gp:more' }, '*'));

  /* ---------- wiring ---------- */
  document.querySelectorAll('#editLang button').forEach((b) => b.addEventListener('click', () => {
    editLang = b.dataset.lang;
    document.querySelectorAll('#editLang button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    buildForm(); pushPreview();
  }));
  $('#defaultLang').addEventListener('change', (e) => { cfg.lang = e.target.value; changed(); });
  $('#evDate').addEventListener('change', () => { applyDate(); toast('Date updated in తెలుగు & English'); });
  $('#evTime').addEventListener('change', () => { applyDate(); toast('Time updated in తెలుగు & English'); });
  $('#evDuration').addEventListener('input', (e) => { cfg.event.durationMinutes = Number(e.target.value) || 180; changed(); });
  $('#evMap').addEventListener('input', (e) => { cfg.event.mapUrl = e.target.value.trim(); changed(); });
  $('#siteUrl').addEventListener('input', (e) => { cfg.siteUrl = e.target.value.trim(); changed(); });

  $('#exportBtn').addEventListener('click', () => {
    const header = `/*\n * GrihaPravesam — event configuration (exported ${new Date().toLocaleString()}).\n * Replace config.js in the project folder with this file and redeploy.\n */\n`;
    const body = `window.GP_CONFIG = ${JSON.stringify(cfg, null, 2)};\n`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([header + body], { type: 'text/javascript' }));
    a.download = 'config.js'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
    toast('config.js exported');
  });

  $('#importFile').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const raw = await f.text();
      const json = raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1);
      const parsed = JSON.parse(json);
      if (!parsed.text) throw new Error('no text');
      cfg = GP.deepMerge(GP.clone(published), parsed);
      buildForm(); fillEvent(); changed();
      toast('Imported');
    } catch (err) { toast('That file does not look like a config.js'); }
    e.target.value = '';
  });

  $('#resetBtn').addEventListener('click', () => {
    if (!confirm('Discard all edits on this device and go back to the published config.js?')) return;
    GP.clearDraft();
    cfg = GP.clone(published);
    buildForm(); fillEvent(); updateStatus(); pushPreview();
    toast('Edits discarded');
  });

  cfg.event = cfg.event || {};
  cfg.text = cfg.text || { te: {}, en: {} };
  document.querySelectorAll('#editLang button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.lang === editLang)));
  buildForm(); fillEvent(); updateStatus();
})();
