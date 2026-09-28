Optional background music
=========================

The invitation plays a built-in veena-style tune (raga Mohanam) that is made
in the browser, so this folder can stay empty.

To use your own track instead (for example a nadaswaram recording):
  1. Copy the MP3 into this folder, e.g. assets/audio/nadaswaram.mp3
  2. Add the file name to tracks.json in this folder (needed on hosted sites,
     which cannot list folders; when testing on your computer it is found anyway).
  3. Open config.html -> "Music & poster look" and pick it from the Music list.
  4. Export config.js and redeploy.

Keep the file small (under 2-3 MB) so it loads quickly on phones, and make sure
you have the right to use the recording.
