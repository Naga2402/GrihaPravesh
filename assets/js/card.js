/* Guest poster page: their poster, with the QR made tappable. Tapping it shows their link. */
(function () {
  const $ = (s) => document.querySelector(s);
  const cfg = GP.loadConfig();
  const guest = GP.readGuest();
  const lang = guest.lang || cfg.lang || 'te';
  const theme = guest.theme || cfg.posterTheme || 'cream';
  const t = Object.assign({}, cfg.text.en, cfg.text[lang]);
  // The same link the printed QR holds, so tapping and scanning land in the same place.
  const url = GP.guestUrl(cfg, guest.name, lang, theme);

  document.documentElement.lang = lang;
  const hint = t.posterTapQr || 'Tap the QR to open your invitation';
  $('#qrLabel').textContent = hint;
  $('#bubble').textContent = hint;
  $('#sheetTitle').textContent = guest.name || t.guestFallback;
  $('#openLabel').textContent = t.posterOpen || 'Open my invitation';
  $('#sheetLink').textContent = url;
  $('#sheetLink').href = url;
  $('#openBtn').href = url;

  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg; el.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), 2200);
  }

  /* ---------- sheet with the link ---------- */
  const hot = $('#qrHot');
  function openSheet() {
    $('#sheetBg').hidden = false; $('#sheet').hidden = false;
    requestAnimationFrame(() => document.body.classList.add('sheet-open'));
    $('#openBtn').focus({ preventScroll: true });
    // Once they've found the QR, the nudge has done its job.
    document.body.classList.add('tapped');
  }
  function closeSheet() {
    document.body.classList.remove('sheet-open');
    setTimeout(() => { $('#sheetBg').hidden = true; $('#sheet').hidden = true; }, 250);
  }
  hot.addEventListener('click', (e) => { e.preventDefault(); openSheet(); });
  $('#sheetBg').addEventListener('click', closeSheet);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });
  $('#copyBtn').addEventListener('click', async () => {
    toast(await GP.copyText(url) ? 'Link copied' : 'Press and hold the link to copy it');
  });

  /* ---------- poster ---------- */
  async function draw() {
    try {
      const cv = await GPPoster.render(cfg, { name: guest.name, lang, url, theme });
      const img = $('#posterImg');
      img.src = cv.toDataURL('image/png');
      await img.decode().catch(() => null);
      // Place the tap target over the QR card, in % so it follows the image at any size.
      const b = cv.qrBox, W = GPPoster.W, H = GPPoster.H;
      Object.assign(hot.style, {
        left: `${(b.x / W) * 100}%`, top: `${(b.y / H) * 100}%`,
        width: `${(b.w / W) * 100}%`, height: `${(b.h / H) * 100}%`,
      });
      const bubble = $('#bubble');
      bubble.style.bottom = `${100 - (b.y / H) * 100 + 2}%`;
      hot.hidden = false; bubble.hidden = false;
      document.body.classList.add('ready');
      // The bubble sits over the venue line, so it steps aside once it has been read.
      setTimeout(() => bubble.classList.add('gone'), 6000);
    } catch (e) {
      console.error(e);
      // No poster (fonts or QR library blocked): go straight to the invitation.
      location.replace(url);
    } finally {
      $('#busy').hidden = true;
    }
  }
  draw();
})();
