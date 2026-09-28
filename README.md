# GrihaPravesam · గృహప్రవేశం

A personalised Griha Pravesam invitation that works on phones.

1. A guest scans the QR code on their poster, or taps the link.
2. A carved wooden door with a mango-leaf toran appears. Their name is on the nameplate: **"Mr. Sudhakar and Family"**.
3. They tap the little clay **diya** to light it. Soft veena music begins, the door swings open and petals fall. The invitation card assembles itself: florals slide in from the left and right, brass diyas drop and swing, Om glows, and then the text rises line by line.
4. A gold button shows a live countdown ("47 days · 17 hrs to go"). Tapping it moves to the next pages, each framed with the same florals: a full countdown with the order of the day, then rotating blessings from the family with a photo.
5. On the last page a **తెలుగు · English** button replays the whole invitation in the other language.
6. The invitation appears in the same theme as the poster the guest received (cream & gold, deep maroon or mango-leaf green).
7. After the first visit, the invitation opens even without signal.

There is no build step or server code. It is plain HTML, CSS and JS, and all artwork is original inline SVG.

## Pages

| Page | Who uses it | What it does |
|---|---|---|
| `index.html` | Guests | Diya → door → invitation → details. Reads the guest name from the link. Includes Directions, Save date (.ics), Replay, music mute and the countdown. |
| `poster.html` | You (host) | Type a family name and get a **1080×1920 (9:16)** poster with their personal QR code, in **cream & gold, deep maroon or mango-leaf green**. Share it directly to WhatsApp or Instagram, download it, or copy the link. **Batch posters**: paste a list of names and get every poster in one ZIP, plus a spreadsheet of links. |
| `config.html` | You (host) | Edit every line of text in **Telugu and English**, the date, map link and site link, the **order of the day**, the **blessings** (photo and messages), **music** and the default poster theme. Live phone preview; tap any text in it to jump to its box. |
| `admin.html` | You (host) | Dashboard showing how many invites you've prepared and shared, a countdown, and whether the site link and text are published. Also a searchable guest table with QR, name, language, time prepared, last shared and status. You can bulk-add guests, add notes, download QR codes, export to Excel (CSV), and back up or merge the list. |
| `config.js` | Published settings | What guests actually see. |

> The guest list is saved in the browser of the device where you prepare invites; nothing is uploaded. To combine lists from your phone and laptop, use **Admin → ⋯ → Back up** on one device and **Restore / merge** on the other.

## Setup (one time)

1. **Host the folder** anywhere static. The QR codes must point to a public address:
   - **GitHub Pages** (this repo, https://github.com/Naga2402/GrihaPravesh): Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)` → Save. After a minute the site is live at `https://naga2402.github.io/GrihaPravesh/`.
   - **Netlify Drop**: drag the project folder onto https://app.netlify.com/drop.
2. Open `https://your-site/config.html`, fill in the text, and set **Site link** to your public address (for GitHub Pages: `https://naga2402.github.io/GrihaPravesh/`).
3. Press **Export config.js**, replace `config.js` in the folder with the downloaded file, and redeploy.

   (Edits in the editor are saved on that device only, until you export and redeploy.)

## Sharing on the spot

Open `https://your-site/poster.html` on your phone, type the family name, choose తెలుగు or English and a theme, and tap **WhatsApp** or **Share poster**. The share sheet opens with the poster image and the invitation text; pick WhatsApp. (If WhatsApp drops the text, it is already copied, so just paste it.) **Copy link** copies the guest's link.

## Guest links

- `?k=…`: compact name (ASCII + Telugu, 1 byte per letter, keeps QR codes small), letters and digits only so WhatsApp never breaks the link
- `?u=…`: UTF-8 name for any other script, also letters and digits only
- `?n=…` / `?g=…`: the older formats, still understood
- `&t=m` / `&t=g`: maroon or green theme (the poster's theme)
- `?to=Mr.%20Sudhakar%20and%20Family`: plain text; handy for typing by hand
- `&l=en` / `&l=te`: override the language for this guest

## Music

The built-in tune is a soft veena-style melody in raga Mohanam over a tanpura drone, synthesised in the browser (no audio file needed). To use your own recording, copy an MP3 into `assets/audio/`, add its file name to `assets/audio/tracks.json`, and pick it from the **Music** list under **Edit text → Music & poster look**. Keep files small (under 3 MB) so they load quickly on phones. Browsers only allow sound after a tap, so it starts when the guest lights the diya.

## Offline

`sw.js` caches the invitation, fonts and libraries after a guest's first visit, so it opens again without signal at the venue. It always fetches fresh files when online. After each deploy you can bump `VERSION` in `sw.js` to clear old copies.

## Fonts

- Telugu: **Ramaraja** (titles, names) and **Suravaram** (body)
- English: **Pinyon Script** and **Cormorant Garamond**
- Om: **Tiro Devanagari Sanskrit**

All are loaded from Google Fonts. The studio pages also use Tailwind CSS (Play CDN, with its reset disabled so it layers on top of `studio.css`).

## Test locally

```bash
python -m http.server 8123
```

Then open http://localhost:8123/poster.html. (Port 5173 is reserved by Windows on some machines, hence 8123.) QR codes will show a "local address" warning until the site link is set.

## Project layout

```
index.html          guest invitation (door, card, detail pages)
poster.html         poster studio (single + batch ZIP)
config.html         text / date / schedule / blessings / music editor
admin.html          guest dashboard
config.js           published settings
sw.js               offline cache
assets/css/         invite.css, studio.css, admin.css
assets/js/          core.js (links, fonts, guest list), art.js (SVG artwork), invite.js,
                    poster.js (canvas renderer), music.js, studio-*.js, admin.js, tw-config.js
assets/audio/       optional music + tracks.json
```
