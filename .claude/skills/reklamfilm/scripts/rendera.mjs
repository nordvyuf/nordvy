// Renderar en reklamfilm till mp4.
//   node .claude/skills/reklamfilm/scripts/rendera.mjs <film.json> [format ...] [--test]
// Format: 9x16 (Reels, Stories), 4x5 (Facebook- och Instagram-flödet), 1x1. Standard: alla tre.
// --test sparar bara ett kontaktark (en bild per sekund) så att du kan kolla filmen snabbt.
// Filerna hamnar bredvid film.json: <namn>-<format>.mp4 och <namn>-<format>-koll.jpg.
// Kräver Chrome och ffmpeg (ffmpeg -version ska fungera i terminalen).
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve, chrome } from './chrome.mjs';

const args = process.argv.slice(2);
const filmPath = path.resolve(args.find((x) => x.endsWith('.json')) || '');
const test = args.includes('--test');
const formats = args.filter((x) => /^\d+x\d+$/.test(x));
const film = JSON.parse(await readFile(filmPath, 'utf8'));
const dir = path.dirname(filmPath);
const skill = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repo = path.resolve(skill, '../../..');
const SIZES = { '9x16': [1080, 1920], '4x5': [1080, 1350], '1x1': [1080, 1080] };
const namn = film.namn || path.basename(filmPath, '.json');

const site = await serve(path.join(repo, 'public'), 0, { '/film/': dir, '/mall/': path.join(skill, 'mall') });
const c = await chrome();
try {
  for (const format of formats.length ? formats : film.format || ['9x16', '4x5', '1x1']) {
    const [w, h] = SIZES[format];
    await c.size(w, h);
    await c.go(`${site.url}/mall/film.html?film=/film/${encodeURIComponent(path.basename(filmPath))}&format=${format}`, 800);
    const info = await c.js('window.__ready.then(() => { document.getAnimations().forEach((a) => a.pause()); return window.__film; })');
    if (!info) throw new Error('Filmen kunde inte byggas. Öppna mallen i en webbläsare och läs felet.');
    const fps = test ? 1 : info.fps;
    const frames = Math.round((info.ms / 1000) * fps);
    const tmp = await mkdtemp(path.join(tmpdir(), 'reklamfilm-bilder-'));
    for (let i = 0; i < frames; i++) {
      const t = test ? i * 1000 + 600 : (i * 1000) / fps;
      await c.js(`document.getAnimations().forEach((a) => { a.currentTime = ${t}; })`);
      await writeFile(path.join(tmp, `${String(i).padStart(5, '0')}.jpg`), await c.shot({ format: 'jpeg', quality: 92 }));
      if (!test && i % 60 === 0) process.stdout.write(`${format}: ${i}/${frames}\r`);
    }
    if (test) {
      const out = path.join(dir, `${namn}-${format}-koll.jpg`);
      const cols = Math.min(frames, 8);
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '1', '-i', path.join(tmp, '%05d.jpg'), '-vf', `scale=320:-1,tile=${cols}x${Math.ceil(frames / cols)}:padding=8:color=white`, '-frames:v', '1', out]);
      console.log('kontaktark', out);
    } else {
      const out = path.join(dir, `${namn}-${format}.mp4`);
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(tmp, '%05d.jpg'), '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out]);
      console.log('film', out, `${(info.ms / 1000).toFixed(1)} s`);
    }
    await rm(tmp, { recursive: true, force: true });
  }
} finally {
  c.close();
  site.close();
}
