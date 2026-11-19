// Delad logik för självintervjun. Körs både i webbläsaren och i Workern.
// Inga beroenden och inget DOM här – bara rena funktioner som går att testa.
//
// Checklistan och reglerna kommer från dokumentet "Nordvy – intervjuchatten".
// Appen (inte AI:n) håller reda på vad som är ifyllt, räknar förloppet och
// avgör när intervjun får avslutas.

export const PACKAGES = {
  uf: { id: 'uf', name: 'UF-paket', oneTime: 499, monthly: 0 },
  bas: { id: 'bas', name: 'Bas', oneTime: 2999, ordinary: 3499, monthly: 149 },
  premium: { id: 'premium', name: 'Premium', oneTime: 5999, ordinary: 6999, monthly: 299 },
};

export const INDUSTRIES = {
  frisor: { label: 'Frisör & skönhet', short: 'Salong' },
  cafe: { label: 'Café & restaurang', short: 'Café' },
  hantverk: { label: 'Hantverk & bygg', short: 'Hantverkare' },
  butik: { label: 'Butik', short: 'Butik' },
  halsa: { label: 'Hälsa & träning', short: 'Hälsa' },
  tjanst: { label: 'Tjänsteföretag', short: 'Företag' },
};

// nivå 1 = obligatorisk, 2 = ska frågas (svar eller "saknas"), 0 = fylls i av appen.
// Ordningen är den vi frågar i. Vilka fält som frågas beror på typen av företag (se PLAN nedan).
// pick: svarsknapparna är själva valen, så frågan måste alltid vara checklistans (inte AI:ns ord).
export const FIELDS = [
  { key: 'foretagsnamn', label: 'Företagsnamn', level: 1, about: 'Företagets namn.', question: 'Vad heter ditt företag?' },
  { key: 'foretagstyp', label: 'Typ av företag', level: 1, about: 'Vilken sorts företag det är. Styr vilka frågor som ställs.', question: 'Vilket av de här passar bäst in på er?', chips: ['UF-företag', 'Butik, café eller salong', 'Hantverk eller tjänster hos kunden', 'Säljer på nätet', 'Säljer till andra företag', 'Annat'], pick: true },
  { key: 'bransch', label: 'Bransch', level: 1, about: 'Vad de gör, i en mening.', question: 'Vad gör ni? Beskriv det gärna i en mening.' },
  { key: 'ort_omrade', label: 'Ort / område', level: 1, about: 'Var de verkar och var de vill synas.', question: 'Var finns ni, och i vilket område vill ni synas?' },
  { key: 'tjanster_produkter', label: 'Tjänster / produkter', level: 1, about: 'Lista VARJE tjänst eller produkt separat: namn och kort beskrivning. Pris bara om kunden själv anger det.', question: 'Vilka tjänster eller produkter erbjuder ni? Skriv dem som en lista.' },
  { key: 'priser', label: 'Priser', level: 2, about: 'Priser som ska synas på sidan, exakt som kunden anger. Eller att de inte vill visa priser.', question: 'Vad kostar det? Skriv de priser som ska synas, eller säg att ni inte vill visa priser.', chips: ['Vi visar inga priser'] },
  { key: 'mal_med_sidan', label: 'Mål med sidan', level: 1, about: 'Boka tid, beställa, ringa, visa arbeten eller bara visa information.', question: 'Vad är det viktigaste en besökare ska kunna göra på sidan?', chips: ['Boka tid', 'Beställa eller köpa', 'Ringa eller mejla', 'Se våra arbeten', 'Hitta information'], multi: true, pick: true },
  { key: 'stil', label: 'Stil', level: 1, about: 'Känsla, färger och gärna sidor de gillar.', question: 'Vilken känsla ska sidan ha? Nämn gärna färger eller en sida du gillar.', chips: ['Varm och personlig', 'Ren och modern', 'Exklusiv', 'Lekfull', 'Naturnära'] },
  { key: 'varfor_valja_oss', label: 'Varför välja er', level: 2, about: 'Vad som gör dem bättre eller annorlunda, med kundens egna ord.', question: 'Varför väljer kunder just er?' },
  { key: 'erfarenhet', label: 'Erfarenhet', level: 2, about: 'Hur länge de funnits eller hållit på.', question: 'Hur länge har ni funnits eller hållit på?' },
  { key: 'malgrupp', label: 'Målgrupp', level: 2, about: 'Vilka kunderna är, t.ex. privatpersoner eller företag, ålder, närområde.', question: 'Vilka är era kunder? Till exempel privatpersoner eller företag.' },
  { key: 'befintlig_sida', label: 'Hemsida i dag', level: 2, about: 'Adressen till en hemsida de redan har, eller att de inte har någon.', question: 'Har ni en hemsida i dag? Skriv adressen i så fall.', chips: ['Nej, ingen hemsida'] },
  { key: 'sprak', label: 'Språk', level: 2, about: 'Svenska, engelska eller båda.', question: 'Ska sidan vara på svenska, engelska eller båda?', chips: ['Svenska', 'Engelska', 'Båda'], pick: true },
  { key: 'funktioner', label: 'Funktioner', level: 1, about: 'Bokning, kontaktformulär, karta, webshop.', question: 'Vad ska gå att göra på sidan? Välj det som passar.', chips: ['Bokning', 'Beställning', 'Webshop', 'Betalning med Swish', 'Kontaktformulär', 'Karta'], multi: true, pick: true },
  { key: 'bestallning', label: 'Beställning och betalning', level: 2, about: 'Hur kunderna beställer, betalar och får varan.', question: 'Hur vill ni att kunderna beställer och betalar?', chips: ['Swish', 'Kort', 'Faktura', 'Kontant', 'Vet inte än'], multi: true, pick: true },
  { key: 'kontakt', label: 'Kontakt', level: 1, about: 'Telefon, mejl och adress.', question: 'Vilka kontaktuppgifter ska stå på sidan? Telefon, mejl och adress.' },
  { key: 'oppettider', label: 'Öppettider', level: 2, about: 'Exakt som kunden anger. "saknas" om de inte har fasta tider.', question: 'Har ni öppettider? Säljer ni bara online räcker det att säga det.', chips: ['Vi har inga fasta tider', 'Vi säljer bara online'] },
  { key: 'sociala_lankar', label: 'Sociala länkar', level: 1, about: 'Instagram, Facebook, LinkedIn med mera.', question: 'Har ni Instagram, Facebook eller andra sociala medier? Skriv gärna namnen eller länkarna.', chips: ['Vi har inga'] },
  { key: 'logga', label: 'Logga', level: 2, about: 'Har de en logga? Den mejlas till Nordvy efter intervjun.', question: 'Har ni en logga?', chips: ['Ja, jag mejlar den', 'Nej, ingen logga'] },
  { key: 'logga_status', label: 'Logga: status', level: 0, about: 'ej verifierad eller saknas.' },
  { key: 'bilder', label: 'Bilder', level: 2, about: 'Bilder på lokal, produkter, personal eller arbeten. De mejlas till Nordvy efter intervjun.', question: 'Har ni bilder på lokalen, produkterna eller era arbeten?', chips: ['Ja, jag mejlar bilder', 'Inte än'] },
  { key: 'egna_texter', label: 'Egna texter', level: 2, about: 'Texter de redan har, t.ex. om oss eller tjänstebeskrivningar.', question: 'Har ni texter som redan är skrivna, till exempel en presentation av företaget?', chips: ['Ja, det har vi', 'Nej'] },
  { key: 'omdomen', label: 'Omdömen', level: 2, about: 'Bara riktiga omdömen som de har tillstånd att visa.', question: 'Har ni omdömen från riktiga kunder som ni får visa?', chips: ['Ja, det har vi', 'Nej, inga än'] },
  { key: 'doman_onskemal', label: 'Domän', level: 1, about: 'Önskat sidnamn eller webbadress.', question: 'Vilken webbadress skulle ni vilja ha? Till exempel dittforetag.se.', chips: ['Vet inte än'] },
  { key: 'undvik', label: 'Undvik', level: 2, about: 'Något de inte vill ha på sidan.', question: 'Finns det något ni inte vill ha på sidan?', chips: ['Nej, inget särskilt'] },
  { key: 'referens_ok', label: 'Referens', level: 1, about: 'Får Nordvy visa sidan som exempel? Ja eller nej.', question: 'Får Nordvy visa er färdiga sida som exempel för andra kunder?', chips: ['Ja', 'Nej'] },
];

