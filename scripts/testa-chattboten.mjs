// Kör påhittade kunder genom självintervjun, mot en riktig adress eller den lokala servern,
// och skriver ner hela samtalet så att man kan läsa vad boten frågade och sparade.
//
//   node scripts/testa-chattboten.mjs                                   alla kunder mot live-sidan
//   node scripts/testa-chattboten.mjs https://<gren>-nordvy.nordvyuf.workers.dev cafe,kokbok
//   node scripts/testa-chattboten.mjs http://localhost:8788
//
// Resultatet hamnar i testresultat/<kund>.txt. Skriptet skickar aldrig in intervjun, så inga mejl går iväg.
// Varje hel intervju drar ungefär 1 000 av Workers AI:s 10 000 gratis enheter per dygn. Kör därför
// inte alla kunder mot live-sidan flera gånger samma dag, så att riktiga kunder också får AI:n.
import { writeFileSync, mkdirSync } from 'node:fs';
import { PERSONAS } from './testkunder.mjs';
import { NEED, hasValue } from '../public/assets/shared/brief.js';

const [base = 'https://nordvy.nordvyuf.workers.dev', which = 'all', outDir = 'testresultat'] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function post(path, body) {
  for (let i = 0; i < 4; i++) {
    const res = await fetch(base + path, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: base },
      body: JSON.stringify(body),
    });
    if (res.status === 429) {
      await sleep(15000);
      continue;
    }
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(data)}`);
    return data;
  }
  throw new Error('för många anrop, försök igen om en minut');
}

async function run(p) {
  // Samma regler som webbläsaren (public/assets/intervju.js) för följdfrågor och frågor till oss.
  const state = { brief: {}, issues: [], log: [], asked: ['foretagsnamn'], askCount: 1, carry: '', carryField: '' };
  const used = {};
  const sources = {};
  const errors = new Set();
  const lines = [`# ${p.id}: ${p.about}`, ''];
  state.log.push({ who: 'ai', text: 'Vad heter ditt företag?' });
  lines.push('BOT: Vad heter ditt företag?');
  for (let turn = 0; turn < 40; turn++) {
    const field = state.asked[0];
    const answers = [].concat(p.answers[field] ?? p.answers._default ?? 'vet inte');
    const n = used[field] || 0;
    used[field] = n + 1;
    const message = answers[Math.min(n, answers.length - 1)];
    state.log.push({ who: 'me', text: message });
    lines.push(`KUND [${field}]: ${message}`);
    const t = await post('/api/interview/turn', {
      brief: state.brief, issues: state.issues, history: state.log.slice(-14), asked: state.asked, askCount: state.askCount,
      carry: state.carry, carryField: state.carryField, message, edit: false, debug: true,
    });
    sources[t.source] = (sources[t.source] || 0) + 1;
    for (const e of t.debug?.errors || []) errors.add(e.slice(0, 160));
    state.brief = t.brief;
    state.issues = t.issues;
    if (t.saves?.length) lines.push(`   sparat: ${t.saves.map((s) => `${s.field}=«${s.value}»`).join(' | ')}`);
    if (t.debug?.reply && t.reply !== t.debug.reply) lines.push(`   (AI:n föreslog «${t.debug.reply}» om ${t.debug.asked})`);
    const sameField = t.asked?.[0] && t.asked[0] === field && !hasValue(state.brief, field);
    if (!t.skip) {
      state.carry = sameField ? [state.carry, message].filter(Boolean).join(' / ') : '';
      state.carryField = sameField ? field : '';
    }
    state.askCount = sameField ? state.askCount + 1 : 1;
    state.asked = t.asked || [];
    if (t.done || !t.reply) {
      lines.push('— KLAR —');
      break;
    }
    state.log.push({ who: 'ai', text: t.reply });
    lines.push(`BOT [${t.asked?.[0]}, ${t.source}]: ${t.reply}`);
    await sleep(1800);
  }
  lines.push('', '## Sparat', ...NEED.map((k) => `- ${k}: ${state.brief[k] ?? '(tomt)'}`), '', '## Att följa upp', ...state.issues.map((i) => `- ${i.topic}: ${i.text}`));
  if (p.draft) {
    const d = await post('/api/interview/draft', { brief: state.brief });
    lines.push('', '## Utkastets text från AI:n', d.copy ? JSON.stringify(d.copy, null, 1) : '(ingen, AI:n svarade inte)');
  }
  lines.push('', `Svar från: ${JSON.stringify(sources)}`, ...[...errors].map((e) => `AI-fel: ${e}`));
  writeFileSync(`${outDir}/${p.id}.txt`, lines.join('\n'));
  const questions = lines.filter((l) => l.startsWith('BOT')).length;
  console.log(`${p.id}: ${questions} frågor, ${JSON.stringify(sources)}${errors.size ? `, AI-fel: ${[...errors][0]}` : ''}`);
}

const list = which === 'all' ? PERSONAS : PERSONAS.filter((p) => which.split(',').includes(p.id));
if (!list.length) console.log(`Okänd kund. Välj bland: ${PERSONAS.map((p) => p.id).join(', ')}`);
for (const p of list) {
  try {
    await run(p);
  } catch (error) {
    console.log(`${p.id}: FEL ${error.message}`);
  }
}
