// Tester för Claude Haiku 5.5 i intervjun. En låtsasklient (env.CLAUDE_CLIENT) tar emot anropen,
// så att inget riktigt anrop görs och ingen nyckel behövs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { interviewTurn, draftCopy, strictSchema, resetPauses, CLAUDE_MODEL } from '../src/interview.js';

const brief = { foretagsnamn: 'ReBoard UF', foretagstyp: 'UF-företag' };
const turn = (env, message = 'Vi gör skärbrädor av gammal ek, ring 070-123 45 67') =>
  interviewTurn(env, { brief, asked: ['bransch'], askCount: 1, message, history: [], debug: true });

function fakeClaude(reply) {
  const calls = [];
  return {
    calls,
    messages: {
      create: async (body, options) => {
        calls.push({ body, options });
        return typeof reply === 'function' ? reply(body) : reply;
      },
    },
  };
}
const answer = (json, extra = {}) => ({
  stop_reason: 'end_turn',
  content: [{ type: 'thinking', thinking: '' }, { type: 'text', text: JSON.stringify(json) }],
  usage: { input_tokens: 520, cache_read_input_tokens: 1900, cache_creation_input_tokens: 0, output_tokens: 90 },
  ...extra,
});
const workersAi = (json) => ({ run: async () => ({ response: JSON.stringify(json) }) });

test('Claude Haiku 5.5 svarar först, med cache, JSON-schema och utan temperature', async () => {
  resetPauses();
  const client = fakeClaude(answer({ saves: [{ field: 'bransch', value: 'Skärbrädor av gammal ek' }], reply: 'Var finns ni?', asked: 'ort_omrade' }));
  const t = await turn({ ANTHROPIC_API_KEY: 'test', CLAUDE_CLIENT: client, AI: workersAi({ saves: [], reply: 'fel', asked: '' }) });
  assert.equal(t.source, 'ai');
  assert.equal(t.debug.provider, `claude:${CLAUDE_MODEL}`);
  assert.equal(t.debug.usage.cacheRead, 1900);
  // Koden sparar kundens egna ord för fältet som frågades (se applyTurn).
  assert.match(t.brief.bransch, /skärbrädor av gammal ek/i);
  assert.deepEqual(t.asked, ['ort_omrade']);

  const { body, options } = client.calls[0];
  assert.equal(body.model, 'claude-haiku-5-5');
  assert.equal(body.temperature, undefined);
  assert.deepEqual(body.system[0].cache_control, { type: 'ephemeral' });
  assert.ok(body.messages.every((m) => m.role !== 'system'));
  assert.equal(body.output_config.format.type, 'json_schema');
  assert.equal(body.output_config.format.schema.additionalProperties, false);
  assert.equal(body.output_config.effort, 'low');
  assert.ok(body.max_tokens > 1000, 'plats för tänkandet');
  assert.equal(options.maxRetries, 0);
  // Telefonnumret skickas aldrig till Claude.
  assert.doesNotMatch(JSON.stringify(body.messages), /070-123/);
});

test('svarar Claude inte tar Workers AI över, och Claude pausas en stund', async () => {
  resetPauses();
  const err = Object.assign(new Error('rate limited'), { status: 429 });
  const client = fakeClaude(() => { throw err; });
  const env = { ANTHROPIC_API_KEY: 'test', CLAUDE_CLIENT: client, AI: workersAi({ saves: [], reply: 'Var finns ni?', asked: 'ort_omrade' }) };
  const first = await turn(env);
  assert.equal(first.source, 'ai');
  assert.equal(first.debug.provider, 'workers-ai');
  assert.match(first.debug.errors.join(' '), /claude:claude-haiku-5-5 429/);
  await turn(env);
  assert.equal(client.calls.length, 1, 'pausad efter 429');
  resetPauses();
});

test('ett nej från Claude (refusal) eller ett avbrutet svar går vidare till reserven', async () => {
  for (const stop of ['refusal', 'max_tokens']) {
    resetPauses();
    const client = fakeClaude(answer({ saves: [], reply: 'x', asked: '' }, { stop_reason: stop }));
    const t = await turn({ ANTHROPIC_API_KEY: 'test', CLAUDE_CLIENT: client, AI: workersAi({ saves: [], reply: 'Var finns ni?', asked: 'ort_omrade' }) });
    assert.equal(t.debug.provider, 'workers-ai');
    assert.match(t.debug.errors.join(' '), new RegExp(stop));
  }
});

test('utan nyckel anropas Claude aldrig', async () => {
  resetPauses();
  const client = fakeClaude(answer({ saves: [], reply: 'x', asked: '' }));
  await turn({ CLAUDE_CLIENT: client, AI: workersAi({ saves: [], reply: 'Var finns ni?', asked: 'ort_omrade' }) });
  assert.equal(client.calls.length, 0);
});

test('utkastets texter skrivs också av Claude', async () => {
  resetPauses();
  const copy = { headline: 'Skärbrädor av gammal ek', sub: 'Gjorda för hand i Malmö.', tagline: 'Skärbrädor, Malmö', cta: 'Beställ', services: [{ title: 'Liten', text: 'För frukosten.' }, { title: 'Mellan', text: 'För vardagen.' }, { title: 'Stor', text: 'För servering.' }], about: '' };
  const client = fakeClaude(answer(copy));
  const d = await draftCopy({ ANTHROPIC_API_KEY: 'test', CLAUDE_CLIENT: client }, { brief: { ...brief, bransch: 'Skärbrädor av återvunnen ek', tjanster_produkter: 'Skärbrädor i tre storlekar' } });
  assert.equal(d.source, 'ai');
  assert.equal(d.copy.headline, 'Skärbrädor av gammal ek');
  assert.equal(client.calls[0].body.output_config.format.schema.properties.services.items.additionalProperties, false);
});

test('strictSchema stänger varje objekt', () => {
  const s = strictSchema({ type: 'object', properties: { a: { type: 'array', items: { type: 'object', properties: { b: { type: 'string' } } } } } });
  assert.equal(s.additionalProperties, false);
  assert.equal(s.properties.a.items.additionalProperties, false);
});