export const FIELD = Object.fromEntries(FIELDS.map((f) => [f.key, f]));
export const KEYS = FIELDS.map((f) => f.key);
// Alla fält som någon typ av företag får frågor om. Vilka som frågas just nu ger plan(brief).
export const NEED = FIELDS.filter((f) => f.level > 0).map((f) => f.key);
// Räcker för ett första utkast av sidan.
export const CORE = ['foretagsnamn', 'bransch', 'ort_omrade', 'tjanster_produkter', 'mal_med_sidan', 'stil'];

/* -------------------------------------------------- typer av företag */

// Typen styr vilka frågor som ställs, hur de formuleras och vad som krävs innan intervjun är klar.
// "hint" går till AI:n, så att frågorna passar den som svarar.
export const PROFILES = {
  uf: {
    label: 'UF-företag',
    hint: 'Gymnasieelever som driver ett UF-företag under ett läsår. Ställ korta, enkla frågor och ge gärna ett exempel i frågan. Inga facktermer. Fråga inte om domäner, funktioner, öppettider eller hur länge de funnits.',
  },
  lokal: {
    label: 'Butik, café eller salong',
    hint: 'Har en lokal som kunderna besöker. Adress, öppettider, priser och hur man bokar eller beställer är det viktigaste på sidan.',
  },
  hantverk: {
    label: 'Hantverk eller tjänster hos kunden',
    hint: 'Jobbar hemma hos kunden eller på plats. Vilka orter de tar jobb i, vilka tjänster, offert och bilder på tidigare jobb är det viktigaste.',
  },
  webshop: {
    label: 'Säljer på nätet',
    hint: 'Säljer produkter online utan lokal. Produkter, priser, betalning och leverans är det viktigaste.',
  },
  b2b: {
    label: 'Säljer till andra företag',
    hint: 'Kunderna är företag eller organisationer. Vad besökaren ska göra (boka demo, begära offert), språk och en befintlig hemsida är det viktigaste.',
  },
  tjanst: { label: 'Annat', hint: '' },
};

// Fält som en typ av företag inte får frågor om.
const SKIP = {
  uf: ['erfarenhet', 'befintlig_sida', 'sprak', 'funktioner', 'oppettider', 'egna_texter', 'doman_onskemal'],
  lokal: ['sprak', 'bestallning', 'malgrupp'],
  hantverk: ['sprak', 'bestallning'],
  webshop: ['sprak', 'oppettider'],
  b2b: ['oppettider', 'bestallning', 'priser'],
  tjanst: ['sprak', 'bestallning'],
};

