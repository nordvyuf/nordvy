// Allt som är fakta om ReBoard samlas här. Källa: intervjun 23/11 och Max svar 25/11.

// Utkast. Det här är det enda stället som ändras när sidan blir skarp:
// DRAFT = true ger utkastraden överst, noindex (förrenderingen tar bort den när DRAFT är false),
// och att inget mejl öppnas och ingen Swish-knapp visas.
export const DRAFT = false;

// Dit beställningarna går, och adressen som står på sidan (Max bekräftade den 25/11).
export const ORDER_EMAIL = 'mykluge08@gmail.com';
// ReBoards Swish-nummer (Swish Företag, från Max 25/11). SWISH_DISPLAY är samma nummer, uppdelat för att läsas.
export const SWISH_NUMBER = '1231074335';
export const SWISH_DISPLAY = '123 107 43 35';
export const INSTAGRAM = 'https://www.instagram.com/reboarduf/';

// Mått i cm från Max (25/11): längd (w) × bredd (h) × tjocklek (t). Bara två storlekar.
// Priserna bekräftade av Max 25/11.
// photo: ett foto ovanifrån av storleken (valfritt), visas inuti brädan i väljaren.
export const SIZES = [
  { id: 'liten', name: 'Liten', price: 500, w: 33, h: 22, t: 3 },
  { id: 'stor', name: 'Stor', price: 1000, w: 42, h: 28, t: 3 },
];

// Egna mått (Max önskemål): besökaren skriver längd och bredd och skickar en förfrågan.
// ReBoard granskar den och återkommer med en offert. Egna mått hinns inte före jul.
export const CUSTOM = { id: 'egna', name: 'Egna mått', t: 3 };
export const isCustom = (id) => id === CUSTOM.id;
export const findSize = (id) => (isCustom(id) ? CUSTOM : SIZES.find((s) => s.id === id));

// Bara en rimlighetskontroll av egna mått. ReBoard har inte satt några gränser: de granskar varje förfrågan.
export const DIM_MIN = 5;
export const DIM_MAX = 200;
export const parseDim = (v) => {
  const n = Number(String(v).trim().replace(',', '.'));
  return String(v).trim() && Number.isFinite(n) ? n : null;
};
export function checkDim(v, what) {
  if (!String(v).trim()) return `Skriv ${what} i centimeter.`;
  const n = parseDim(v);
  if (n === null) return `Skriv ${what} med siffror, till exempel 40.`;
  if (n < DIM_MIN || n > DIM_MAX) return `Skriv en ${what} mellan ${DIM_MIN} och ${DIM_MAX} cm.`;
  return '';
}
// Egna mått som text, eller null om något mått saknas eller är fel.
export function customDims(custom) {
  if (checkDim(custom.l, 'längd') || checkDim(custom.b, 'bredd')) return null;
  return { w: parseDim(custom.l), h: parseDim(custom.b), t: CUSTOM.t };
}

const cm = (n) => String(n).replace('.', ',');
// Alltid längd × bredd × tjocklek, på samma sätt överallt.
export const dimText = (d) => `${cm(d.w)} × ${cm(d.h)} × ${cm(d.t)} cm`;

// Rutnätet i väljaren: 60 × 35 cm, i rutor om 5 cm.
export const GRID = { w: 60, h: 35, step: 5 };

// Foton. src: null = inget foto än. Då visas ingen tom ruta, utan varje plats har en egen reserv
// (loggan på oliv i toppen, text i stegen). Lägg fotot som WebP i static/bilder/ (högst 1600 px brett)
// och skriv in src, till exempel '/kund/reboard/bilder/topp.webp', så hamnar det på rätt plats.
export const PHOTOS = {
  hero: { src: null, w: 1200, h: 1500, alt: 'En skärbräda från ReBoard UF' },
  virket: { src: null, w: 900, h: 1125, alt: 'Spillvirke från ett lokalt finsnickeri' },
  arbete: { src: null, w: 900, h: 1125, alt: 'En bräda bearbetas för hand' },
  klar: { src: null, w: 900, h: 1125, alt: 'En färdig skärbräda' },
  team: { src: null, w: 1600, h: 900, alt: 'Vi som driver ReBoard UF' },
};

// Vilka vi är, med Max ord (25/11). Ingen skola, eftersom den inte är nämnd.
export const TEAM = [
  { name: 'Isac Björkman Åkesson', role: 'Vd. Jobbar med det mesta i företaget och med produktionen.' },
  { name: 'Max Sörensen', role: 'Säljare och produktion.' },
  { name: 'My Kluge', role: 'Ekonomiansvarig. Sköter ekonomin och svarar på mejlen.' },
  { name: 'Ida Lindvall', role: 'Marknadsföring, reklam och sociala medier.' },
  { name: 'Philip Lauridsen', role: 'Säljare.' },
  { name: 'Brian Nederman', role: 'Ekonom. Hjälper till med siffrorna.' },
];

// Riktiga omdömen, när ReBoard har fått några och sagt att de får visas: { text, name }.
// Så länge listan är tom syns inget omdömesavsnitt. Hitta aldrig på omdömen.
export const REVIEWS = [];

export const kr = (n) => `${n.toLocaleString('sv-SE').replace(/\s/g, ' ')} kr`;
