// Gemensamt för skillen reklamfilm: en liten webbserver för repot och en Chrome utan fönster
// som styrs med Chrome DevTools Protocol. Inga paket behöver installeras (Node 22 eller nyare).
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, stat, mkdtemp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.woff2': 'font/woff2', '.mp4': 'video/mp4' };

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Serverar en mapp på http://127.0.0.1:<port>/. Mappar som slutar på / ger index.html, och /x ger x.html.
// mounts: { '/mall/': 'C:/…/mall' } lägger andra mappar under egna prefix.
export async function serve(root, port = 0, mounts = {}) {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://x');
      const pathname = decodeURIComponent(url.pathname);
      const mount = Object.keys(mounts).find((p) => pathname.startsWith(p));
      const base = path.resolve(mount ? mounts[mount] : root);
      let file = path.resolve(base, `.${mount ? pathname.slice(mount.length - 1) : pathname}`);
      if (!file.startsWith(base)) throw new Error('utanför');
      const s = await stat(file).catch(() => null);
      if (s?.isDirectory()) file = path.join(file, 'index.html');
      else if (!s && existsSync(`${file}.html`)) file = `${file}.html`;
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end('saknas');
    }
  });
  await new Promise((r) => server.listen(port, '127.0.0.1', r));
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => server.close() };
}

function chromePath() {
  const list = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'];
  const hit = list.find((p) => p && existsSync(p));
  if (!hit) throw new Error('Hittar ingen Chrome. Sätt CHROME_PATH till chrome.exe.');
  return hit;
}

// Startar Chrome utan fönster och ger send(), js(), shot() och close().
export async function chrome() {
  const port = 9300 + Math.floor(Math.random() * 600);
  const profile = await mkdtemp(path.join(tmpdir(), 'reklamfilm-'));
  const proc = spawn(chromePath(), ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', '--hide-scrollbars', '--mute-audio', 'about:blank'], { stdio: 'ignore' });
  let target;
  for (let i = 0; i < 60 && !target; i++) {
    await sleep(250);
    try {
      target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page');
    } catch {
      /* startar fortfarande */
    }
  }
  if (!target) throw new Error('Chrome startade inte.');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const wait = new Map();
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && wait.has(d.id)) {
      wait.get(d.id)(d);
      wait.delete(d.id);
    }
  };
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const i = ++id;
      const timer = setTimeout(() => reject(new Error(`${method} tog för lång tid`)), 30000);
      wait.set(i, (d) => {
        clearTimeout(timer);
        resolve(d);
      });
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  const js = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
  await send('Page.enable');
  return {
    send,
    js,
    async size(width, height, mobile = false, scale = 1) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile });
    },
    async go(url, ms = 2500) {
      await send('Page.navigate', { url });
      await sleep(ms);
    },
    async shot(opts = {}) {
      for (let i = 0; i < 3; i++) {
        const r = await send('Page.captureScreenshot', { format: 'png', ...opts }).catch(() => null);
        if (r?.result?.data) return Buffer.from(r.result.data, 'base64');
        await sleep(500);
      }
      throw new Error('Skärmbilden misslyckades.');
    },
    close() {
      try {
        ws.close();
      } catch {
        /* redan stängd */
      }
      proc.kill();
    },
  };
}