// Frågor och svarsknappar som skiljer sig per typ. Allt annat är checklistans.
const VIEW = {
  bransch: {
    uf: { question: 'Vad säljer eller gör ni? En mening räcker, till exempel "Vi gör doftljus av gamla glasburkar".' },
  },
  ort_omrade: {
    uf: { question: 'I vilken stad finns ni?' },
    hantverk: { question: 'I vilka orter eller områden tar ni jobb?' },
    webshop: { question: 'Var finns ni, och skickar ni till hela Sverige?' },
    b2b: { question: 'Var finns ni, och i vilka länder har ni kunder?' },
  },
  tjanster_produkter: {
    uf: { question: 'Vilka produkter säljer ni? Skriv dem som en lista.' },
    webshop: { question: 'Vilka produkter säljer ni? Skriv dem som en lista.' },
    lokal: { question: 'Vilka tjänster eller varor ska synas på sidan? Skriv dem som en lista.' },
  },
  priser: {
    uf: { question: 'Vad kostar produkterna? Till exempel "Doftljus 149 kr".' },
    webshop: { question: 'Vad kostar produkterna? Skriv priset efter varje produkt.' },
    hantverk: { question: 'Vill ni visa priser, till exempel timpris, eller ska kunderna begära offert?', chips: ['Kunderna begär offert'] },
  },
  mal_med_sidan: {
    uf: { question: 'Vad vill ni helst att folk gör när de kommer in på sidan?', chips: ['Beställa något', 'Hitta vår Instagram', 'Se vad vi gör', 'Kontakta oss'] },
    hantverk: { chips: ['Begära offert', 'Ringa eller mejla', 'Se våra arbeten', 'Boka tid'] },
    webshop: { chips: ['Köpa direkt på sidan', 'Se sortimentet', 'Kontakta oss'] },
    b2b: { chips: ['Boka en demo', 'Begära offert', 'Kontakta oss', 'Läsa om produkterna'] },
  },
  varfor_valja_oss: {
    uf: { question: 'Vad är det bästa med er produkt?' },
  },
  malgrupp: {
    uf: { question: 'Vilka tror ni köper mest av er?', chips: ['Elever och lärare', 'Familj och vänner', 'Alla i stan'], multi: true },
  },
  funktioner: {
    lokal: { chips: ['Bokning', 'Meny eller prislista', 'Karta', 'Kontaktformulär', 'Betalning med Swish'] },
    hantverk: { chips: ['Offertformulär', 'Bilder på jobb', 'Kontaktformulär', 'Bokning'] },
    webshop: { chips: ['Webshop', 'Betalning med Swish', 'Kontaktformulär'] },
    b2b: { chips: ['Boka demo', 'Offertformulär', 'Kontaktformulär', 'Nyhetsbrev'] },
  },
  bestallning: {
    uf: { chips: ['Swish', 'Kontant', 'Via Instagram', 'Vet inte än'] },
    webshop: { question: 'Hur ska kunderna betala, och hur får de varorna?', chips: ['Kort', 'Swish', 'Faktura', 'Hemleverans', 'Hämta själv'] },
  },
  kontakt: {
    uf: { question: 'Vilken mejl eller vilket nummer ska kunderna kontakta er på?' },
    lokal: { question: 'Vilken adress, telefon och mejl ska stå på sidan?' },
  },
  sociala_lankar: {
    uf: { question: 'Vad heter ert konto på Instagram? Har ni TikTok också?' },
  },
  bilder: {
    uf: { question: 'Har ni bilder på produkterna? Bra mobilbilder räcker.' },
    hantverk: { question: 'Har ni bilder på jobb ni har gjort?' },
    b2b: { question: 'Har ni bilder, skärmbilder eller filmer som visar produkterna?' },
  },
  oppettider: {
    lokal: { question: 'Vilka öppettider har ni? Till exempel "tis–fre 10–18, lör 10–14".', chips: ['Bara tidsbokning'] },
  },
};

// Företaget verkar utanför Sverige. Då frågas det om språk även om typen annars inte gör det.
export const INTERNATIONAL = /(hela världen|världen över|internationell|globalt|global\b|europa|norden|utomlands|worldwide|international)/i;

// Vilken typ av företag det är: först kundens eget val, sedan det de berättat.
export function profileOf(brief) {
  const b = brief || {};
  const t = lower(b.foretagstyp);
  if (t && !isSaknas(t)) {
    if (/(^|[^a-zåäö])uf([^a-zåäö]|$)|ung företagsamhet/.test(t)) return 'uf';
    if (/andra företag|b2b|organisation|förening|klubb/.test(t)) return 'b2b';
    if (/nätet|online|webshop|webbshop|e-handel/.test(t)) return 'webshop';
    if (/hantverk|hos kunden|bygg|städ|flytt/.test(t)) return 'hantverk';
    if (/butik|café|kafé|cafe|salong|restaurang|lokal|klinik|gym/.test(t)) return 'lokal';
  }
  if (isUF(b)) return 'uf';
  if (!hasAnswer(b, 'bransch')) return 'tjanst';
  if (isB2B(b)) return 'b2b';
  const industry = detectIndustry(`${b.bransch} ${hasAnswer(b, 'tjanster_produkter') ? b.tjanster_produkter : ''}`);
  if (industry === 'hantverk') return 'hantverk';
  if (industry === 'butik' && sellsOnlineOnly(b)) return 'webshop';
  if (['frisor', 'cafe', 'halsa', 'butik'].includes(industry)) return 'lokal';
  return 'tjanst';
}

// Fälten som ska frågas för just det här företaget, i ordning.
export function plan(brief) {
  const b = brief || {};
  const profile = profileOf(b);
  const skip = new Set(SKIP[profile] || []);
  if (INTERNATIONAL.test(String(b.ort_omrade || ''))) skip.delete('sprak');
  // Står "UF" redan i namnet behövs ingen fråga om typen.
  if (!hasValue(b, 'foretagstyp') && isUF(b)) skip.add('foretagstyp');
  return NEED.filter((k) => !skip.has(k) || hasValue(b, k));
}

// Frågan och svarsknapparna för ett fält, anpassade efter typen av företag.
export function questionFor(key, brief) {
  const f = FIELD[key];
  if (!f) return null;
  const own = VIEW[key]?.[profileOf(brief)] || {};
  return {
    key,
    question: own.question || f.question,
    chips: own.chips || f.chips || null,
    multi: own.multi ?? f.multi ?? false,
    pick: f.pick || false,
  };
}
export const TOPICS = ['bilder', 'logga', 'kontakt', 'innehall', 'funktioner', 'annat'];
export const LIMITS = { value: 600, message: 800, log: 60 };
export const MAIL_TO = 'Nordvyuf@gmail.com';

/* ---------------------------------------------------------------- text */

export function cleanText(value, max = LIMITS.value) {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
}

const oneLine = (s, max) => cleanText(s, max).replace(/\s+/g, ' ');
const lower = (s) => String(s || '').toLocaleLowerCase('sv-SE');

export function capitalize(s) {
  const t = String(s || '').trim();
  return t ? t.charAt(0).toLocaleUpperCase('sv-SE') + t.slice(1) : '';
}

export function slugify(name) {
  const s = lower(name)
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[éè]/g, 'e')
    .replace(/&/g, 'och')
    .replace(/[^a-z0-9]+/g, '');
  return s.slice(0, 28) || 'dittforetag';
}

// Helt ord, även med å/ä/ö (\b fungerar inte för dem i JavaScript).
function hasWord(text, word) {
  return new RegExp(`(?<![a-zåäöé])${word}(?![a-zåäöé])`, 'i').test(text);
}
const hasStem = (text, stems) => stems.some((s) => text.includes(s));

/* ------------------------------------------------------------ briefen */

export const isSaknas = (v) => /^saknas\b/i.test(String(v || '').trim());
export const hasValue = (brief, key) => Boolean(String(brief?.[key] || '').trim());
export const hasAnswer = (brief, key) => hasValue(brief, key) && !isSaknas(brief[key]);
export const missing = (brief) => plan(brief).filter((k) => !hasValue(brief, k));
export const coreDone = (brief) => CORE.every((k) => hasValue(brief, k));

