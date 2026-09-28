/* Admin dashboard: every invitation prepared on this device. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const cfg = GP.loadConfig();
  const published = window.GP_CONFIG;
  const state = { q: '', lang: 'all', status: 'all', sort: 'new', addLang: cfg.lang || 'te', current: null };

  const fmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  const fmtLong = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  const LANG = { te: 'తెలుగు', en: 'English' };
  const ACTION_LABEL = { share: 'Shared', whatsapp: 'WhatsApp', download: 'Downloaded', copy: 'Link copied', added: 'Added' };
  const SENT = ['share', 'whatsapp', 'download', 'copy'];

  const isSent = (inv) => SENT.some((a) => (inv.counts || {})[a] > 0);
  const sentCount = (inv) => SENT.reduce((n, a) => n + ((inv.counts || {})[a] || 0), 0);
  const urlFor = (inv) => GP.guestUrl(cfg, inv.name, inv.lang, inv.theme);
  const text = (lang) => Object.assign({}, cfg.text.en, cfg.text[lang || cfg.lang]);

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2200);
  }

  function qrSvg(url) {
    try {
      const qr = qrcode(0, 'M');
      qr.addData(url); qr.make();
      return qr.createSvgTag({ cellSize: 2, margin: 2, scalable: true });
    } catch (e) { return ''; }
  }

  /* ---------- overview ---------- */
  function renderStats(list) {
    const sent = list.filter(isSent).length;
    const te = list.filter((x) => x.lang === 'te').length;
    const start = new Date(cfg.event && cfg.event.start);
    let days = '—', daysLabel = 'Event date not set';
    if (!isNaN(start)) {
      const d = Math.ceil((new Date(start.getFullYear(), start.getMonth(), start.getDate()) - new Date(new Date().toDateString())) / 86400000);
      days = d > 0 ? d : d === 0 ? 'Today' : 'Done';
      daysLabel = d > 0 ? (d === 1 ? 'day to go' : 'days to go') : d === 0 ? 'It’s the day!' : `${-d} days ago`;
    }
    const todayCount = list.filter((x) => new Date(x.createdAt).toDateString() === new Date().toDateString()).length;
    const tiles = [
      ['Invitations prepared', list.length, todayCount ? `+${todayCount} today` : 'on this device'],
      ['Shared', sent, list.length ? `${Math.round((sent / list.length) * 100)}% of guests` : '—'],
      ['Not shared yet', list.length - sent, list.length - sent ? 'send these next' : 'all sent 🎉'],
      ['Language', `${te} · ${list.length - te}`, 'తెలుగు · English'],
      [daysLabel === 'Event date not set' ? 'Countdown' : 'Countdown', days, daysLabel],
    ];
    $('#stats').innerHTML = tiles.map(([k, v, s], i) =>
      `<div class="stat${i === 0 ? ' hero' : ''}"><span class="k">${k}</span><b class="v">${GP.esc(v)}</b><span class="s">${GP.esc(s)}</span></div>`).join('');
  }

  function renderEvent() {
    const t = text(cfg.lang);
    const start = new Date(cfg.event && cfg.event.start);
    const site = (cfg.siteUrl || '').trim();
    const base = GP.baseUrl(cfg);
    const local = GP.isLocalAddress(base);
    const draft = JSON.stringify(cfg) !== JSON.stringify(published);
    const badge = (ok, okText, badText) => `<span class="badge ${ok ? 'ok' : 'warn'}">${ok ? okText : badText}</span>`;
    $('#eventCard').innerHTML = `
      <div class="ev-main">
        <p class="ev-kicker">${GP.esc(t.topLine)}</p>
        <h2 class="ev-title">${GP.esc(t.title1)} ${GP.esc(t.title2)}</h2>
        <dl class="ev-facts">
          <div><dt>When</dt><dd>${isNaN(start) ? 'Not set' : GP.esc(fmtLong.format(start))}</dd></div>
          <div><dt>Where</dt><dd>${GP.esc(t.address)}${cfg.event.mapUrl ? ` · <a href="${GP.esc(cfg.event.mapUrl)}" target="_blank" rel="noopener">Map</a>` : ''}</dd></div>
          <div><dt>Hosts</dt><dd>${GP.esc(t.hosts || '—')}</dd></div>
          <div><dt>Guests see</dt><dd>${LANG[cfg.lang] || cfg.lang} first</dd></div>
        </dl>
      </div>
      <div class="ev-side">
        <div class="check">${badge(!local, 'Live', site ? 'Local only' : 'Not set')}<span><b>Site link</b><br><code>${GP.esc(site || base)}</code></span></div>
        <div class="check">${badge(!draft, 'Published', 'Unpublished edits')}<span><b>Invitation text</b><br>${draft ? 'Export config.js on the <a href="config.html">Edit text</a> page, then redeploy.' : 'Guests see the same text as you.'}</span></div>
        ${local ? '<p class="note warn" style="margin:0">QR codes won’t open on guests’ phones until the site is hosted and the <a href="config.html">Site link</a> is set.</p>' : ''}
      </div>`;
  }

  /* ---------- table ---------- */
  function filtered(list) {
    const q = state.q.trim().toLowerCase();
    let out = list.filter((x) =>
      (state.lang === 'all' || x.lang === state.lang) &&
      (state.status === 'all' || (state.status === 'sent') === isSent(x)) &&
      (!q || x.name.toLowerCase().includes(q) || (x.note || '').toLowerCase().includes(q)));
    const by = {
      new: (a, b) => b.createdAt - a.createdAt,
      old: (a, b) => a.createdAt - b.createdAt,
      name: (a, b) => a.name.localeCompare(b.name),
      active: (a, b) => ((b.lastAction || {}).at || 0) - ((a.lastAction || {}).at || 0),
    }[state.sort];
    return out.sort(by);
  }

  function renderTable() {
    const all = GP.invites.list();
    renderStats(all);
    const list = filtered(all);
    const rows = $('#rows');
    $('#empty').hidden = all.length > 0;
    $('#table').hidden = all.length === 0;
    $('#footNote').textContent = all.length
      ? `Showing ${list.length} of ${all.length}. This list is stored in this browser. Use ⋯ → Back up to move it to another device.`
      : '';
    rows.innerHTML = list.map((inv, i) => {
      const sent = isSent(inv);
      const last = inv.lastAction;
      return `<tr data-id="${inv.id}">
        <td class="c-n" data-label="#">${i + 1}</td>
        <td class="c-qr"><button class="qr-thumb" type="button" data-act="detail" aria-label="Show QR for ${GP.esc(inv.name)}">${qrSvg(urlFor(inv))}</button></td>
        <td class="c-name" data-label="Guest"><button class="name-btn" type="button" data-act="detail">${GP.esc(inv.name)}</button>${inv.note ? `<small>${GP.esc(inv.note)}</small>` : ''}</td>
        <td data-label="Language"><span class="pill lang-${inv.lang}">${LANG[inv.lang]}</span></td>
        <td data-label="Prepared"><time datetime="${new Date(inv.createdAt).toISOString()}">${fmt.format(inv.createdAt)}</time></td>
        <td data-label="Last shared">${last ? `${fmt.format(last.at)}<small>${ACTION_LABEL[last.action] || last.action}${sentCount(inv) > 1 ? ` · ${sentCount(inv)}×` : ''}</small>` : '<span class="muted">—</span>'}</td>
        <td data-label="Status"><span class="status ${sent ? 'sent' : 'pending'}">${sent ? 'Shared' : 'Not shared'}</span></td>
        <td class="c-act">
          <a class="icon-btn" href="poster.html?name=${encodeURIComponent(inv.name)}&l=${inv.lang}" title="Open poster" aria-label="Open poster for ${GP.esc(inv.name)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 7h6M9 11h6"/><rect x="10" y="14" width="4" height="4"/></svg></a>
          <button class="icon-btn" type="button" data-act="copy" title="Copy link" aria-label="Copy link for ${GP.esc(inv.name)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg></button>
          <button class="icon-btn danger" type="button" data-act="delete" title="Remove" aria-label="Remove ${GP.esc(inv.name)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg></button>
        </td>
      </tr>`;
    }).join('') || (all.length ? '<tr class="no-match"><td colspan="8">No guests match these filters.</td></tr>' : '');
  }

  async function copyLink(inv) {
    const url = urlFor(inv);
    const ok = await GP.copyText(url);
    toast(ok ? 'Link copied' : 'Could not copy. Press and hold the link to copy it');
    GP.invites.record(inv.name, inv.lang, 'copy');
    renderTable();
  }

  function removeInv(inv) {
    if (!confirm(`Remove ${inv.name} from the guest list?\nTheir link keeps working. This only removes them from this list.`)) return false;
    GP.invites.remove(inv.id);
    renderTable(); toast('Removed');
    return true;
  }

  $('#rows').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const inv = GP.invites.list().find((x) => x.id === btn.closest('tr').dataset.id);
    if (!inv) return;
    if (btn.dataset.act === 'detail') openDetail(inv);
    else if (btn.dataset.act === 'copy') copyLink(inv);
    else if (btn.dataset.act === 'delete') removeInv(inv);
  });

  /* ---------- detail sheet ---------- */
  const dlg = $('#detail');
  function openDetail(inv) {
    state.current = inv;
    const url = urlFor(inv);
    $('#dQr').innerHTML = qrSvg(url);
    $('#dName').textContent = inv.name;
    $('#dName').classList.toggle('te', /[ఀ-౿]/.test(inv.name));
    $('#dMeta').textContent = `${LANG[inv.lang]} · prepared ${fmtLong.format(inv.createdAt)}`;
    $('#dLink').textContent = url;
    $('#dPoster').href = `poster.html?name=${encodeURIComponent(inv.name)}&l=${inv.lang}`;
    $('#dOpen').href = url;
    $('#dNote').value = inv.note || '';
    preparePoster(inv);
    const c = inv.counts || {};
    const bits = Object.keys(ACTION_LABEL).filter((a) => c[a]).map((a) => `${ACTION_LABEL[a]} ×${c[a]}`);
    $('#dLog').innerHTML = bits.length ? `<b>Activity:</b> ${bits.join(' · ')}${inv.lastAction ? `<br>Last: ${ACTION_LABEL[inv.lastAction.action]} on ${fmtLong.format(inv.lastAction.at)}` : ''}` : 'Not shared yet.';
    dlg.showModal();
  }
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', renderTable);
  $('#dCopy').addEventListener('click', () => copyLink(state.current).then(() => openDetail(GP.invites.list().find((x) => x.id === state.current.id))));
  /* The poster is painted as soon as the sheet opens, so "Share" can hand the image
     to the share sheet straight away (phones only allow sharing right after a tap). */
  let posterFile = null, posterFor = null;
  async function preparePoster(inv) {
    posterFile = null; posterFor = inv.id;
    if (!window.GPPoster) return;
    try {
      const cv = document.createElement('canvas');
      await GPPoster.render(cfg, { name: inv.name, lang: inv.lang, url: urlFor(inv), canvas: cv, theme: inv.theme });
      const b = await new Promise((res) => cv.toBlob(res, 'image/png'));
      if (posterFor === inv.id && b) {
        posterFile = new File([b], `griha-pravesam-${inv.name.replace(/[^\p{L}\p{M}\p{N}]+/gu, '-').slice(0, 40)}.png`, { type: 'image/png' });
      }
    } catch (e) { /* share falls back to text */ }
  }

  $('#dShare').addEventListener('click', async () => {
    const inv = state.current; const t = text(inv.lang); const url = urlFor(inv);
    const msg = inv.lang === 'te'
      ? `${inv.name} గారికి, ${t.title1} ${t.title2} ఆహ్వానం 🙏\n\n${url}`
      : `Dear ${inv.name}, you're invited to our ${t.title1} ${t.title2} 🙏\n\n${url}`;
    const file = posterFor === inv.id ? posterFile : null;
    let action = 'share';
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], text: msg }); } catch (e) { if (e.name === 'AbortError') return; }
      GP.copyText(msg).then((ok) => ok && toast('Sent. The message is also copied, in case it needs pasting'));
    } else if (navigator.share) {
      try { await navigator.share({ text: msg }); } catch (e) { if (e.name === 'AbortError') return; }
    } else {
      window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank', 'noopener');
      action = 'whatsapp';
    }
    GP.invites.record(inv.name, inv.lang, action);
    openDetail(GP.invites.list().find((x) => x.id === inv.id));
  });
  $('#dQrPng').addEventListener('click', () => {
    const inv = state.current;
    const qr = qrcode(0, 'Q'); qr.addData(urlFor(inv)); qr.make();
    const n = qr.getModuleCount(), cell = 16, pad = cell * 4, size = n * cell + pad * 2;
    const cv = Object.assign(document.createElement('canvas'), { width: size, height: size + 90 });
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = '#3d1c0a';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) ctx.fillRect(pad + c * cell, pad + r * cell, cell, cell);
    ctx.font = `40px ${/[ఀ-౿]/.test(inv.name) ? "'Ramaraja'" : "'Cormorant Garamond'"}`;
    ctx.textAlign = 'center'; ctx.fillText(inv.name, size / 2, size + 40, size - 40);
    const a = document.createElement('a');
    a.href = cv.toDataURL('image/png');
    a.download = `qr-${inv.name.replace(/[^\p{L}\p{M}\p{N}]+/gu, '-').slice(0, 40)}.png`;
    a.click();
  });
  let noteT;
  $('#dNote').addEventListener('input', (e) => {
    clearTimeout(noteT);
    noteT = setTimeout(() => { GP.invites.update(state.current.id, { note: e.target.value.trim() }); }, 300);
  });
  $('#dDelete').addEventListener('click', () => { if (removeInv(state.current)) dlg.close(); });

  /* ---------- bulk add ---------- */
  const addDlg = $('#addDlg');
  $('#addBtn').addEventListener('click', () => { addDlg.showModal(); $('#addNames').focus(); });
  addDlg.addEventListener('click', (e) => { if (e.target === addDlg) addDlg.close(); });
  segment('#addLang', (v) => { state.addLang = v; }, state.addLang);
  $('#addGo').addEventListener('click', () => {
    const names = $('#addNames').value.split(/\n+/).map((s) => s.trim()).filter(Boolean);
    if (!names.length) { toast('Type at least one name'); return; }
    const before = GP.invites.list().length;
    names.forEach((n) => GP.invites.record(n, state.addLang, 'added'));
    const added = GP.invites.list().length - before;
    $('#addNames').value = '';
    addDlg.close(); renderTable();
    toast(added === names.length ? `${added} guest${added > 1 ? 's' : ''} added` : `${added} added · ${names.length - added} already on the list`);
  });

  /* ---------- export / import ---------- */
  function save(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  }
  const stamp = () => new Date().toISOString().slice(0, 10);
  $('#csvBtn').addEventListener('click', () => {
    const list = filtered(GP.invites.list());
    const q = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const head = ['#', 'Guest', 'Language', 'Link', 'Prepared on', 'Status', 'Last shared', 'Last action', 'Shares', 'WhatsApp', 'Downloads', 'Links copied', 'Note'];
    const lines = list.map((x, i) => {
      const c = x.counts || {};
      return [i + 1, x.name, LANG[x.lang], urlFor(x), new Date(x.createdAt).toLocaleString('en-IN'), isSent(x) ? 'Shared' : 'Not shared',
        x.lastAction ? new Date(x.lastAction.at).toLocaleString('en-IN') : '', x.lastAction ? ACTION_LABEL[x.lastAction.action] : '',
        c.share || 0, c.whatsapp || 0, c.download || 0, c.copy || 0, x.note || ''].map(q).join(',');
    });
    save(new Blob(['﻿' + [head.map(q).join(','), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' }), `griha-pravesam-guests-${stamp()}.csv`);
    closeMenu(); toast('CSV exported');
  });
  $('#backupBtn').addEventListener('click', () => {
    save(new Blob([JSON.stringify({ type: 'gp-guests', version: 1, exportedAt: Date.now(), invites: GP.invites.list() }, null, 2)], { type: 'application/json' }), `griha-pravesam-backup-${stamp()}.json`);
    closeMenu(); toast('Backup saved');
  });
  $('#restoreFile').addEventListener('change', async (e) => {
    const f = e.target.files[0]; e.target.value = ''; closeMenu();
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      const list = Array.isArray(data) ? data : data.invites;
      if (!Array.isArray(list)) throw new Error('bad');
      const added = GP.invites.merge(list);
      renderTable(); toast(`Merged: ${added} new guest${added === 1 ? '' : 's'}`);
    } catch (err) { toast('That file isn’t a guest-list backup'); }
  });
  $('#clearBtn').addEventListener('click', () => {
    closeMenu();
    const n = GP.invites.list().length;
    if (!n) return;
    if (prompt(`This deletes all ${n} guests from this device. Their links keep working.\nType DELETE to confirm.`) !== 'DELETE') return;
    GP.invites.clear(); renderTable(); toast('Guest list cleared');
  });
  function closeMenu() { document.querySelector('details.menu').removeAttribute('open'); }
  document.addEventListener('click', (e) => { if (!e.target.closest('details.menu')) closeMenu(); });

  /* ---------- filters ---------- */
  function segment(sel, onChange, initial) {
    const btns = document.querySelectorAll(`${sel} button`);
    const set = (v) => btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
    btns.forEach((b) => b.addEventListener('click', () => { set(b.dataset.v); onChange(b.dataset.v); }));
    if (initial) set(initial);
  }
  segment('#fLang', (v) => { state.lang = v; renderTable(); });
  segment('#fStatus', (v) => { state.status = v; renderTable(); });
  $('#sort').addEventListener('change', (e) => { state.sort = e.target.value; renderTable(); });
  let qT;
  $('#q').addEventListener('input', (e) => { clearTimeout(qT); qT = setTimeout(() => { state.q = e.target.value; renderTable(); }, 120); });

  // Stay in sync when the Poster page (another tab) adds guests.
  window.addEventListener('storage', (e) => { if (e.key === 'gp.invites') renderTable(); });

  renderEvent();
  renderTable();
})();
