import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, rmdirSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('demo market and account flow through the HTTP API', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'owli-api-test-'));
  const dataFile = join(directory, 'accounts.json');
  process.env.OWLI_DATA_FILE = dataFile;
  const { handleApi } = await import('./api.js');
  const server = createServer((req, res) => {
    Promise.resolve(handleApi(req, res)).then(handled => {
      if (!handled) { res.writeHead(404); res.end(); }
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const get = async path => {
    const response = await fetch(origin + path);
    return { response, body: await response.json() };
  };
  try {
    const { response: marketResponse, body: market } = await get('/api/market?symbol=NIFTY&expiry=2026-11-26');
    assert.equal(marketResponse.status, 200);
    assert.equal(market.source, 'demo');
    assert.equal(market.rows.length, 17);
    assert.equal(market.history.length, 90);
    assert.ok(market.rows.some(row => row.strike === market.maxPain.strike));

    const { body: chain } = await get('/api/optionchain?symbol=NIFTY&expiryDate=2026-11-26&strikesCount=4');
    assert.equal(chain.length, 9);
    const { body: gamma } = await get('/api/greeks/netgex?symbol=NIFTY');
    assert.equal(gamma.strikes.length, 17);
    const { body: signals } = await get('/api/signals/stream?symbol=NIFTY');
    assert.equal(signals[0].source, 'demo');

    const email = 'demo@example.test';
    const password = 'samplePassword123';
    const register = await fetch(origin + '/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    assert.equal(register.status, 201);
    const cookie = register.headers.get('set-cookie').split(';')[0];
    const session = await fetch(origin + '/api/auth/session', { headers: { Cookie: cookie } });
    assert.equal((await session.json()).email, email);
    const badLogin = await fetch(origin + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: 'incorrect' }) });
    assert.equal(badLogin.status, 401);
    const logout = await fetch(origin + '/api/auth/logout', { method: 'POST', headers: { Cookie: cookie } });
    assert.equal(logout.status, 200);
    const afterLogout = await fetch(origin + '/api/auth/session', { headers: { Cookie: cookie } });
    assert.equal((await afterLogout.json()).signedIn, false);
  } finally {
    await new Promise(resolve => server.close(resolve));
    try { unlinkSync(dataFile); } catch {}
    rmdirSync(directory);
    delete process.env.OWLI_DATA_FILE;
  }
});