// Svar som betyder "nej / har inget / vet inte".
const NEGATIVE = /^(nej|nä|nix|nope|inga|inget|ingen|ingenting|inte än|vi har inga|vi har inget|har inga|har inget|har ingen|vet inte|vet ej|det vet jag inte|ingen aning|ingen koll|hellre inte|helst inte|inte direkt|saknas|finns inte|finns inga|-+)(?![a-zåäö])/i;
export const isNegative = (text) => NEGATIVE.test(String(text || '').trim());

// Tar emot vad som helst från webbläsaren och ger tillbaka en säker, begränsad brief.
export function cleanBrief(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const key of KEYS) {
    const v = cleanText(raw[key]);
    if (v) out[key] = v;
  }
  return out;
}

export function cleanIssues(raw) {
  const out = [];
  if (!Array.isArray(raw)) return out;
  for (const item of raw.slice(0, 12)) {
    const topic = TOPICS.includes(item?.topic) ? item.topic : 'annat';
    const text = oneLine(item?.text, 240);
    if (!text) continue;
    const at = out.findIndex((x) => x.topic === topic && topic !== 'annat');
    if (at >= 0) out[at] = { topic, text };
    else if (!out.some((x) => x.text === text)) out.push({ topic, text });
  }
  return out;
}

export function cleanLog(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m) => m && typeof m.text === 'string' && m.text.trim())
    .slice(-LIMITS.log)
    .map((m) => ({ who: m.who === 'me' ? 'me' : 'guide', text: cleanText(m.text, LIMITS.message) }));
}

/* ----------------------------------------------------------- tolkning */

const INDUSTRY_STEMS = {
  frisor: ['fris', 'salong', 'barber', 'skönhet', 'nagel', 'naglar', 'fransar', 'hudvård', 'massage', 'makeup', 'smink', 'bryn', 'hårvård', 'klippning'],
  cafe: ['café', 'cafe', 'kafé', 'kafe', 'restaurang', 'bageri', 'kondit', 'pizz', 'bistro', 'lunch', 'sushi', 'krog', 'catering', 'foodtruck', 'glass', 'fika'],
  hantverk: ['snick', 'bygg', 'målar', 'måleri', 'elektr', 'elinstall', 'rörmok', 'vvs', 'städ', 'flytt', 'trädgård', 'takläg', 'golv', 'murar', 'plåt', 'hantverk', 'renover', 'bilverk', 'verkstad', 'däck', 'låssm', 'kakel', 'fönsterputs'],
  butik: ['butik', 'affär', 'kläd', 'blomster', 'blommor', 'second hand', 'inredning', 'smycken', 'present', 'leksak', 'cykel', 'webshop', 'keramik', 'bokhandel', 'säljer'],
  halsa: ['gym', 'träning', 'tränare', 'yoga', 'fysio', 'naprapat', 'kiroprakt', 'tandläk', 'tandvård', 'klinik', 'terapi', 'terapeut', 'hälsa', 'pilates', 'kostråd', 'psykolog', 'friskvård'],
};

export function detectIndustry(text) {
  const t = lower(text);
  if (!t) return 'tjanst';
  let best = 'tjanst';
  let bestScore = 0;
  for (const [id, stems] of Object.entries(INDUSTRY_STEMS)) {
    let score = stems.filter((s) => t.includes(s)).length;
    if (id === 'frisor' && (hasWord(t, 'hår') || hasWord(t, 'spa'))) score += 1;
    if (id === 'cafe' && (hasWord(t, 'mat') || hasWord(t, 'bar') || hasWord(t, 'kaffe'))) score += 1;
    if (id === 'hantverk' && (hasWord(t, 'el') || hasWord(t, 'tak') || hasWord(t, 'bil'))) score += 1;
    if (id === 'halsa' && hasWord(t, 'pt')) score += 1;
    if (score > bestScore) {
      best = id;
      bestScore = score;
    }
  }
  return best;
}

const NOT_A_CITY = new Set(['Sverige', 'Hela', 'Vi', 'Vår', 'Vårt', 'Våra', 'Här', 'Runt', 'Online', 'Centrum', 'Stan', 'Staden', 'Främst', 'Mest', 'Ingen', 'Inget', 'Saknas', 'Både', 'Och', 'Samt', 'Nära', 'Utanför', 'Hemma', 'Alla', 'Över']);

