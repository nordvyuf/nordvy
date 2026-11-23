// Projektbladet bredvid chatten, och kundens eget paketval i underlaget.
import test from 'node:test';
import assert from 'node:assert/strict';
import { sheetModel } from '../public/assets/projektblad.js';
import { briefToText } from '../public/assets/shared/brief.js';

const vera = { foretagsnamn: 'Salong Vera', foretagstyp: 'Butik, café eller salong', bransch: 'Frisörsalong', ort_omrade: 'Lund', tjanster_produkter: 'Damklippning, herrklippning, färg och slingor', priser: 'Damklippning 450 kr, herrklippning 350 kr, färg från 900 kr', mal_med_sidan: 'Boka tid' };

test('färger och typsnitt visas först när kunden har sagt något om känslan', () => {
  const before = sheetModel(vera);
  assert.equal(before.chosen, false);
  assert.ok(before.swatches.every((c) => c.hex === ''));
  const after = sheetModel({ ...vera, stil: 'Ljust och lugnt, gärna beige och grönt' });
  assert.equal(after.chosen, true);
  assert.equal(after.swatches[0].hex, '#3f6e4a');
  assert.equal(after.font, 'Newsreader');
});

test('sidans delar byggs av kundens svar, och priserna blir en prislista', () => {
  const s = sheetModel(vera);
  assert.deepEqual(s.parts.map((p) => p.key), ['topp', 'utbud', 'boka', 'hitta']);
  assert.deepEqual(s.parts[1].items, ['Damklippning 450 kr', 'Herrklippning 350 kr', 'Färg från 900 kr']);
  assert.equal(s.parts[1].name, 'Behandlingar och priser');
});

test('ett företag som bara säljer online får ingen "Hitta hit"', () => {
  const s = sheetModel({ foretagsnamn: 'mätochmätt', bransch: 'Kokbok', ort_omrade: 'Malmö', tjanster_produkter: 'Kokboken', oppettider: 'vi säljer bara online' });
  assert.ok(!s.parts.some((p) => p.key === 'hitta'));
});

test('det vi behöver: logga och bilder får rätt läge', () => {
  const s = sheetModel({ ...vera, logga: 'Ja, jag mejlar den', bilder: 'saknas' });
  assert.deepEqual(s.need.map((n) => n.state), ['ok', 'gap']);
});

test('kundens eget paketval står i underlaget bredvid rekommendationen', () => {
  const text = briefToText(vera, [], null, 'bas');
  assert.match(text, /Rekommenderat paket: Premium/);
  assert.match(text, /Kundens val: Bas: 2 999 kr \+ 149 kr\/mån/);
  assert.match(briefToText(vera, [], null, 'osaker'), /Kundens val: vet inte än/);
  assert.doesNotMatch(briefToText(vera, [], null, ''), /Kundens val/);
});

test('"terrakotta och mörkgrönt" är färger, inte en mörk exklusiv stil (Kaffebaren Flora, 24 november)', async () => {
  const { detectVibe, detectAccent } = await import('../public/assets/shared/brief.js');
  assert.notEqual(detectVibe('Gärna terrakotta och mörkgrönt'), 'exklusiv');
  assert.equal(detectVibe('Mörk och elegant'), 'exklusiv');
  assert.equal(detectAccent('Gärna terrakotta och mörkgrönt').acc, '#b4532f');
  const s = sheetModel({ foretagsnamn: 'Kaffebaren Flora', foretagstyp: 'Butik, café eller salong', bransch: 'Café med eget bageri', stil: 'Gärna terrakotta och mörkgrönt' });
  assert.notEqual(s.font, 'Instrument Serif');
  assert.equal(s.swatches[0].hex, '#b4532f');
});
