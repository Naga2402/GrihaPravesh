/*
 * Original vector artwork for the invitation (no external images needed).
 * Every function returns a standalone <svg> string so the same art is used
 * in the live page (innerHTML) and in the poster (drawn onto a canvas).
 * Each call gets a unique id prefix so gradients never collide.
 */
(function () {
  let n = 0;
  const uid = () => 'a' + (++n) + '_';
  const NS = 'xmlns="http://www.w3.org/2000/svg"';

  function defs(p) {
    return `
    <linearGradient id="${p}gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f9e3a1"/><stop offset=".4" stop-color="#d9a94f"/>
      <stop offset=".75" stop-color="#b8842f"/><stop offset="1" stop-color="#8e6020"/>
    </linearGradient>
    <linearGradient id="${p}goldV" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f6dc92"/><stop offset=".55" stop-color="#cf9c42"/><stop offset="1" stop-color="#94651f"/>
    </linearGradient>
    <linearGradient id="${p}leaf" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#3d6a2b"/><stop offset=".55" stop-color="#679640"/><stop offset="1" stop-color="#a3c46e"/>
    </linearGradient>
    <linearGradient id="${p}leafD" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#2d5220"/><stop offset=".6" stop-color="#4f7f33"/><stop offset="1" stop-color="#7ea653"/>
    </linearGradient>
    <linearGradient id="${p}petalW" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#cfcbb4"/><stop offset=".35" stop-color="#f3f0e4"/><stop offset="1" stop-color="#ffffff"/>
    </linearGradient>
    <linearGradient id="${p}petalR" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#c76f63"/><stop offset=".5" stop-color="#eaa596"/><stop offset="1" stop-color="#f9d3c6"/>
    </linearGradient>
    <linearGradient id="${p}petalR2" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#b95d53"/><stop offset=".6" stop-color="#e2907f"/><stop offset="1" stop-color="#f5c0b2"/>
    </linearGradient>
    <radialGradient id="${p}flame" cx=".5" cy=".72" r=".6">
      <stop offset="0" stop-color="#fffbe6"/><stop offset=".35" stop-color="#ffe066"/>
      <stop offset=".75" stop-color="#ff9a1f"/><stop offset="1" stop-color="#ff6a00" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${p}glow" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#ffcf6b" stop-opacity=".55"/><stop offset="1" stop-color="#ffcf6b" stop-opacity="0"/>
    </radialGradient>

    <g id="${p}L">
      <path d="M0 0 C18 -15 54 -17 82 0 C54 17 18 15 0 0Z" fill="url(#${p}leaf)"/>
      <path d="M2 0 Q42 -1.5 80 0" stroke="#27461b" stroke-width="1.1" fill="none" opacity=".55"/>
      <path d="M22 -1 L32 -8 M36 -1 L47 -9 M50 -1 L60 -7 M22 1 L32 8 M36 1 L47 9 M50 1 L60 7" stroke="#27461b" stroke-width=".6" opacity=".35"/>
    </g>
    <g id="${p}Ld">
      <path d="M0 0 C18 -15 54 -17 82 0 C54 17 18 15 0 0Z" fill="url(#${p}leafD)"/>
      <path d="M2 0 Q42 -1.5 80 0" stroke="#1d3513" stroke-width="1.1" fill="none" opacity=".5"/>
    </g>
    <g id="${p}D">
      ${Array.from({ length: 14 }, (_, i) =>
        `<ellipse cx="0" cy="-9.5" rx="2.7" ry="8.2" fill="#fffdf7" stroke="#ded7c4" stroke-width=".55" transform="rotate(${(i * 360) / 14})"/>`).join('')}
      <circle r="4.8" fill="#f1b52c"/><circle r="4.8" fill="none" stroke="#c4850f" stroke-width=".9"/>
      <circle cx="-1.4" cy="-1.3" r=".8" fill="#fff0b3"/><circle cx="1.3" cy=".8" r=".7" fill="#b57606"/>
    </g>
    <g id="${p}B">
      <ellipse rx="2.3" ry="5" fill="#fffaf0" stroke="#dcd2b8" stroke-width=".5"/>
      <path d="M-1.6 4 Q0 7.5 1.6 4" fill="#8fae5c"/>
    </g>
    <g id="${p}P">
      ${Array.from({ length: 5 }, (_, i) =>
        `<ellipse cx="0" cy="-3.6" rx="2.6" ry="3.4" fill="#f6c3cc" stroke="#e39aa9" stroke-width=".4" transform="rotate(${i * 72})"/>`).join('')}
      <circle r="1.4" fill="#d9687f"/>
    </g>
    <g id="${p}R">
      ${Array.from({ length: 7 }, (_, i) =>
        `<path d="M0 0 C-15 -6 -17 -27 0 -29 C17 -27 15 -6 0 0Z" fill="url(#${p}petalR2)" stroke="#b86257" stroke-width=".6" transform="rotate(${i * 51.4})"/>`).join('')}
      ${Array.from({ length: 5 }, (_, i) =>
        `<path d="M0 0 C-15 -6 -17 -27 0 -29 C17 -27 15 -6 0 0Z" fill="url(#${p}petalR)" stroke="#c46f63" stroke-width=".7" transform="rotate(${i * 72 + 30}) scale(.66)"/>`).join('')}
      <circle r="7" fill="#e99c8d"/>
      <path d="M-3 -1 C-3 -7 6 -7 6 -1 C6 5 -6 6 -7 -1 C-8 -9 4 -12 9 -5" stroke="#a9544b" stroke-width="1.2" fill="none"/>
    </g>
    <g id="${p}W">
      ${Array.from({ length: 8 }, (_, i) =>
        `<path d="M0 0 C-16 -10 -18 -40 0 -46 C18 -40 16 -10 0 0Z" fill="url(#${p}petalW)" stroke="#c9c3aa" stroke-width=".6" transform="rotate(${i * 45})"/>`).join('')}
      ${Array.from({ length: 6 }, (_, i) =>
        `<path d="M0 0 C-16 -10 -18 -40 0 -46 C18 -40 16 -10 0 0Z" fill="url(#${p}petalW)" stroke="#c9c3aa" stroke-width=".7" transform="rotate(${i * 60 + 22}) scale(.7)"/>`).join('')}
      ${Array.from({ length: 5 }, (_, i) =>
        `<path d="M0 0 C-16 -10 -18 -40 0 -46 C18 -40 16 -10 0 0Z" fill="url(#${p}petalW)" stroke="#c2bb9f" stroke-width=".9" transform="rotate(${i * 72 + 8}) scale(.42)"/>`).join('')}
      <circle r="3.5" fill="#efe2b5"/>
    </g>`;
  }

  const use = (p, id, x, y, rot = 0, s = 1, extra = '') =>
    `<use href="#${p}${id}" transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" ${extra}/>`;

  /* Small hyacinth-like pink cluster */
  const pinkCluster = (p, x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    ${[[0, 0], [7, -5], [-7, -4], [3, -12], [-4, 8], [8, 6], [-9, 5], [1, 15], [12, -12]]
      .map(([a, b], i) => use(p, 'P', a, b, i * 23, 0.9 + (i % 3) * 0.12)).join('')}
  </g>`;

  /* Hanging string of daisies + jasmine buds */
  function strand(p, x, y0, len, daisyEvery = 34) {
    let out = `<path d="M${x} ${y0} Q${x + 2} ${y0 + len / 2} ${x} ${y0 + len}" stroke="#6f8f45" stroke-width="1" fill="none"/>`;
    let i = 0;
    for (let y = y0 + 10; y < y0 + len; y += 11, i++) {
      if (i % 3 === 1) out += use(p, 'D', x, y, i * 17, 0.62);
      else out += use(p, 'B', x + (i % 2 ? 2 : -2), y, i % 2 ? 18 : -18, 0.9);
    }
    out += use(p, 'D', x, y0 + len + 4, 10, 0.8);
    return out;
  }

  /* ---------- Top-left floral garland (mirror for right) ---------- */
  function cornerTop(mirror) {
    const p = uid();
    const t = mirror ? 'transform="translate(360 0) scale(-1 1)"' : '';
    const leaves = [
      [0, 18, 12, 1.5, 'L'], [0, 6, 28, 1.7, 'Ld'], [0, 40, 50, 1.6, 'L'], [0, 70, 72, 1.5, 'Ld'],
      [0, 110, 84, 1.4, 'L'], [30, 0, 8, 1.6, 'L'], [90, 0, 14, 1.5, 'Ld'], [150, 0, 10, 1.4, 'L'],
      [200, 4, 22, 1.2, 'Ld'], [60, 18, 38, 1.2, 'Ld'], [20, 150, 80, 1.1, 'L'], [120, 20, 55, 1, 'L'],
      [230, 6, 30, 1, 'L'], [10, 190, 95, 1, 'Ld'],
    ];
    const daisies = [
      [34, 24, 1.3], [68, 16, 1.1], [100, 34, 1.25], [138, 20, 1.05], [172, 30, 1],
      [18, 58, 1.2], [54, 54, 1.35], [88, 70, 1.05], [22, 100, 1.15], [56, 94, 1],
      [124, 58, 0.9], [206, 22, 0.85], [30, 140, 0.95], [240, 18, 0.7],
    ];
    return `<svg ${NS} viewBox="0 0 360 360" width="360" height="360"><defs>${defs(p)}</defs><g ${t}>
      ${leaves.map(([x, y, r, s, id]) => use(p, id, x, y, r, s)).join('')}
      ${strand(p, 150, 40, 110)} ${strand(p, 44, 150, 140)} ${strand(p, 214, 30, 70)} ${strand(p, 96, 90, 80)}
      ${pinkCluster(p, 150, 42, 1.25)} ${pinkCluster(p, 40, 128, 1.1)} ${pinkCluster(p, 190, 16, 1)} ${pinkCluster(p, 104, 90, 0.9)}
      ${daisies.map(([x, y, s], i) => use(p, 'D', x, y, i * 29, s)).join('')}
    </g></svg>`;
  }

  /* ---------- Bottom-left bouquet: roses, white flowers, daisies ---------- */
  function cornerBottom(mirror) {
    const p = uid();
    const W = 360, H = 520;
    const t = mirror ? `transform="translate(${W} 0) scale(-1 1)"` : '';
    const stems = [
      'M10 520 C20 420 30 330 60 250', 'M40 520 C50 430 80 330 100 260', 'M0 430 C10 360 20 280 30 200',
      'M120 520 C120 470 140 420 170 380',
    ];
    const leaves = [
      [60, 250, -130, 1.2, 'L'], [100, 262, -60, 1.1, 'Ld'], [30, 300, -150, 1.2, 'Ld'], [40, 320, -40, 1.3, 'L'],
      [70, 360, -20, 1.2, 'L'], [18, 380, -160, 1.1, 'L'], [90, 330, 10, 1, 'Ld'], [10, 250, -100, 1, 'L'],
      [130, 420, -30, 1.3, 'L'], [150, 460, -10, 1.2, 'Ld'], [60, 420, -60, 1.3, 'Ld'], [0, 470, -30, 1.3, 'L'],
      [180, 500, -15, 1.1, 'L'], [110, 380, -80, 0.9, 'L'],
    ];
    const roses = [[60, 190, 0, 1.05], [22, 232, 30, 0.95], [98, 220, 60, 0.85], [48, 262, 15, 0.85], [14, 180, 45, 0.7], [84, 170, 20, 0.7]];
    const whites = [[70, 440, 10, 1.25], [180, 488, 30, 1.05], [16, 500, 50, 1.15], [128, 470, 70, 0.8]];
    const daisies = [[128, 360, 0.95], [150, 330, 0.8], [24, 400, 1], [240, 506, 0.95], [212, 460, 0.8], [110, 300, 0.75], [8, 330, 0.8]];
    return `<svg ${NS} viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs>${defs(p)}</defs><g ${t}>
      ${stems.map((d) => `<path d="${d}" stroke="#4d7832" stroke-width="3" fill="none" stroke-linecap="round"/>`).join('')}
      ${leaves.map(([x, y, r, s, id]) => use(p, id, x, y, r, s)).join('')}
      ${pinkCluster(p, 118, 250, 1.1)} ${pinkCluster(p, 8, 206, 0.9)}
      ${roses.map(([x, y, r, s]) => use(p, 'R', x, y, r, s)).join('')}
      ${whites.map(([x, y, r, s]) => use(p, 'W', x, y, r, s)).join('')}
      ${daisies.map(([x, y, s], i) => use(p, 'D', x, y, i * 31, s)).join('')}
    </g></svg>`;
  }

  /* ---------- Hanging brass diya ---------- */
  function lamp(chain = 150) {
    const p = uid();
    const W = 90, H = chain + 120;
    let links = '';
    for (let y = 2, i = 0; y < chain; y += 9, i++) {
      links += i % 2
        ? `<ellipse cx="45" cy="${y + 4}" rx="1.6" ry="4.6" fill="none" stroke="url(#${p}goldV)" stroke-width="1.5"/>`
        : `<ellipse cx="45" cy="${y + 4}" rx="3.6" ry="4.6" fill="none" stroke="url(#${p}gold)" stroke-width="1.5"/>`;
    }
    const c = chain;
    return `<svg ${NS} viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs>${defs(p)}</defs>
      ${links}
      <circle cx="45" cy="${c + 4}" r="4" fill="url(#${p}gold)"/>
      <path d="M33 ${c + 22} Q45 ${c + 2} 57 ${c + 22} Z" fill="url(#${p}gold)" stroke="#8e6020" stroke-width=".6"/>
      <path d="M36 ${c + 22} L14 ${c + 64} M54 ${c + 22} L76 ${c + 64} M45 ${c + 22} L45 ${c + 62}" stroke="url(#${p}goldV)" stroke-width="1.1"/>
      <circle cx="45" cy="${c + 24}" r="2.2" fill="#8e6020"/>
      <ellipse cx="45" cy="${c + 58}" rx="40" ry="26" fill="url(#${p}glow)" class="lamp-glow"/>
      <g class="flame">
        <path d="M45 ${c + 36} C52 ${c + 48} 51 ${c + 58} 45 ${c + 61} C39 ${c + 58} 38 ${c + 48} 45 ${c + 36}Z" fill="url(#${p}flame)"/>
        <path d="M17 ${c + 46} C22 ${c + 54} 21 ${c + 61} 17 ${c + 63} C13 ${c + 61} 12 ${c + 54} 17 ${c + 46}Z" fill="url(#${p}flame)"/>
        <path d="M73 ${c + 46} C78 ${c + 54} 77 ${c + 61} 73 ${c + 63} C69 ${c + 61} 68 ${c + 54} 73 ${c + 46}Z" fill="url(#${p}flame)"/>
      </g>
      <path d="M6 ${c + 62} Q10 ${c + 60} 16 ${c + 63} L74 ${c + 63} Q80 ${c + 60} 84 ${c + 62} Q78 ${c + 88} 45 ${c + 92} Q12 ${c + 88} 6 ${c + 62}Z"
        fill="url(#${p}gold)" stroke="#8e6020" stroke-width=".7"/>
      <path d="M12 ${c + 68} Q45 ${c + 76} 78 ${c + 68}" stroke="#fbe7ad" stroke-width="1.1" fill="none" opacity=".8"/>
      <path d="M20 ${c + 78} Q45 ${c + 86} 70 ${c + 78}" stroke="#8e6020" stroke-width=".8" fill="none" opacity=".6"/>
      <path d="M36 ${c + 91} Q45 ${c + 100} 54 ${c + 91}Z" fill="url(#${p}gold)"/>
      <path d="M45 ${c + 96} Q51 ${c + 106} 45 ${c + 118} Q39 ${c + 106} 45 ${c + 96}Z" fill="url(#${p}gold)" stroke="#8e6020" stroke-width=".5"/>
    </svg>`;
  }

  /* ---------- Gold arch ornament (top; flip for bottom) ---------- */
  function arch(flip) {
    const p = uid();
    const t = flip ? 'transform="translate(0 70) scale(1 -1)"' : '';
    const g = `url(#${p}gold)`;
    return `<svg ${NS} viewBox="0 0 400 70" width="400" height="70"><defs>${defs(p)}</defs><g ${t} fill="none" stroke="${g}" stroke-linecap="round">
      <path d="M40 6 H140 C160 6 168 20 178 30 C186 38 194 44 200 60 C206 44 214 38 222 30 C232 20 240 6 260 6 H360" stroke-width="2.2"/>
      <path d="M150 11 C164 12 172 24 182 34 C190 42 196 46 200 52 C204 46 210 42 218 34 C228 24 236 12 250 11" stroke-width="1.1"/>
      <path d="M200 20 C193 26 193 34 200 40 C207 34 207 26 200 20Z" fill="${g}" stroke-width=".6"/>
      <path d="M200 40 C190 36 184 30 186 24 C192 26 197 32 200 40 C203 32 208 26 214 24 C216 30 210 36 200 40Z" stroke-width="1"/>
      <path d="M110 6 C116 14 124 14 130 6 M270 6 C276 14 284 14 290 6 M70 6 C74 11 80 11 84 6 M316 6 C320 11 326 11 330 6" stroke-width="1"/>
      ${[100, 120, 280, 300, 60, 340].map((x) => `<circle cx="${x}" cy="12" r="1.4" fill="${g}" stroke="none"/>`).join('')}
      <circle cx="200" cy="64" r="2.4" fill="${g}" stroke="none"/>
    </g></svg>`;
  }

  /* ---------- Divider flourish ---------- */
  function flourish() {
    const p = uid();
    const half = `<path d="M8 12 H78 C90 12 94 4 103 5 C111 6 111 16 104 17 C98 18 97 10 103 10" />
      <path d="M40 12 C50 6 60 6 66 12" stroke-width=".8"/><circle cx="8" cy="12" r="1.6" fill="url(#${p}gold)" stroke="none"/>`;
    return `<svg ${NS} viewBox="0 0 240 24" width="240" height="24"><defs>${defs(p)}</defs>
      <g fill="none" stroke="url(#${p}gold)" stroke-width="1.3" stroke-linecap="round">
        ${half}<g transform="translate(240 0) scale(-1 1)">${half}</g>
        <path d="M113 12 L120 5 L127 12 L120 19Z" fill="url(#${p}gold)" stroke="none"/>
      </g></svg>`;
  }

  /* ---------- Lotus motif (door panels, badges) ---------- */
  function lotus(color = '#e7c26d') {
    return `<svg ${NS} viewBox="0 0 100 70" width="100" height="70"><g fill="none" stroke="${color}" stroke-width="1.6" stroke-linejoin="round">
      <path d="M50 8 C40 22 40 44 50 60 C60 44 60 22 50 8Z"/>
      <path d="M50 60 C38 52 28 36 30 20 C40 26 47 40 50 60 C53 40 60 26 70 20 C72 36 62 52 50 60Z"/>
      <path d="M50 60 C34 58 18 48 12 32 C26 32 40 44 50 60 C60 44 74 32 88 32 C82 48 66 58 50 60Z"/>
      <path d="M20 64 H80" /><path d="M30 68 H70" />
    </g></svg>`;
  }

  /* Kalash (sacred pot with mango leaves & coconut) for the door */
  function kalash() {
    const p = uid();
    return `<svg ${NS} viewBox="0 0 100 120" width="100" height="120"><defs>${defs(p)}</defs>
      ${[-50, -25, 0, 25, 50].map((r) => `<g transform="translate(50 44) rotate(${r - 90})"><use href="#${p}L" transform="scale(.62)"/></g>`).join('')}
      <ellipse cx="50" cy="30" rx="13" ry="16" fill="#8a5a2b"/><path d="M40 22 Q50 10 60 22" stroke="#5b3717" stroke-width="2" fill="none"/>
      <path d="M34 50 H66 L62 56 Q86 70 76 96 Q68 110 50 110 Q32 110 24 96 Q14 70 38 56Z" fill="url(#${p}gold)" stroke="#7a4f18" stroke-width="1"/>
      <path d="M26 80 Q50 90 74 80" stroke="#b5332a" stroke-width="3" fill="none"/>
      <circle cx="50" cy="72" r="4" fill="#b5332a"/>
      <path d="M36 112 H64 L60 118 H40Z" fill="url(#${p}gold)"/>
    </svg>`;
  }

  window.GPArt = { cornerTop, cornerBottom, lamp, arch, flourish, lotus, kalash };
})();
