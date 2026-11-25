// Allt som är fakta om ReBoard samlas här, så att det är lätt att fylla i när svaren kommer.
// null = vi vet inte än. Sidan visar då en gul todo-markering i stället för att gissa.

// Utkast: inget skickas och inget mejl öppnas. Sätts till false när ReBoard har godkänt sidan.
export const DRAFT = true;

// Dit beställningarna ska gå. Inte bekräftat av ReBoard än, och skrivs inte in förrän de har sagt vilken adress.
export const ORDER_EMAIL = null;
// Företagets Swish-nummer (Swish Företag, aldrig ett privat nummer).
export const SWISH_NUMBER = null;
export const INSTAGRAM = 'https://www.instagram.com/reboarduf/';

// Mått i cm från Max (25/11): längd (w) × bredd (h) × tjocklek (t). Bara två storlekar.
// priceConfirmed: false = priserna är Max tidigare svar och ska bekräftas.
// photo: ett foto ovanifrån av storleken (valfritt), visas inuti brädan i väljaren.
export const SIZES = [
  { id: 'liten', name: 'Liten', price: 500, w: 33, h: 22, t: 3, confirmed: true, priceConfirmed: false },
  { id: 'stor', name: 'Stor', price: 1000, w: 42, h: 28, t: 3, confirmed: true, priceConfirmed: false },
];

// Egna mått (Max önskemål): besökaren skriver längd och bredd och skickar en förfrågan. Pris efter förfrågan.
export const CUSTOM = { id: 'egna', name: 'Egna mått', t: 3 };
export const isCustom = (id) => id === CUSTOM.id;
export const findSize = (id) => (isCustom(id) ? CUSTOM : SIZES.find((s) => s.id === id));

// Rimlig kontroll av egna mått. De verkliga gränserna har ReBoard inte sagt än (todo på sidan).
export const DIM_MIN = 10;
export const DIM_MAX = 120;
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

// Foton. src: null = platshållare med texten i "wanted". Fyll i när ReBoard har skickat sina bilder
// (WebP i static/bilder/, högst 1600 px breda).
export const PHOTOS = {
  hero: { src: null, w: 1200, h: 1500, alt: 'En skärbräda av återvunnen ek', wanted: 'en av era brädor nära, i dagsljus, så att ådringen syns' },
  virket: { src: null, w: 900, h: 1125, alt: 'Återvunnet ekvirke innan arbetet börjar', wanted: 'virket som det ser ut när ni får det' },
  slipning: { src: null, w: 900, h: 1125, alt: 'En bräda slipas för hand', wanted: 'händer som slipar en bräda' },
  olja: { src: null, w: 900, h: 1125, alt: 'Olja stryks på brädan', wanted: 'oljan som stryks på' },
  klar: { src: null, w: 1600, h: 700, alt: 'En färdig bräda i ett kök', wanted: 'den färdiga brädan i ett kök, gärna med mat på' },
  team: { src: null, w: 1000, h: 1250, alt: 'Vi som driver ReBoard UF', wanted: 'ni som driver ReBoard, gärna i verkstaden' },
};

export const kr = (n) => `${n.toLocaleString('sv-SE').replace(/\s/g, ' ')} kr`;
