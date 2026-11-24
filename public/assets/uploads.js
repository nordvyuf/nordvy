// Logga och bilder som kunden laddar upp i självintervjun.
//
// Bilderna görs mindre i webbläsaren (högst 1600 px, JPEG) innan de skickas, så att ett helt
// underlag ryms i ett mejl. Loggan behåller genomskinligheten (PNG) och en SVG skickas som den är.
// Filerna sparas i webbläsarens IndexedDB, så att de finns kvar om kunden laddar om sidan.
// Ingenting laddas upp förrän kunden skickar underlaget: då följer filerna med mejlet till Nordvy.

export const MAX_PHOTOS = 10;
const PHOTO_PX = 1600;
const LOGO_PX = 1000;
const THUMB_PX = 160;
const SVG_MAX = 300_000;
const DB = 'nordvy-intervju';
const STORE = 'filer';

let files = []; // { id, kind: 'logo' | 'photo', name, type, data (base64), thumb (data:-adress) }
const listeners = new Set();
const changed = () => listeners.forEach((fn) => fn(files));
export const onChange = (fn) => listeners.add(fn);
export const all = () => files;
export const logo = () => files.find((f) => f.kind === 'logo') || null;
export const photos = () => files.filter((f) => f.kind === 'photo');

/* ------------------------------------------------------------ IndexedDB */

function openDb() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('ingen indexeddb'));
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function withStore(mode, fn) {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const out = fn(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(out?.result ?? out);
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    return null; // lagring är en bekvämlighet: filerna finns ändå kvar så länge sidan är öppen
  }
}

export async function restoreFiles() {
  const saved = await withStore('readonly', (s) => s.getAll());
  if (Array.isArray(saved)) {
    files = saved.filter((f) => f && f.data && (f.kind === 'logo' || f.kind === 'photo'));
    changed();
  }
  return files;
}
export async function clearFiles() {
  files = [];
  changed();
  await withStore('readwrite', (s) => s.clear());
}
export async function removeFile(id) {
  files = files.filter((f) => f.id !== id);
  changed();
  await withStore('readwrite', (s) => s.delete(id));
}

/* ----------------------------------------------------------- förminska */

async function bitmapOf(file) {
  // createImageBitmap behöver ingen <img> och fungerar med sajtens strikta CSP.
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      /* prova nästa sätt */
    }
  }
  const url = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('kunde inte läsa bilden'));
    img.src = url;
  });
}

function draw(bitmap, max) {
  const w = bitmap.width;
  const h = bitmap.height;
  const scale = Math.min(1, max / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas;
}

const base64Of = (dataUrl) => String(dataUrl).slice(String(dataUrl).indexOf(',') + 1);
const safeName = (name, ext) => `${String(name || 'bild').replace(/\.[a-z0-9]+$/i, '').replace(/[^a-zA-Z0-9åäöÅÄÖ_-]+/g, '-').slice(0, 50) || 'bild'}.${ext}`;

async function prepare(file, kind) {
  if (kind === 'logo' && file.type === 'image/svg+xml') {
    if (file.size > SVG_MAX) throw new Error('för stor');
    const text = await file.text();
    const data = btoa(unescape(encodeURIComponent(text)));
    return { kind, name: safeName(file.name, 'svg'), type: 'image/svg+xml', data, thumb: `data:image/svg+xml;base64,${data}` };
  }
  if (!/^image\//.test(file.type)) throw new Error('inte en bild');
  const bitmap = await bitmapOf(file);
  const logoPng = kind === 'logo';
  const big = draw(bitmap, logoPng ? LOGO_PX : PHOTO_PX);
  const type = logoPng ? 'image/png' : 'image/jpeg';
  const data = base64Of(big.toDataURL(type, 0.82));
  const thumb = draw(bitmap, THUMB_PX).toDataURL('image/jpeg', 0.7);
  bitmap.close?.();
  return { kind, name: safeName(file.name, logoPng ? 'png' : 'jpg'), type, data, thumb };
}

// Lägger till filer av ett slag. En ny logga ersätter den gamla. Ger { added, failed }.
export async function addFiles(list, kind) {
  const chosen = [...(list || [])];
  let added = 0;
  let failed = 0;
  for (const file of kind === 'logo' ? chosen.slice(0, 1) : chosen) {
    if (kind === 'photo' && photos().length >= MAX_PHOTOS) break;
    try {
      const prepared = await prepare(file, kind);
      const entry = { id: `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ...prepared };
      if (kind === 'logo') {
        const old = logo();
        if (old) await removeFile(old.id);
      }
      files = [...files, entry];
      added += 1;
      await withStore('readwrite', (s) => s.put(entry));
    } catch {
      failed += 1;
    }
  }
  changed();
  return { added, failed };
}

// Det som skickas med underlaget.
export const payload = () => files.map(({ kind, name, type, data }) => ({ kind, name, type, data }));

// Öppnar filväljaren. Ger de valda filerna, eller en tom lista om kunden avbröt.
export function pickFiles(kind) {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = kind === 'logo' ? 'image/png,image/jpeg,image/webp,image/svg+xml' : 'image/*';
    input.multiple = kind === 'photo';
    input.hidden = true;
    let done = false;
    const finish = (list) => {
      if (done) return;
      done = true;
      input.remove();
      resolve(list);
    };
    input.addEventListener('change', () => finish([...(input.files || [])]));
    input.addEventListener('cancel', () => finish([]));
    document.body.append(input);
    input.click();
  });
}

// En rad med små bilder, till exempel i chatten eller på sista steget.
export function thumbStrip(list, { onRemove } = {}) {
  const strip = document.createElement('div');
  strip.className = 'thumbs';
  for (const f of list) {
    const fig = document.createElement('figure');
    const img = document.createElement('img');
    img.src = f.thumb;
    img.alt = f.kind === 'logo' ? 'Er logga' : f.name;
    img.loading = 'lazy';
    fig.append(img);
    if (onRemove) {
      const x = document.createElement('button');
      x.type = 'button';
      x.className = 'thumb-x';
      x.textContent = '×';
      x.setAttribute('aria-label', `Ta bort ${f.kind === 'logo' ? 'loggan' : f.name}`);
      x.addEventListener('click', () => onRemove(f));
      fig.append(x);
    }
    strip.append(fig);
  }
  return strip;
}
