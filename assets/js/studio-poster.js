/* Poster studio: name → poster + QR → share. */
(function () {
  const $ = (s) => document.querySelector(s);
  const cfg = GP.loadConfig();
  let lang = cfg.lang || 'te';
  const THEME_KEY = 'gp.posterTheme';
  let theme = (() => { try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; } })() || cfg.posterTheme || 'cream';
  if (!GPPoster.THEMES[theme]) theme = 'cream';
  let current = { name: '', url: '', cardUrl: '' };
  let renderId = 0;

  const nameEl = $('#name');
  const canvas = $('#poster');
  const frame = $('#frame');

  /* ---------- helpers ---------- */
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2200);
  }
  const text = () => Object.assign({}, cfg.text.en, cfg.text[lang]);
  const slug = (s) => (s || 'guest').normalize('NFC').replace(/[^\p{L}\p{M}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 40) || 'guest';

  function message() {
    const t = text();
    const greet = lang === 'te'
      ? `${current.name || t.guestFallback} గారికి, ${t.title1} ${t.title2} ఆహ్వానం 🙏`
      : `Dear ${current.name || t.guestFallback}, you're invited to our ${t.title1} ${t.title2} 🙏`;
    const tap = lang === 'te' ? '👇 మీ పోస్టర్ చూసి, దానిపై QR ని తాకండి' : '👇 Open your poster and tap the QR on it';
    // The link sits on its own line so WhatsApp turns the whole thing into one tappable link.
    // It opens card.html: the same poster, with the QR tappable.
    return `${greet}\n\n${tap}\n${current.cardUrl}`;
  }

  function remember(name, action) {
    if (!name) return;
    GP.invites.record(name, lang, action, theme);
    drawRecent();
  }
  function drawRecent() {
    const box = $('#recent');
    const list = GP.invites.list().slice(0, 12);
    box.innerHTML = list.length ? '' : '<span style="color:var(--ink-2);font-size:15px">Names you share will show up here.</span>';
    list.forEach((r) => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.innerHTML = `<span>${GP.esc(r.name)}</span><button class="x" type="button" aria-label="Remove ${GP.esc(r.name)}">×</button>`;
      chip.firstChild.addEventListener('click', () => { nameEl.value = r.name; setLang(r.lang || lang, false); update(); });
      chip.querySelector('.x').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Remove ${r.name} from the guest list?`)) { GP.invites.remove(r.id); drawRecent(); }
      });
      box.appendChild(chip);
    });
  }

  function setLang(l, rerender = true) {
    lang = l;
    document.querySelectorAll('#langSeg button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === l)));
    if (rerender) update();
  }

  /* ---------- render ---------- */
  async function update() {
    const id = ++renderId;
    current.name = nameEl.value.trim();
    current.url = GP.guestUrl(cfg, current.name, lang, theme);
    current.cardUrl = GP.cardUrl(cfg, current.name, lang, theme);

    $('#linkBox').textContent = current.url;
    $('#openBtn').href = current.url;
    $('#waBtn').href = 'https://wa.me/?text=' + encodeURIComponent(message());
    $('#localWarn').hidden = !GP.isLocalAddress(current.url);

    frame.classList.add('loading');
    try {
      const off = document.createElement('canvas');
      await GPPoster.render(cfg, { name: current.name, lang, url: current.url, canvas: off, theme });
      if (id !== renderId) return;
      canvas.getContext('2d').drawImage(off, 0, 0);
      // Prepare the file now: phones only allow sharing straight after a tap.
      posterFile = null;
      const b = await new Promise((res) => off.toBlob(res, 'image/png'));
      if (id === renderId && b) posterFile = new File([b], fileName(), { type: 'image/png' });
    } catch (e) {
      console.error(e);
      toast('Could not draw the poster. Check your internet connection for fonts and the QR library.');
    } finally {
      if (id === renderId) frame.classList.remove('loading');
    }
  }

  let posterFile = null;
  const blob = () => new Promise((res) => canvas.toBlob(res, 'image/png'));
  const fileName = () => `griha-pravesam-${slug(current.name)}.png`;

  async function download(track = true) {
    const b = await blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b); a.download = fileName(); a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
    if (track) remember(current.name, 'download');
    toast('Poster saved');
  }

  const canShareFile = (f) => !!(f && navigator.canShare && navigator.canShare({ files: [f] }));

  /** Shares the poster image with the invitation text as its caption. On a phone this
      opens the share sheet; pick WhatsApp and it sends the picture with the link. */
  async function share(action = 'share') {
    const file = posterFile;
    const msg = message();
    if (canShareFile(file)) {
      try {
        await navigator.share({ files: [file], text: msg });
        remember(current.name, action);
        // Some apps drop the caption when an image is attached, so keep it ready to paste.
        GP.copyText(msg).then((ok) => ok && toast('Sent. The message is also copied, in case it needs pasting'));
      } catch (e) {
        if (e.name !== 'AbortError') { toast('Sharing failed. Saving the poster instead.'); download(false); remember(current.name, action); }
      }
      return;
    }
    // Computers and older phones: save the poster, then open WhatsApp with the message.
    await download(false);
    remember(current.name, action);
    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank', 'noopener');
    toast('Poster saved. Attach it in WhatsApp with the 📎 button');
  }

  async function copy() {
    const ok = await GP.copyText(current.url);
    toast(ok ? 'Link copied' : 'Could not copy. Press and hold the link to copy it');
    remember(current.name, 'copy');
  }

  /* ---------- themes ---------- */
  function drawThemes() {
    const box = $('#themeSeg');
    box.innerHTML = Object.entries(GPPoster.THEMES).map(([key, th]) => `
      <button type="button" class="theme-swatch" data-theme="${key}" aria-pressed="${key === theme}">
        <span class="sw" style="background:radial-gradient(circle at 50% 38%, ${th.bg[0]}, ${th.bg[1]} 55%, ${th.bg[2]});">
          <span style="color:${th.ink}">ॐ</span>
        </span>
        <span class="lbl">${GP.esc(th.label)}</span>
      </button>`).join('');
    box.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      theme = b.dataset.theme;
      try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* ignore */ }
      box.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      update();
    }));
  }

  /* ---------- batch: many names → one ZIP ---------- */
  let batching = false;
  async function batchZip() {
    if (batching) return;
    const names = [...new Set($('#batchNames').value.split(/\n+/).map((s) => s.trim()).filter(Boolean))];
    if (!names.length) { toast('Type at least one name, one per line'); return; }
    if (typeof JSZip !== 'function') { toast('ZIP library did not load. Check your internet connection.'); return; }
    batching = true;
    const btn = $('#batchBtn'), bar = $('#batchBar'), note = $('#batchNote');
    btn.disabled = true;
    $('#batchProg').hidden = false;
    const zip = new JSZip();
    const csv = [['#', 'Guest', 'Language', 'Link', 'File']];
    try {
      for (let i = 0; i < names.length; i++) {
        const name = names[i];
        note.textContent = `Painting ${i + 1} of ${names.length}: ${name}`;
        bar.style.width = `${Math.round((i / names.length) * 100)}%`;
        const url = GP.guestUrl(cfg, name, lang, theme);
        const cv = document.createElement('canvas');
        await GPPoster.render(cfg, { name, lang, url, canvas: cv, theme });
        const png = await new Promise((res) => cv.toBlob(res, 'image/png'));
        const file = `${String(i + 1).padStart(2, '0')}-${slug(name)}.png`;
        zip.file(file, png);
        csv.push([i + 1, name, lang === 'te' ? 'Telugu' : 'English', url, file]);
        GP.invites.record(name, lang, 'download', theme);
      }
      const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
      zip.file('guest-links.csv', '﻿' + csv.map((r) => r.map(q).join(',')).join('\r\n'));
      note.textContent = 'Packing the ZIP…';
      bar.style.width = '100%';
      const out = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(out);
      a.download = `griha-pravesam-posters-${names.length}.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      note.textContent = `Done: ${names.length} poster${names.length > 1 ? 's' : ''} saved, plus a list of links.`;
      toast('ZIP saved');
      drawRecent();
    } catch (e) {
      console.error(e);
      note.textContent = 'Something went wrong while painting. Try again.';
    } finally {
      batching = false;
      btn.disabled = false;
    }
  }

  /* ---------- wire up ---------- */
  let deb;
  nameEl.addEventListener('input', () => { clearTimeout(deb); deb = setTimeout(update, 250); });
  nameEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') nameEl.blur(); });
  document.querySelectorAll('#langSeg button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
  $('#shareBtn').addEventListener('click', () => share());
  $('#shareBtn2').addEventListener('click', () => share());
  $('#dlBtn').addEventListener('click', download);
  $('#dlBtn2').addEventListener('click', download);
  $('#copyBtn').addEventListener('click', copy);
  $('#waBtn').addEventListener('click', (e) => { e.preventDefault(); share('whatsapp'); });
  $('#batchBtn').addEventListener('click', batchZip);
  $('#batchNames').addEventListener('input', (e) => {
    const n = new Set(e.target.value.split(/\n+/).map((s) => s.trim()).filter(Boolean)).size;
    $('#batchCount').textContent = n ? `${n} name${n > 1 ? 's' : ''}` : '';
  });
  drawThemes();

  const q = new URLSearchParams(location.search);
  if (q.get('name')) nameEl.value = q.get('name');
  setLang(q.get('l') === 'en' || q.get('l') === 'te' ? q.get('l') : lang, false);
  drawRecent();
  update();
})();
