// Mikrofonknappen i självintervjun: kunden pratar i stället för att skriva.
//
// Ett tryck startar inspelningen och ett tryck till stoppar den (den stannar själv efter en minut).
// Ljudet görs om till en liten WAV-fil (16 kHz, mono) i webbläsaren och skickas till
// /api/interview/transcribe, där Whisper på Cloudflare Workers AI gör om det till text. Ljudet sparas
// inte. Texten läggs i svarsrutan, så att kunden kan läsa och rätta den innan den skickas.

const MAX_SECONDS = 60;
const RATE = 16000;

export const micSupported = () =>
  Boolean(navigator.mediaDevices?.getUserMedia && window.MediaRecorder && (window.AudioContext || window.webkitAudioContext) && window.OfflineAudioContext);

// Gör om inspelningen (webm/opus eller mp4, beroende på webbläsare) till WAV i 16 kHz mono.
export async function toWav(blob) {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const ctx = new Ctx();
  let decoded;
  try {
    decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
  } finally {
    ctx.close?.();
  }
  const length = Math.max(1, Math.ceil(decoded.duration * RATE));
  const offline = new OfflineAudioContext(1, length, RATE);
  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination);
  source.start();
  const rendered = await offline.startRendering();
  return encodeWav(rendered.getChannelData(0), RATE);
}

export function encodeWav(samples, rate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const text = (at, s) => [...s].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)));
  text(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Uint8Array(buffer);
}

function base64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

export function createMic({ button, input, onText, onState }) {
  if (!button || !micSupported()) return null;
  button.hidden = false;
  let recorder = null;
  let stream = null;
  let chunks = [];
  let timer = null;
  let ticker = null;
  let busy = false;

  const say = (text, bad = false) => onState?.(text, bad);
  const stopTracks = () => {
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
  };

  async function start() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
    } catch {
      say('Mikrofonen gick inte att använda. Tillåt mikrofonen i webbläsaren, eller skriv ditt svar.', true);
      return;
    }
    chunks = [];
    recorder = new MediaRecorder(stream);
    recorder.addEventListener('dataavailable', (e) => e.data.size && chunks.push(e.data));
    recorder.addEventListener('stop', finish, { once: true });
    recorder.start();
    button.setAttribute('aria-pressed', 'true');
    button.setAttribute('aria-label', 'Sluta spela in');
    let left = MAX_SECONDS;
    say(`Lyssnar … tryck igen när du är klar (${left} s kvar).`);
    ticker = setInterval(() => {
      left -= 1;
      if (left > 0) say(`Lyssnar … tryck igen när du är klar (${left} s kvar).`);
    }, 1000);
    timer = setTimeout(stop, MAX_SECONDS * 1000);
  }

  function stop() {
    clearTimeout(timer);
    clearInterval(ticker);
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-label', 'Prata in ditt svar');
  }

  async function finish() {
    stopTracks();
    const blob = new Blob(chunks, { type: recorder?.mimeType || 'audio/webm' });
    recorder = null;
    if (blob.size < 2000) return say('Jag hörde inget. Prova igen, eller skriv ditt svar.', true);
    busy = true;
    button.classList.add('busy');
    say('Gör om ditt tal till text …');
    try {
      const wav = await toWav(blob);
      const response = await fetch('/api/interview/transcribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ audio: base64(wav) }),
      });
      const data = await response.json().catch(() => null);
      const text = String(data?.text || '').trim();
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'fel');
      if (!text) return say('Jag hörde inget. Prova igen, eller skriv ditt svar.', true);
      input.value = [input.value.trim(), text].filter(Boolean).join(' ');
      onText?.(text);
      input.focus({ preventScroll: true });
      say('Läs igenom texten, rätta om något blev fel och tryck på pilen.');
    } catch {
      say('Det gick inte att göra om talet till text just nu. Skriv ditt svar i stället.', true);
    } finally {
      busy = false;
      button.classList.remove('busy');
    }
  }

  button.addEventListener('click', () => {
    if (busy) return;
    if (recorder) stop();
    else start();
  });
  return { stop };
}
