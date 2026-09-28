/*
 * 9:16 poster renderer (1080 × 1920) — same artwork as the live invitation,
 * plus the guest's name and a QR code that opens their personal link.
 * Exposes GPPoster.render(cfg, {name, lang}) → Promise<HTMLCanvasElement>.
 */
(function () {
  const W = 1080, H = 1920;
  const cache = new Map();

  function svgImage(svg) {
    if (cache.has(svg)) return cache.get(svg);
    const p = new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
    cache.set(svg, p);
    return p;
  }

  // Generate the art once; unique ids per string keep them independent.
  let ART = null;
  function art() {
    if (ART) return ART;
    ART = {
      tl: GPArt.cornerTop(false), tr: GPArt.cornerTop(true),
      bl: GPArt.cornerBottom(false), br: GPArt.cornerBottom(true),
      archT: GPArt.arch(false), archB: GPArt.arch(true),
      lampL: GPArt.lamp(190), lampS: GPArt.lamp(90), flourish: GPArt.flourish(),
    };
    return ART;
  }

  const hasTelugu = (s) => /[ఀ-౿]/.test(s || '');

  /* Poster colour themes. The QR cards stay white on every theme so they always scan. */
  const THEMES = {
    cream: {
      label: 'Cream & gold', bg: ['#fffbf2', '#fbf4e6', '#f1e1c2'], grain: ['#6b4a1a', 0.035],
      ink: '#b98631', inkDeep: '#8d611f', name: '#6e1f10', gold: ['#e0b25a', '#b98631', '#94651f'],
      frame: ['rgba(185,134,49,.55)', 'rgba(185,134,49,.3)'],
    },
    maroon: {
      label: 'Deep maroon', bg: ['#8a2c19', '#5f1b0e', '#360d06'], grain: ['#000000', 0.08],
      ink: '#ecc67c', inkDeep: '#dcb266', name: '#fff1d6', gold: ['#fde6a6', '#e9bf66', '#c9913f'],
      frame: ['rgba(236,198,124,.6)', 'rgba(236,198,124,.3)'],
    },
    green: {
      label: 'Mango-leaf green', bg: ['#356a3e', '#21482a', '#112717'], grain: ['#000000', 0.08],
      ink: '#eecb7e', inkDeep: '#dfb868', name: '#fff4dc', gold: ['#fde6a6', '#e9bf66', '#c9913f'],
      frame: ['rgba(238,203,126,.6)', 'rgba(238,203,126,.3)'],
    },
  };
  let TH = THEMES.cream;

  function goldFill(ctx, y0, y1) {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, TH.gold[0]); g.addColorStop(.5, TH.gold[1]); g.addColorStop(1, TH.gold[2]);
    return g;
  }

  function spaced(ctx, text, x, y, spacing) {
    if ('letterSpacing' in ctx) { ctx.letterSpacing = spacing + 'px'; ctx.fillText(text, x, y); ctx.letterSpacing = '0px'; return; }
    ctx.fillText(text, x, y);
  }

  /** Shrinks the font until the text fits maxW; returns the size used. */
  function fitFont(ctx, text, family, size, maxW, weight = '') {
    let s = size;
    do { ctx.font = `${weight} ${s}px ${family}`.trim(); s -= 2; } while (ctx.measureText(text).width > maxW && s > 18);
    return s + 2;
  }

  function wrap(ctx, text, maxW) {
    const words = String(text).split(/\s+/);
    const lines = []; let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }

  /** Splits text into two lines of similar width. */
  function balance(ctx, text) {
    const words = String(text).split(/\s+/);
    if (words.length < 2) return [text];
    let best = null;
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(' '), b = words.slice(i).join(' ');
      const w = Math.max(ctx.measureText(a).width, ctx.measureText(b).width);
      if (!best || w < best.w) best = { w, lines: [a, b] };
    }
    return best.lines;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function drawQR(ctx, url, cx, cy, size) {
    const qr = qrcode(0, 'Q');
    qr.addData(url);
    qr.make();
    const n = qr.getModuleCount();
    const quiet = 3;
    const cell = size / (n + quiet * 2);
    const x0 = cx - size / 2, y0 = cy - size / 2;

    // card
    ctx.save();
    ctx.shadowColor = 'rgba(120, 80, 20, .25)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 8;
    roundRect(ctx, x0 - 18, y0 - 18, size + 36, size + 36, 28);
    ctx.fillStyle = '#fffdf8'; ctx.fill();
    ctx.restore();
    roundRect(ctx, x0 - 18, y0 - 18, size + 36, size + 36, 28);
    ctx.lineWidth = 3; ctx.strokeStyle = '#c9973f'; ctx.stroke();
    roundRect(ctx, x0 - 8, y0 - 8, size + 16, size + 16, 20);
    ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(185,134,49,.6)'; ctx.stroke();

    ctx.fillStyle = '#3d1c0a';
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (qr.isDark(r, c)) {
          ctx.fillRect(Math.floor(x0 + (c + quiet) * cell), Math.floor(y0 + (r + quiet) * cell), Math.ceil(cell), Math.ceil(cell));
        }
      }
    }
    // centre badge (small enough for level Q error correction)
    const br = size * 0.07;
    ctx.beginPath(); ctx.arc(cx, cy, br + 8, 0, Math.PI * 2); ctx.fillStyle = '#fffdf8'; ctx.fill();
    const g = ctx.createRadialGradient(cx - br / 3, cy - br / 3, 2, cx, cy, br);
    g.addColorStop(0, '#ffe9a6'); g.addColorStop(.55, '#d6a44b'); g.addColorStop(1, '#8e6020');
    ctx.beginPath(); ctx.arc(cx, cy, br, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    ctx.fillStyle = '#6b1a0c'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `${Math.round(br * 1.25)}px 'Tiro Devanagari Sanskrit'`;
    ctx.fillText('ॐ', cx, cy + br * 0.1);
    ctx.textBaseline = 'alphabetic';
  }

  async function render(cfg, opts) {
    const lang = opts.lang || cfg.lang || 'te';
    const t = Object.assign({}, cfg.text.en, cfg.text[lang]);
    const name = (opts.name || '').trim() || t.guestFallback;
    const url = opts.url;
    const te = lang === 'te';
    TH = THEMES[opts.theme || cfg.posterTheme] || THEMES.cream;
    const mapUrl = (cfg.event && cfg.event.mapUrl) || '';
    const useMapQr = !!(cfg.event && cfg.event.showMapQr && mapUrl);
    const GAP = useMapQr ? 0.74 : 1; // a little less breathing room when the map QR also needs space
    const F = {
      body: te ? "'Suravaram'" : "'Cormorant Garamond'",
      display: te ? "'Ramaraja'" : "'Pinyon Script'",
      name: hasTelugu(name) ? "'Ramaraja'" : "'Pinyon Script'",
    };
    await GP.fontsReady(lang);

    const a = art();
    const [tl, tr, bl, br, archT, archB, lampL, lampS, flourish] = await Promise.all(
      [a.tl, a.tr, a.bl, a.br, a.archT, a.archB, a.lampL, a.lampS, a.flourish].map(svgImage));
    // Everything below is synchronous; re-apply the theme in case another render ran meanwhile.
    TH = THEMES[opts.theme || cfg.posterTheme] || THEMES.cream;

    const cv = opts.canvas || document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    ctx.textAlign = 'center';

    // paper
    const bg = ctx.createRadialGradient(W / 2, H * 0.42, 100, W / 2, H * 0.45, H * 0.75);
    bg.addColorStop(0, TH.bg[0]); bg.addColorStop(.6, TH.bg[1]); bg.addColorStop(1, TH.bg[2]);
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    // faint grain
    ctx.save(); ctx.globalAlpha = TH.grain[1]; ctx.fillStyle = TH.grain[0];
    for (let i = 0; i < 9000; i++) ctx.fillRect(Math.random() * W, Math.random() * H, 1.4, 1.4);
    ctx.restore();
    // inner gold frame
    ctx.strokeStyle = TH.frame[0]; ctx.lineWidth = 2; ctx.strokeRect(28, 28, W - 56, H - 56);
    ctx.strokeStyle = TH.frame[1]; ctx.lineWidth = 1; ctx.strokeRect(40, 40, W - 80, H - 80);

    // arches
    const aw = 640, ah = aw * 70 / 400;
    ctx.drawImage(archT, (W - aw) / 2, 0, aw, ah);
    ctx.drawImage(archB, (W - aw) / 2, H - ah, aw, ah);

    // lamps (behind garland)
    const lamp = (img, x, w) => ctx.drawImage(img, x, 0, w, w * img.height / img.width);
    lamp(lampL, 40, 150); lamp(lampL, W - 190, 150);
    lamp(lampS, 215, 120); lamp(lampS, W - 335, 120);

    // florals
    const tw = 600;
    ctx.drawImage(tl, -40, -30, tw, tw);
    ctx.drawImage(tr, W - tw + 40, -30, tw, tw);
    const bw = 470, bh = bw * 520 / 360;
    ctx.drawImage(bl, -40, H - bh + 20, bw, bh);
    ctx.drawImage(br, W - bw + 40, H - bh + 20, bw, bh);

    // ---- text ----
    let y = 150;
    // Om
    ctx.fillStyle = goldFill(ctx, y - 90, y);
    ctx.font = `104px 'Tiro Devanagari Sanskrit'`;
    ctx.fillText('ॐ', W / 2, y + 28);

    // personalised name
    y = 268;
    ctx.fillStyle = TH.inkDeep;
    ctx.font = `${te ? '' : 'italic '}36px ${F.body}`;
    ctx.fillText(t.posterFor || t.dear, W / 2, y);
    ctx.fillStyle = TH.name;
    const maxName = hasTelugu(name) ? 66 : 88;
    const nameW = 680;
    ctx.font = `${maxName}px ${F.name}`;
    let nameLines = [name];
    if (ctx.measureText(name).width > nameW) nameLines = balance(ctx, name);
    const nameSize = Math.min(...nameLines.map((ln) => fitFont(ctx, ln, F.name, maxName, nameW)));
    ctx.font = `${nameSize}px ${F.name}`;
    const nameLH = nameLines.length > 1 ? Math.round(nameSize * 1.15) : 0;
    nameLines.forEach((ln, i) => ctx.fillText(ln, W / 2, y + 92 + i * nameLH));
    y += 92 + nameLH * (nameLines.length - 1);

    ctx.drawImage(flourish, (W - 360) / 2, y + 30, 360, 36);
    y += Math.round(130 * GAP);

    // top line
    ctx.fillStyle = TH.ink;
    ctx.font = `${te ? 40 : 38}px ${F.body}`;
    spaced(ctx, te ? t.topLine : t.topLine.toUpperCase(), W / 2, y, te ? 0 : 6);

    // title
    const tSize = te ? 128 : 150;
    ctx.fillStyle = goldFill(ctx, y, y + 300);
    fitFont(ctx, t.title1, F.display, tSize, 800);
    ctx.fillText(t.title1, W / 2, y + (te ? 150 : 150));
    fitFont(ctx, t.title2, F.display, tSize, 800);
    const titleBaseline2 = y + (te ? 300 : 290);
    ctx.fillText(t.title2, W / 2, titleBaseline2);
    y = titleBaseline2 + Math.round((te ? 85 : 80) * GAP);

    // sub line
    ctx.fillStyle = TH.ink;
    ctx.font = `${te ? 38 : 38}px ${F.body}`;
    const subLines = wrap(ctx, te ? t.subLine : t.subLine.toUpperCase(), 760);
    subLines.slice(0, 2).forEach((ln, i) => spaced(ctx, ln, W / 2, y + i * 52, te ? 0 : 5));
    y += 52 * Math.min(subLines.length, 2) + Math.round(40 * GAP);

    // date row (kept at full size — the month/year sit at fixed offsets from cy)
    const cy = y + 92;
    ctx.strokeStyle = TH.ink; ctx.lineWidth = 2.5;
    [[150, 410], [670, 930]].forEach(([x0, x1]) => {
      ctx.beginPath(); ctx.moveTo(x0, cy - 34); ctx.lineTo(x1, cy - 34); ctx.moveTo(x0, cy + 34); ctx.lineTo(x1, cy + 34); ctx.stroke();
    });
    // date, venue: same lettering as the title (Pinyon Script / Ramaraja)
    const D = F.display;
    const sideSize = te ? 40 : 58, smallSize = te ? 38 : 54;
    ctx.fillStyle = TH.ink;
    ctx.textBaseline = 'middle';
    fitFont(ctx, t.weekday, D, sideSize, 250);
    ctx.fillText(t.weekday, 280, cy + 2);
    fitFont(ctx, t.time, D, sideSize, 250);
    ctx.fillText(t.time, 800, cy + 2);
    ctx.font = `${smallSize}px ${D}`;
    ctx.fillText(t.month, W / 2, cy - 108);
    ctx.fillText(t.year, W / 2, cy + 106);
    ctx.fillStyle = goldFill(ctx, cy - 70, cy + 70);
    ctx.font = `${te ? 104 : 136}px ${D}`;
    ctx.fillText(t.day, W / 2, cy + 4);
    ctx.textBaseline = 'alphabetic';
    y = cy + 208;

    // venue: either the address text, or (if enabled) a small QR to the map link
    ctx.fillStyle = TH.ink;
    ctx.font = te ? `44px ${D}` : `58px ${D}`;
    ctx.fillText(t.atLabel, W / 2, y);

    if (useMapQr) {
      // Small QR on the left, "Scan for directions" beside it on the right, centred as a group.
      const mapQrSize = 124, MAP_FRAME = 18, GUTTER = 28;
      const cap = te ? (t.mapQrCaption || t.posterScan) : (t.mapQrCaption || t.posterScan).toUpperCase();
      const capSize = te ? 32 : 30, capLH = te ? 46 : 40, capSpacing = te ? 0 : 4;
      ctx.font = `600 ${capSize}px ${F.body}`;
      const capLines = wrap(ctx, cap, 230).slice(0, 2);
      const capW = Math.max(...capLines.map((ln) => ctx.measureText(ln).width + capSpacing * ln.length));
      const cardW = mapQrSize + MAP_FRAME * 2;
      const groupLeft = (W - (cardW + GUTTER + capW)) / 2;
      const mapQrCx = groupLeft + cardW / 2;
      const mapQrCy = y + 8 + MAP_FRAME + mapQrSize / 2;
      drawQR(ctx, mapUrl, mapQrCx, mapQrCy, mapQrSize);

      ctx.fillStyle = TH.inkDeep;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const capX = groupLeft + cardW + GUTTER;
      const capTop = mapQrCy - ((capLines.length - 1) * capLH) / 2;
      capLines.forEach((ln, i) => spaced(ctx, ln, capX, capTop + i * capLH, capSpacing));
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      y = mapQrCy + mapQrSize / 2 + MAP_FRAME + 6;
    } else {
      ctx.font = `${te ? 34 : 46}px ${D}`;
      const addr = wrap(ctx, t.address, 720);
      const addrLH = te ? 48 : 52;
      addr.slice(0, 2).forEach((ln, i) => ctx.fillText(ln, W / 2, y + 60 + i * addrLH));
      y += 60 + addrLH * Math.min(addr.length, 2);
    }

    // Main QR (always the guest's personal link)
    // It sits below the text above with a clear gap, shrinking — and, with the map QR
    // also on the page, allowed to shrink a bit further — so nothing ever overlaps or
    // runs off the poster.
    const FRAME = 18;                 // card padding around the QR modules
    const CAPTION = 66;               // QR bottom → caption baseline
    const gapTop = useMapQr ? 20 : 40;
    const limit = H - 120;            // caption baseline must stay above the bottom arch
    const top = y + gapTop;
    const minQrSize = useMapQr ? 200 : 250;
    const qrSize = Math.max(minQrSize, Math.min(340, limit - top - FRAME * 2 - CAPTION));
    const spare = Math.max(0, limit - top - (qrSize + FRAME * 2 + CAPTION));
    const qy = Math.min(top + spare * 0.45, limit - (qrSize + FRAME * 2 + CAPTION)) + FRAME + qrSize / 2;
    drawQR(ctx, url, W / 2, qy, qrSize);
    const capY = qy + qrSize / 2 + CAPTION;
    ctx.fillStyle = TH.inkDeep;
    ctx.font = `600 ${te ? 32 : 30}px ${F.body}`;
    fitFont(ctx, t.posterScan, F.body, te ? 32 : 30, 460, '600');
    spaced(ctx, te ? t.posterScan : t.posterScan.toUpperCase(), W / 2, capY, te ? 0 : 3);

    // Where the guest's QR card sits (poster pixels), so card.html can make it tappable.
    const card = qrSize + FRAME * 2;
    cv.qrBox = { x: W / 2 - card / 2, y: qy - card / 2, w: card, h: card };
    return cv;
  }

  window.GPPoster = { render, W, H, THEMES };
})();