// Plockar ut orten ur svaret om var företaget finns, t.ex. "Vi finns i Malmö" -> "Malmö".
export function detectCity(text) {
  const t = String(text || '').replace(/\b(sverige|sweden)\b/gi, ' ').replace(/\s+/g, ' ').trim();
  if (!t || isSaknas(t)) return '';
  const words = t.split(/[\s,.;:/()]+/).filter(Boolean);
  if (words.length <= 2 && t.length <= 26 && /^[A-Za-zÅÄÖåäöé -]+$/.test(t)) {
    return words.map((w) => capitalize(lower(w))).join(' ');
  }
  // "Lund, på Bangatan nära stationen": orten står först, gatan efter.
  const lead = t.match(/^([A-ZÅÄÖ][a-zåäöé]{2,})\s*,/);
  if (lead && !NOT_A_CITY.has(lead[1])) return lead[1];
  const after = t.match(/(?:^|[\s,(])(?:i|på|utanför|nära|runt|från)\s+([A-ZÅÄÖ][a-zåäöé]+(?:[ -][A-ZÅÄÖ][a-zåäöé]+)?)/);
  if (after && !NOT_A_CITY.has(after[1].split(/[ -]/)[0])) return after[1];
  const cap = words.find((w, i) => /^[A-ZÅÄÖ][a-zåäöé]{2,}$/.test(w) && !NOT_A_CITY.has(w));
  return cap || '';
}

export function detectVibe(text) {
  const t = lower(text);
  if (hasStem(t, ['energi', 'sportig', 'kraftfull', 'peppig'])) return 'modern';
  if (hasStem(t, ['exklusiv', 'lyx', 'premium', 'elegant', 'mörk', 'svart', 'guld'])) return 'exklusiv';
  if (hasStem(t, ['lekfull', 'färgglad', 'rolig', 'glad', 'busig', 'rosa', 'gul'])) return 'lekfull';
  if (hasStem(t, ['natur', 'grön', 'ekolog', 'jordnära', 'lugn', 'hållbar'])) return 'natur';
  if (hasStem(t, ['modern', 'stilren', 'minimal', 'enkel', 'proffsig', 'professionell', 'tydlig', 'ren och', 'blå', 'vit'])) return 'modern';
  if (hasStem(t, ['varm', 'personlig', 'hemtrev', 'mysig', 'familj', 'välkomn', 'beige', 'brun'])) return 'varm';
  return '';
}

// Färger som kunden själv nämner i svaret om stil. Den första färgen som inte är neutral blir accent.
const COLORS = [
  { stems: ['neongrön', 'neon'], acc: '#1fbf6b', ink: '#0d1f14' },
  { stems: ['mörkblå', 'marinblå', 'navy'], acc: '#1f3a68' },
  { stems: ['ljusblå'], acc: '#2f6fb3' },
  { stems: ['blå'], acc: '#2346c9' },
  { stems: ['mörkgrön', 'skogsgrön'], acc: '#2f5a3c' },
  { stems: ['grön'], acc: '#3f6e4a' },
  { stems: ['turkos', 'petrol'], acc: '#126b6b' },
  { stems: ['vinröd', 'röd'], acc: '#a8322a' },
  { stems: ['rosa'], acc: '#b0406a' },
  { stems: ['lila'], acc: '#6236c4' },
  { stems: ['orange'], acc: '#c2531a' },
  { stems: ['gul'], acc: '#e3b400', ink: '#1f1a05' },
  { stems: ['guld'], acc: '#9c7a2e' },
  { stems: ['brun', 'beige'], acc: '#7a5233', neutral: true },
  { stems: ['svart'], acc: '#151515', neutral: true },
];

export function detectAccent(text) {
  const t = lower(text);
  const found = [];
  for (const c of COLORS) {
    const at = Math.min(...c.stems.map((s) => (t.includes(s) ? t.indexOf(s) : Infinity)));
    if (at < Infinity) found.push({ ...c, at });
  }
  if (!found.length) return null;
  found.sort((a, b) => (a.neutral === b.neutral ? a.at - b.at : a.neutral ? 1 : -1));
  return { acc: found[0].acc, ink: found[0].ink || '#ffffff' };
}

const DEFAULT_VIBE = { frisor: 'varm', cafe: 'varm', hantverk: 'modern', butik: 'lekfull', halsa: 'natur', tjanst: 'modern' };

export function parseServices(text) {
  if (isSaknas(text)) return [];
  const listed = String(text || '').replace(/\b\d+[.)]\s*/g, '\n');
  // Finns det kommatecken eller radbrytningar är det de som skiljer tjänsterna åt.
  // Då får "färg och slingor" vara kvar som en tjänst.
  // " / " skiljer två svar på samma fråga ("Perform, Play / Media streaming").
  const strong = listed.split(/\n|,|;|•|·|\s\/\s/).filter((x) => x.trim());
  const raw = (strong.length >= 2 ? strong : listed.split(/\n|,|;|•|·|\/|\s+och\s+|\s+samt\s+|\s+&\s+/i))
    .map((s) => s.replace(/\s*[:(–—-]\s+.*$/, '').replace(/\(.*$/, ''))
    .map((s) => s.replace(/^[\s\-–—*]+|[\s.!]+$/g, ''))
    .map((s) => s.replace(/^(vi (erbjuder|gör|säljer|har|jobbar med)|bland annat|t\.?ex\.?|till exempel)\s+/i, ''))
    .filter((s) => s.length >= 2 && s.length <= 44);
  const seen = new Set();
  const out = [];
  for (const s of raw) {
    const key = lower(s);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(capitalize(s));
    if (out.length === 3) break;
  }
  return out;
}

const wishText = (b) => lower(`${b.mal_med_sidan || ''} ${b.funktioner || ''}`);
export const wantsBooking = (b) => hasStem(wishText(b), ['boka', 'bokning', 'tidsbok']);
export const wantsPayments = (b) => hasStem(wishText(b), ['betal', 'swish', 'webshop', 'webbshop', 'köpa', 'sälj', 'beställ', 'presentkort']);
// UF-företag syns ofta bara i mejladressen eller på Instagram ("njoy.uf@gmail.com", "@njoy.uf").
export const isUF = (b) =>
  hasWord(lower(`${b.foretagsnamn || ''} ${b.foretagstyp || ''} ${b.bransch || ''} ${b.kontakt || ''} ${b.sociala_lankar || ''} ${b.doman_onskemal || ''}`), 'uf') ||
  lower(b.bransch).includes('ung företagsamhet');

export function recommendPackage(brief) {
  const b = brief || {};
  if (isUF(b)) return { id: 'uf', reason: 'Ni är ett UF-företag. UF-paketet ger er en sida med produkter och beställningsförfrågan.' };
  const booking = wantsBooking(b);
  const pay = wantsPayments(b);
  if (booking && pay) return { id: 'premium', reason: 'Ni vill ta emot både bokningar och beställningar på sidan. Det ingår i Premium.' };
  if (booking) return { id: 'premium', reason: 'Ni vill att kunderna ska kunna boka direkt på sidan. Bokningssystem ingår i Premium.' };
  if (pay) return { id: 'premium', reason: 'Ni vill kunna ta emot beställningar eller betalning på sidan. Det ingår i Premium.' };
  return { id: 'bas', reason: 'Ni behöver synas, visa vad ni gör och bli kontaktade. Det klarar Bas, och ni kan uppgradera senare.' };
}

const kr = (n) => `${new Intl.NumberFormat('sv-SE').format(n).replace(/[  ]/g, ' ')} kr`;

export function packageLine(id) {
  const p = PACKAGES[id] || PACKAGES.bas;
  return p.monthly ? `${p.name}: ${kr(p.oneTime)} + ${kr(p.monthly)}/mån` : `${p.name}: ${kr(p.oneTime)}`;
}

/* ------------------------------------------------------------ utkastet */

const PRESET = {
  frisor: { headline: 'Hår du trivs i varje dag', sub: (n, c) => `Boka tid hos ${n}${c} när det passar dig. Enkelt och direkt i mobilen.`, cta: 'Boka tid', text: 'Boka en tid som passar dig.' },
  cafe: { headline: 'Nybakat, nära och gjort med omsorg', sub: (n, c) => `${n}${c}. Se menyn, öppettiderna och hitta hit på några sekunder.`, cta: 'Se menyn', text: 'Gjort på riktiga råvaror.' },
  hantverk: { headline: 'Rätt gjort från början', sub: (n, c) => `${n} hjälper dig${c}, från första samtal till färdigt resultat. Begär offert direkt på sidan.`, cta: 'Begär offert', text: 'Tydlig offert och tidsplan.' },
  butik: { headline: 'Det du letar efter, nära dig', sub: (n, c) => `Välkommen till ${n}${c}. Se sortimentet, öppettiderna och vägen hit.`, cta: 'Se sortimentet', text: 'Finns hos oss just nu.' },
  halsa: { headline: 'Må bättre, ett steg i taget', sub: (n, c) => `${n}${c} hjälper dig att komma igång. Boka första besöket direkt på sidan.`, cta: 'Boka besök', text: 'Anpassat efter dig.' },
  tjanst: { headline: 'Tydlig hjälp när du behöver den', sub: (n, c) => `${n}${c} gör det enkelt att komma igång. Hör av dig så berättar vi mer.`, cta: 'Kontakta oss', text: 'Vi hjälper dig hela vägen.' },
};

// Företag utan butik eller lokal: inga "hitta hit", "nära dig" eller öppettider i utkastet.
const ONLINE_PRESET = {
  headline: 'Utvalt och lätt att beställa',
  sub: (n, from) => `${n}${from} säljer online. Se sortimentet och beställ direkt på sidan.`,
};

// En tjänst eller produkt som duger i en rubrik: kort, ett namn och inte en hel mening eller vardagsprat.
function headlineItem(titles) {
  for (const t of (titles || []).slice(0, 3)) {
    const words = t.split(/\s+/);
    if (t.length > 26 || words.length > 4) continue;
    if (/^(den|det|vi|jag|man|fokus|att)\b/i.test(t)) continue;
    if (/\b(sånt|grejer|saker|osv|etc|m\.?m\.?)\b/i.test(t)) continue;
    return t;
  }
  return '';
}

// Rubriken när AI:n inte svarar. Byggs av kundens egna uppgifter (första tjänsten och orten),
// så att två kunder inte får samma rubrik. Finns inget att bygga av blir det branschens reservrubrik.
function fallbackHeadline({ industry, online, titles, city, audience }) {
  const item = headlineItem(titles);
  if (item && city) return online ? `${item} från ${city}` : `${item} i ${city}`;
  if (item && online) return `${item}, beställ direkt på sidan`;
  // Utan ort: säg vem det är till. "Perform när det passar dig" lät som en frisörs rubrik.
  if (item && audience) return `${item} för ${audience}`;
  if (item && industry !== 'tjanst') return `${item} när det passar dig`;
  return online ? ONLINE_PRESET.headline : PRESET[industry || 'tjanst'].headline;
}

// Målgruppen som den kan stå i en rubrik: kort och utan "vi riktar oss till".
function audienceOf(b) {
  if (!hasAnswer(b, 'malgrupp') || isNegative(b.malgrupp)) return '';
  const t = oneLine(b.malgrupp, 60)
    .replace(/^(vi riktar oss (till|mot)|våra kunder är|det är|främst|mest|till exempel)\s+/i, '')
    .replace(/[.!]+$/, '');
  return t.length >= 4 && t.length <= 40 ? lower(t) : '';
}

// Kunderna är organisationer, inte privatpersoner. Då bokar man ett möte, inte en tid.
const B2B = /(företag|klubb|förening|förbund|federation|liga|ligor|kommun|organisation|skolor|myndighet|b2b|bolag)/i;
const isB2B = (b) =>
  /andra företag|b2b/i.test(String(b.foretagstyp || '')) ||
  /(åt|för|till) (andra )?(företag|bolag|organisationer|klubbar|föreningar)|\bb2b\b/i.test(String(b.bransch || '')) ||
  (B2B.test(String(b.malgrupp || '')) && !/privat|familj|alla\b/i.test(String(b.malgrupp || '')));


// Pekar ut företagsnamnet och vanliga fyllnadsord så att en rubrik inte bara upprepar dem.
const BARE_HEADLINE = /^(välkommen( till)?|hem|startsida|hemsida|vår hemsida|om oss|hej)\b/i;

function ctaFor(b, industry) {
  const wish = wishText(b);
  if (wantsBooking(b)) return industry === 'cafe' ? 'Boka bord' : isB2B(b) ? 'Boka ett möte' : 'Boka tid';
  if (hasStem(wish, ['köpa', 'beställ', 'webshop', 'sälj'])) return 'Beställ nu';
  if (hasStem(wish, ['arbeten', 'portfolio', 'galleri'])) return 'Se våra arbeten';
  if (hasStem(wish, ['ring', 'mejl', 'kontakt', 'offert'])) return industry === 'hantverk' ? 'Begär offert' : 'Kontakta oss';
  return PRESET[industry].cta;
}

function aiString(v, max) {
  if (typeof v !== 'string') return '';
  const s = v
    .replace(/<[^>]*>/g, ' ')
    .replace(/[*_#`>|\[\]{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return s.length > max ? '' : s;
}

// Rensar AI:ns textförslag. Bara fält som klarar kontrollen släpps igenom.
export function cleanCopy(ai, company = '') {
  if (!ai || typeof ai !== 'object') return null;
  const out = {};
  const name = lower(company).trim();
  const echoes = (t) => {
    const x = lower(t).replace(/[^a-zåäö0-9 ]/g, '').trim();
    return !x || (name && (x === name || (x.includes(name) && x.length < name.length + 14)));
  };
  let headline = aiString(ai.headline, 70).replace(/[.!]+$/, '');
  // En rubrik som bara är företagsnamnet eller ett fyllnadsord säger ingenting. Då behålls färdig rubrik.
  if (headline.split(' ').length < 3 || BARE_HEADLINE.test(headline) || echoes(headline)) headline = '';
  let sub = aiString(ai.sub ?? ai.subheadline, 190);
  if (sub.length < 40 || echoes(sub)) sub = '';
  const tagline = aiString(ai.tagline, 48).replace(/[.!]+$/, '');
  const cta = aiString(ai.cta, 22).replace(/[.!]+$/, '');
  const about = aiString(ai.about, 260);
  if (headline) out.headline = headline;
  if (sub) out.sub = sub;
  if (tagline.length >= 3) out.tagline = tagline;
  if (cta.length >= 3) out.cta = cta;
  if (about.length >= 20) out.about = about;
  if (Array.isArray(ai.services)) {
    const services = ai.services
      .map((s) => ({ title: capitalize(aiString(s?.title, 34)), text: ((t) => (t.length >= 16 && !echoes(t) ? t : ''))(aiString(s?.text, 110)) }))
      .filter((s) => s.title.length >= 2)
      .slice(0, 3);
    if (services.length >= 2) out.services = services;
  }
  return Object.keys(out).length ? out : null;
}

// Plockar telefon, e-post och adress ur kundens fria svar om kontaktuppgifter.
export function parseContact(text) {
  const t = String(text || '');
  if (!t.trim() || isSaknas(t)) return {};
  const email = (t.match(/[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+/) || [''])[0];
  const phone = (t.match(/(?:\+46|0)[\d\s-]{6,14}\d/) || [''])[0].replace(/\s+/g, ' ').trim();
  const rest = t
    .replace(email, ' ')
    .replace(phone, ' ')
    .replace(/\b(tel(?:efon)?|mobil|mejl|mail|e-?post|adress|besöksadress)\b\s*:?/gi, ' ')
    .split(/[,;\n]/)
    .map((x) => x.replace(/^[\s\-–:]+|[\s\-–:]+$/g, ''))
    // "Ring … eller mejla …" lämnar bara instruktionsord kvar. De är ingen adress.
    .filter((x) => x.length > 2 && !(!/\d/.test(x) && /^(ring|ringa|mejla|maila|skriv|kontakta|nummer|numret|eller|och|oss|till|på|via)\b/i.test(x)));
  return { email: email.slice(0, 60), phone: phone.slice(0, 20), address: rest.join(', ').slice(0, 80) };
}

// "Tis-fre 10-18, lör 10-15" blir två rader. Bara det kunden skrev, aldrig påhittat.
export function parseHours(text) {
  const t = String(text || '').trim();
  if (!t || isSaknas(t)) return [];
  // "Vi säljer bara online" är ett svar, men inga öppettider att visa.
  if (!/\d/.test(t) || /online|ingen (fysisk|butik|lokal)|inga fasta/i.test(t)) return [];
  return t
    .split(/[,;\n]|\s+och\s+(?=[a-zåäö]{3,}\b.*\d)/i)
    .map((x) => x.replace(/\s+/g, ' ').trim())
    .filter((x) => x.length > 2)
    .slice(0, 6)
    .map((x) => x.slice(0, 40));
}

export function parseInstagram(text) {
  const t = String(text || '');
  if (!t || isSaknas(t)) return '';
  const m = t.match(/instagram\.com\/([\w.]{2,30})/i) || t.match(/@([\w.]{2,30})/);
  return m ? `@${m[1]}` : '';
}

/**
 * Bygger utkastet (den lilla hemsidan) av det som hittills finns i briefen.
 * Fält som inte är besvarade lämnas tomma och ritas som grå väntrader.
 * `copy` är AI:ns textförslag och läggs ovanpå när det finns.
 */
// Kundens svar som en mening: stor bokstav först och punkt sist.
const asSentence = (text) => {
  const t = String(text || '').trim();
  if (!t) return '';
  const c = t.charAt(0).toUpperCase() + t.slice(1);
  return /[.!?…]$/.test(c) ? c : `${c}.`;
};

// "5 years" blir "5 år" och "vi startade i september" blir "Startade i september".
function tidySince(text) {
  const t = String(text || '')
    .trim()
    .replace(/^(\d+)\s*years?\b/i, '$1 år')
    .replace(/^vi\s+(startade|började)\b/i, (_, v) => v);
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function draftModel(brief, copy) {
  const b = brief || {};
  const m = {};
  const hasBusiness = hasAnswer(b, 'bransch');
  const industry = hasBusiness ? detectIndustry(`${b.bransch} ${hasAnswer(b, 'tjanster_produkter') ? b.tjanster_produkter : ''}`) : null;
  const preset = PRESET[industry || 'tjanst'];
  const company = hasAnswer(b, 'foretagsnamn') ? oneLine(b.foretagsnamn, 60) : '';
  const city = hasAnswer(b, 'ort_omrade') ? detectCity(b.ort_omrade) : '';
  const inCity = city ? ` i ${city}` : '';

  // Säljer bara online, utan lokal att besöka.
  const online = sellsOnlineOnly(b) && (industry === 'butik' || SELLS.test(`${b.bransch || ''} ${b.tjanster_produkter || ''}`));

  m.vibe = (hasAnswer(b, 'stil') && detectVibe(b.stil)) || (industry ? DEFAULT_VIBE[industry] : 'modern');
  if (company) m.company = company;
  if (online) m.online = true;
  const titles = hasAnswer(b, 'tjanster_produkter') ? parseServices(b.tjanster_produkter) : [];
  if (industry) {
    m.industry = industry;
    m.headline = fallbackHeadline({ industry, online, titles, city, audience: audienceOf(b) });
    m.sub = online ? ONLINE_PRESET.sub(company || 'Vi', city ? ` från ${city}` : '') : preset.sub(company || 'Vi', inCity);
    m.tagline = online ? `${INDUSTRIES[industry].short}${city ? ` från ${city}` : ''} · online` : `${INDUSTRIES[industry].short}${inCity}`;
    // Ett UF-företag har ingen butik med öppettider att hitta till.
    if (profileOf(b) === 'uf') {
      m.sub = `${company || 'Vi'} är ett UF-företag${inCity}. Se vad vi gör och beställ direkt på sidan.`;
      m.tagline = `UF-företag${inCity}`;
    }
  }
  if (city) m.city = city;
  // Inga påhittade beskrivningar i utkastet. AI:ns text läggs på nedan när den finns.
  if (titles.length) m.services = titles.map((title) => ({ title, text: '' }));
  if (hasValue(b, 'mal_med_sidan')) {
    const wish = wishText(b);
    const booking = wantsBooking(b);
    // I utkastet visas betalning bara om kunden faktiskt nämnt det. "Beställa" räcker inte.
    const payments = hasStem(wish, ['betal', 'swish', 'webshop', 'webbshop', 'kort']);
    m.cta = ctaFor(b, industry || 'tjanst');
    m.features = {
      booking,
      payments,
      shop: hasStem(wish, ['köpa', 'beställ', 'webshop', 'sälj']),
      menu: industry === 'cafe' || hasStem(wish, ['meny', 'pris']),
      // "Hitta information" är ingen vägbeskrivning. Och den som bara finns online har ingen adress att visa.
      map: (hasStem(wish, ['karta']) || /hitta (hit|till oss|vägen)/.test(wish)) && !sellsOnlineOnly(b),
      contact: !booking && !payments,
    };
  }
  if (hasAnswer(b, 'varfor_valja_oss') && !isNegative(b.varfor_valja_oss)) m.about = asSentence(oneLine(b.varfor_valja_oss, 220));
  if (hasAnswer(b, 'erfarenhet') && !isNegative(b.erfarenhet)) m.since = tidySince(oneLine(b.erfarenhet, 32));
  if (hasAnswer(b, 'stil')) {
    const accent = detectAccent(b.stil);
    if (accent) m.accent = accent;
  }
  if (hasAnswer(b, 'kontakt')) {
    const c = parseContact(b.kontakt);
    if (c.email || c.phone || c.address) m.contact = c;
  }
  if (hasAnswer(b, 'oppettider')) {
    const hours = parseHours(b.oppettider);
    if (hours.length) m.hours = hours;
  }
  if (hasAnswer(b, 'sociala_lankar')) {
    const insta = parseInstagram(b.sociala_lankar);
    if (insta) m.instagram = insta;
  }

  if (copy) {
    for (const key of ['headline', 'sub', 'tagline', 'cta', 'about']) if (copy[key] && (key !== 'about' || m.about)) m[key] = copy[key];
    if (copy.services && m.services) m.services = m.services.map((s, i) => ({ title: s.title, text: copy.services[i]?.text || s.text }));
  }
  return m;
}

/* ----------------------------------------------------- reservläge (utan AI) */

// Ingen kvittens före frågan: fyllnad som "Toppen." gör intervjun stel.

// Nästa fråga när AI:n inte svarar: checklistans fråga för första fältet som saknas.
// Säljer företaget saker (snarare än tjänster eller tider)? Då passar frågorna om produkter bättre.
const SELLS = /(säljer|sälja|produkt|webshop|bok\b|böcker|kokbok|kockbok|ljus|smycke|kläder|tröj|väsk|tavl|kort\b|uf\b)/i;
const ONLINE = /(online|på nätet|internet|webshop|bara digitalt)/i;

// Kunden har sagt att de bara säljer online och inte har några tider då man kan komma förbi.
export function sellsOnlineOnly(b = {}) {
  const hours = String(b.oppettider || '');
  if (hours && !isSaknas(hours) && /\d/.test(hours)) return false;
  return /bara online|endast online|bara på nätet|ingen (butik|lokal|fysisk)/i.test(hours) || (ONLINE.test(`${b.ort_omrade || ''} ${b.bransch || ''}`) && !/\d/.test(hours));
}

// Checklistans fråga, anpassad lite efter det kunden redan sagt. Används när AI:n inte svarar.
export function fallbackQuestion(key, seed = 0, brief = {}) {
  // Har kunden redan en hemsida frågar vi om den ska ligga kvar på samma adress.
  const site = key === 'doman_onskemal' && String(brief?.befintlig_sida || '').match(/\b(?:www\.)?[a-z0-9-]{2,}\.(?:se|com|nu|net|org|io|eu)\b/i);
  if (site) return `Ska den nya sidan ligga på ${site[0]}, eller vill ni ha en ny adress?`;
  // Har typen av företag en egen fråga för fältet används den.
  const own = VIEW[key]?.[profileOf(brief)]?.question;
  if (own) return own;
  const said = ['foretagsnamn', 'bransch', 'ort_omrade', 'tjanster_produkter', 'mal_med_sidan'].map((k) => brief?.[k] || '').join(' ');
  if (key === 'tjanster_produkter' && SELLS.test(said)) return 'Vilka produkter säljer ni? Skriv dem som en lista, gärna med pris om ni vill att det syns.';
  if (key === 'oppettider' && ONLINE.test(said)) return 'Säljer ni bara online, eller finns det också tider då man kan komma förbi?';
  if (key === 'bilder' && SELLS.test(said)) return 'Har ni bilder på produkterna?';
  return FIELD[key]?.question || FIELDS[0].question;
}

/* ------------------------------------------------------------ underlag */

// Texten som mejlas till Nordvy och följer med i bokningen.
export function briefToText(brief, issues = [], contact = null) {
  const b = brief || {};
  const pkg = recommendPackage(b);
  const lines = ['SJÄLVINTERVJU – UNDERLAG', ''];
  if (contact?.name) lines.push(`Kontaktperson: ${contact.name}, ${contact.email}${contact.phone ? `, ${contact.phone}` : ''}`, '');
  for (const f of FIELDS) {
    if (!hasValue(b, f.key)) continue;
    // "Logga: saknas" räcker. Statusraden behövs bara när kunden har en logga.
    if (f.key === 'logga_status' && isSaknas(b.logga)) continue;
    lines.push(`${f.label}: ${b[f.key]}`);
  }
  const left = missing(b);
  lines.push('', `Saknar svar: ${left.length ? left.map((k) => FIELD[k].label).join(', ') : 'inget'}`);
  lines.push(`Att följa upp: ${issues.length ? issues.map((i) => `[${i.topic}] ${i.text}`).join(' | ') : 'inget'}`);
  lines.push(`Rekommenderat paket: ${packageLine(pkg.id)}`);
  return lines.join('\n');
}

export function logToText(log = []) {
  return log.map((m) => `[${m.who === 'me' ? 'KUND' : 'BOT'}] ${m.text}`).join('\n');
}

// Delar upp en lång text i mejl som ryms i formulärets gräns.
export function mailParts(text, size = 1850, max = 4) {
  const parts = [];
  let rest = String(text || '');
  while (rest && parts.length < max) {
    if (rest.length <= size) {
      parts.push(rest);
      rest = '';
      break;
    }
    let cut = rest.lastIndexOf('\n', size);
    if (cut < size * 0.5) cut = size;
    parts.push(rest.slice(0, cut));
    rest = rest.slice(cut).replace(/^\n+/, '');
  }
  if (rest && parts.length) parts[parts.length - 1] += '\n[…avkortat]';
  return parts.map((p, i) => (parts.length > 1 ? `(${i + 1}/${parts.length})\n${p}` : p));
}
