// Omdömen från besökare på kundsidor (Premium).
//
// Inget omdöme visas av sig självt. Ett inskickat omdöme mejlas till Nordvy, tillsammans med en färdig
// rad som läggs i kundens `omdomen.json` när kunden har godkänt det. Den som inte godkänns visas aldrig.
// Ingen databas behövs, och inget kan hamna på en sida utan att en människa har sagt ja.

import { cleanText } from '../public/assets/shared/brief.js';

// Kundens mappnamn under /kund/, till exempel "matochmatt".
export const SLUG = /^[a-z0-9][a-z0-9-]{1,38}$/;

const NAME = /^[\p{L}][\p{L} .'’-]{1,39}$/u;
// Länkar och mejladresser i ett omdöme är nästan alltid skräp.
const LINK = /(https?:\/\/|www\.|[^\s@]+@[^\s@]+\.[a-z]{2,}|\b[a-z0-9-]+\.(se|com|net|org|nu|io)\b)/i;

export const MIN_TEXT = 10;
export const MAX_TEXT = 600;
// En människa skriver inte ett omdöme på mindre än så här. Stoppar enkla robotar.
export const MIN_ELAPSED_MS = 3000;

/**
 * Läser och kontrollerar ett inskickat omdöme.
 * Ger { ok: true, review } eller { ok: false, error } där error är en kod som sidan översätter.
 */
export function readReview(input) {
  const site = cleanText(input?.site, 40).toLowerCase();
  if (!SLUG.test(site)) return { ok: false, error: 'invalid_site' };
  const name = cleanText(input?.name, 60).replace(/\s+/g, ' ');
  if (!NAME.test(name) || LINK.test(name)) return { ok: false, error: 'invalid_name' };
  const rating = Number(input?.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { ok: false, error: 'invalid_rating' };
  const text = cleanText(input?.text, 1000).replace(/\s+/g, ' ');
  if (text.length < MIN_TEXT || text.length > MAX_TEXT) return { ok: false, error: 'invalid_text' };
  if (LINK.test(text)) return { ok: false, error: 'no_links' };
  if (input?.consent !== true) return { ok: false, error: 'consent_required' };
  if (!(Number(input?.elapsed) >= MIN_ELAPSED_MS)) return { ok: false, error: 'too_fast' };
  return { ok: true, review: { site, name, rating, text } };
}

// Raden som kunden godkänner och som läggs i listan "reviews" i omdomen.json.
export function reviewLine(review, date) {
  return JSON.stringify({ namn: review.name, betyg: review.rating, text: review.text, datum: date });
}

export function reviewMail(review, date = new Date().toISOString().slice(0, 10)) {
  const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
  const message = [
    `NYTT OMDÖME TILL ${review.site}`,
    '',
    `Betyg: ${stars} (${review.rating} av 5)`,
    `Namn: ${review.name}`,
    `Datum: ${date}`,
    `Omdöme: ${review.text}`,
    '',
    'SÅ GODKÄNNER NI DET',
    `1. Fråga kunden (${review.site}) om omdömet får visas på sidan.`,
    `2. Lägg raden nedan i listan "reviews" i public/kund/${review.site}/omdomen.json, eller be chatten för kundsidor göra det.`,
    '3. Är det skräp eller inte ett riktigt omdöme: gör ingenting. Då visas det aldrig.',
    '',
    reviewLine(review, date),
  ].join('\n');
  return {
    name: review.name,
    email: 'omdomen@nordvyuf.se',
    phone: '',
    company: review.site,
    package: 'Omdöme',
    message,
  };
}
