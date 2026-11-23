// Allt som är fakta om ReBoard samlas här, så att det är lätt att fylla i när svaren kommer.
// null = vi vet inte än. Sidan visar då en gul todo-markering i stället för att gissa.

// Utkast: inget skickas och inget mejl öppnas. Sätts till false när ReBoard har godkänt sidan.
export const DRAFT = true;

// Dit beställningarna ska gå. Inte bekräftat av ReBoard än, och skrivs inte in förrän de har sagt vilken adress.
export const ORDER_EMAIL = null;
// Företagets Swish-nummer (Swish Företag, aldrig ett privat nummer).
export const SWISH_NUMBER = null;
export const INSTAGRAM = 'https://www.instagram.com/reboarduf/';

// Mått i cm. Proportionerna är preliminära tills ReBoard har gett oss sina riktiga mått (confirmed: false).
// photo: ett foto ovanifrån av storleken (valfritt), visas inuti brädan i väljaren.
export const SIZES = [
  { id: 'liten', name: 'Liten', price: 500, w: 30, h: 20, confirmed: false },
  { id: 'mellan', name: 'Mellan', price: 750, w: 40, h: 25, confirmed: false },
  { id: 'stor', name: 'Stor', price: 1000, w: 50, h: 30, confirmed: false },
];
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
