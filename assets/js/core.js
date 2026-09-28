/* Shared helpers: config loading, guest-link encoding, fonts. */
(function () {
  const DRAFT_KEY = 'gp.config.draft';

  const clone = (o) => JSON.parse(JSON.stringify(o));

  function deepMerge(base, over) {
    if (!over || typeof over !== 'object') return base;
    for (const k of Object.keys(over)) {
      const v = over[k];
      if (v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object') {
        deepMerge(base[k], v);
      } else {
        base[k] = v;
      }
    }
    return base;
  }

  function readDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function saveDraft(cfg) {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(cfg)); return true; } catch (e) { return false; }
  }

  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* ignore */ }
  }

  /** Published config (config.js) with this device's unpublished draft on top. */
  function loadConfig() {
    const cfg = clone(window.GP_CONFIG || {});
    const draft = readDraft();
    return draft ? deepMerge(cfg, draft) : cfg;
  }

  /* ---- guest name <-> URL (base64url of UTF-8 keeps Telugu links short) ---- */
  function b64urlEncode(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    bytes.forEach((b) => { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function b64urlDecode(s) {
    try {
      s = s.replace(/-/g, '+').replace(/_/g, '/');
      while (s.length % 4) s += '=';
      const bin = atob(s);
      const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
      return new TextDecoder().decode(bytes);
    } catch (e) { return ''; }
  }

  /* Older links (?n=): base64url of the compact ASCII + Telugu bytes. */
  function unpackName(s) {
    try {
      s = s.replace(/-/g, '+').replace(/_/g, '/');
      while (s.length % 4) s += '=';
      return Array.from(atob(s), (c) => {
        const b = c.charCodeAt(0);
        return String.fromCodePoint(b < 0x80 ? b : 0x0C00 + b - 0x80);
      }).join('');
    } catch (e) { return ''; }
  }

  /* Base62 (letters and digits only). WhatsApp formats _text_ as italics and
     ~text~ as strike-through, which split base64url links in two, so guest links
     now use only [0-9A-Za-z]. A leading 0x01 byte keeps leading zero bytes. */
  const B62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  function b62Encode(bytes) {
    let n = 1n;
    for (const b of bytes) n = (n << 8n) | BigInt(b);
    let out = '';
    while (n > 0n) { out = B62[Number(n % 62n)] + out; n /= 62n; }
    return out;
  }
  function b62Decode(s) {
    let n = 0n;
    for (const ch of s) {
      const v = B62.indexOf(ch);
      if (v < 0) throw new Error('bad');
      n = n * 62n + BigInt(v);
    }
    const bytes = [];
    while (n > 1n) { bytes.unshift(Number(n & 255n)); n >>= 8n; }
    return new Uint8Array(bytes);
  }
  /** ASCII + Telugu → one byte per letter (Telugu U+0C00–U+0C7F → 0x80–0xFF); null otherwise. */
  function packBytes(str) {
    const out = [];
    for (const ch of str) {
      const cp = ch.codePointAt(0);
      if (cp < 0x80) out.push(cp);
      else if (cp >= 0x0C00 && cp <= 0x0C7F) out.push(0x80 + cp - 0x0C00);
      else return null;
    }
    return out;
  }
  function unpackBytes(bytes) {
    return Array.from(bytes, (b) => String.fromCodePoint(b < 0x80 ? b : 0x0C00 + b - 0x80)).join('');
  }

  function readGuest(search) {
    const q = new URLSearchParams(search || location.search);
    let name = '';
    try {
      if (q.get('k')) name = unpackBytes(b62Decode(q.get('k')));
      else if (q.get('u')) name = new TextDecoder().decode(b62Decode(q.get('u')));
    } catch (e) { name = ''; }
    // Links shared before the switch to base62 still open.
    if (!name && q.get('n')) name = unpackName(q.get('n'));
    else if (!name && q.get('g')) name = b64urlDecode(q.get('g'));
    else if (!name && q.get('to')) name = q.get('to');
    const lang = q.get('l');
    return {
      name: name.trim().slice(0, 120),
      lang: lang === 'en' || lang === 'te' ? lang : null,
      theme: THEME_CODES[q.get('t')] || null,
    };
  }

  // Short codes keep QR codes small: ?t=m (maroon), ?t=g (green); cream is the default.
  const THEME_CODES = { c: 'cream', m: 'maroon', g: 'green' };
  const themeCode = (theme) => Object.keys(THEME_CODES).find((k) => THEME_CODES[k] === theme);

  /** Where the invitation lives publicly. */
  function baseUrl(cfg) {
    let u = (cfg.siteUrl || '').trim();
    if (!u) u = new URL('./', location.href).href;
    if (!/\/$/.test(u) && !/\.html?$/i.test(u)) u += '/';
    return u;
  }

  function guestUrl(cfg, name, lang, theme) {
    const u = new URL(baseUrl(cfg));
    if (name) {
      const packed = packBytes(name);
      if (packed) u.searchParams.set('k', b62Encode(packed));
      else u.searchParams.set('u', b62Encode(new TextEncoder().encode(name)));
    }
    if (lang && lang !== cfg.lang) u.searchParams.set('l', lang);
    const t = theme || cfg.posterTheme || 'cream';
    if (t !== (cfg.posterTheme || 'cream') && themeCode(t)) u.searchParams.set('t', themeCode(t));
    return u.href;
  }

  /** The guest's poster page (card.html): their poster with a tappable QR. Same query as their link. */
  function cardUrl(cfg, name, lang, theme) {
    const g = new URL(guestUrl(cfg, name, lang, theme));
    const u = new URL('card.html', g);
    u.search = g.search;
    return u.href;
  }

  function isLocalAddress(url) {
    try {
      const h = new URL(url).hostname;
      return location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0|10\.|192\.168\.)/.test(h) || h.endsWith('.local');
    } catch (e) { return true; }
  }

  /* ---- fonts ---- */
  const FONTS = {
    te: { display: "'Ramaraja'", body: "'Suravaram'", script: "'Ramaraja'" },
    en: { display: "'Pinyon Script'", body: "'Cormorant Garamond'", script: "'Pinyon Script'" },
  };

  async function fontsReady(lang) {
    if (!document.fonts) return;
    const f = FONTS[lang] || FONTS.en;
    const sample = lang === 'te' ? 'గృహప్రవేశ' : 'Griha';
    await Promise.all([
      document.fonts.load(`40px ${f.display}`, sample),
      document.fonts.load(`40px ${f.body}`, sample),
      document.fonts.load(`600 40px 'Cormorant Garamond'`, '28'),
      document.fonts.load(`40px 'Pinyon Script'`, 'Mr'),
      document.fonts.load(`40px 'Tiro Devanagari Sanskrit'`, 'ॐ'),
    ].map((p) => p.catch(() => null)));
    await document.fonts.ready;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /* ---- guest list (invites prepared on this device) ---- */
  const INVITES_KEY = 'gp.invites';
  const LEGACY_RECENT_KEY = 'gp.recentGuests';
  const ACTIONS = ['share', 'whatsapp', 'download', 'copy', 'added'];
  const inviteKey = (name, lang) => `${lang}|${String(name).trim().toLowerCase()}`;

  const invites = {
    list() {
      let list = [];
      try { list = JSON.parse(localStorage.getItem(INVITES_KEY)) || []; } catch (e) { list = []; }
      // one-time migration from the old "recent guests" chips
      try {
        const legacy = JSON.parse(localStorage.getItem(LEGACY_RECENT_KEY) || 'null');
        if (Array.isArray(legacy) && legacy.length) {
          const now = Date.now();
          legacy.forEach((r, i) => {
            if (r && r.name && !list.some((x) => x.key === inviteKey(r.name, r.lang || 'te'))) {
              list.push(invites._make(r.name, r.lang || 'te', now - i * 1000));
            }
          });
          localStorage.setItem(INVITES_KEY, JSON.stringify(list));
          localStorage.removeItem(LEGACY_RECENT_KEY);
        }
      } catch (e) { /* ignore */ }
      return list;
    },
    save(list) {
      try { localStorage.setItem(INVITES_KEY, JSON.stringify(list)); return true; } catch (e) { return false; }
    },
    _make(name, lang, at = Date.now()) {
      return {
        id: 'i' + at.toString(36) + Math.random().toString(36).slice(2, 6),
        key: inviteKey(name, lang), name: String(name).trim(), lang,
        createdAt: at, updatedAt: at, counts: {}, lastAction: null, note: '',
      };
    },
    /** Adds the guest if new, and records what was done (share / whatsapp / download / copy / added). */
    record(name, lang, action, theme) {
      name = String(name || '').trim();
      if (!name) return null;
      const list = invites.list();
      const key = inviteKey(name, lang);
      let inv = list.find((x) => x.key === key);
      if (!inv) { inv = invites._make(name, lang); list.unshift(inv); }
      const now = Date.now();
      inv.updatedAt = now;
      if (theme) inv.theme = theme; // the poster theme they were sent, so their link matches it
      if (action) {
        inv.counts[action] = (inv.counts[action] || 0) + 1;
        if (action !== 'added') inv.lastAction = { action, at: now };
      }
      invites.save(list);
      return inv;
    },
    update(id, patch) {
      const list = invites.list();
      const inv = list.find((x) => x.id === id);
      if (inv) { Object.assign(inv, patch, { updatedAt: Date.now() }); invites.save(list); }
      return inv;
    },
    remove(id) { invites.save(invites.list().filter((x) => x.id !== id)); },
    clear() { invites.save([]); },
    /** Merges a backup; keeps the earliest createdAt and adds up counts. */
    merge(incoming) {
      const list = invites.list();
      let added = 0;
      (incoming || []).forEach((r) => {
        if (!r || !r.name) return;
        const lang = r.lang === 'en' ? 'en' : 'te';
        const key = inviteKey(r.name, lang);
        const cur = list.find((x) => x.key === key);
        if (!cur) {
          list.push(Object.assign(invites._make(r.name, lang, r.createdAt || Date.now()), {
            counts: r.counts || {}, lastAction: r.lastAction || null, note: r.note || '', updatedAt: r.updatedAt || r.createdAt || Date.now(),
          }));
          added++;
        } else {
          cur.createdAt = Math.min(cur.createdAt, r.createdAt || cur.createdAt);
          ACTIONS.forEach((a) => { if (r.counts && r.counts[a]) cur.counts[a] = Math.max(cur.counts[a] || 0, r.counts[a]); });
          if (r.lastAction && (!cur.lastAction || r.lastAction.at > cur.lastAction.at)) cur.lastAction = r.lastAction;
          if (r.note && !cur.note) cur.note = r.note;
        }
      });
      list.sort((a, b) => b.createdAt - a.createdAt);
      invites.save(list);
      return added;
    },
  };

  /** Copies text to the clipboard. Falls back to execCommand when the Clipboard API is
      unavailable (for example a phone opening the studio over http:// on Wi-Fi). */
  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; }
    } catch (e) { /* fall through */ }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    const sel = window.getSelection && window.getSelection();
    if (sel) sel.removeAllRanges();
    return ok;
  }

  /** Inline QR SVG for `url`. Needs the qrcode-generator script on the page. */
  function qrSvg(url, cellSize = 4, margin = 2) {
    try {
      if (typeof qrcode !== 'function' || !url) return '';
      const qr = qrcode(0, 'Q');
      qr.addData(url);
      qr.make();
      return qr.createSvgTag({ cellSize, margin, scalable: true });
    } catch (e) { return ''; }
  }

  window.GP = {
    DRAFT_KEY, clone, deepMerge, loadConfig, readDraft, saveDraft, clearDraft,
    b64urlEncode, b64urlDecode, readGuest, baseUrl, guestUrl, cardUrl, isLocalAddress,
    FONTS, fontsReady, esc, invites, INVITE_ACTIONS: ACTIONS, qrSvg, copyText,
  };
})();
