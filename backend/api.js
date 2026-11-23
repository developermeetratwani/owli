import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expiryDates, marketSignals, marketSnapshot, rankedStocks, symbols, volumeProfile } from './market.js';

const dataFile = process.env.OWLI_DATA_FILE || join(dirname(fileURLToPath(import.meta.url)), '..', '.data', 'accounts.json');
const sessions = new Map();

function readAccounts() {
  if (!existsSync(dataFile)) return {};
  return JSON.parse(readFileSync(dataFile, 'utf8'));
}

function saveAccounts(accounts) {
  mkdirSync(dirname(dataFile), { recursive: true });
  const temp = `${dataFile}.${process.pid}.tmp`;
  writeFileSync(temp, JSON.stringify(accounts, null, 2), { mode: 0o600 });
  renameSync(temp, dataFile);
}

function passwordHash(password, salt) {
  return scryptSync(password, salt, 64).toString('hex');
}

function json(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(JSON.stringify(body));
}

function cookieSession(req) {
  const cookie = req.headers.cookie?.split(';').map(value => value.trim()).find(value => value.startsWith('owli_demo_session='));
  return cookie ? sessions.get(cookie.slice('owli_demo_session='.length)) : undefined;
}

function sessionCookie(token) {
  return `owli_demo_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`;
}

function selectedMarket(url) {
  const symbol = (url.searchParams.get('symbol') || 'NIFTY').toUpperCase();
  const expiry = (url.searchParams.get('expiry') || url.searchParams.get('expiryDate') || expiryDates()[0]).slice(0, 10);
  if (!symbols.includes(symbol) || !/^\d{4}-\d{2}-\d{2}$/.test(expiry)) return null;
  return marketSnapshot(symbol, expiry);
}

async function readBody(req) {
  let text = '';
  for await (const chunk of req) {
    text += chunk;
    if (text.length > 16384) throw new Error('Request too large');
  }
  return JSON.parse(text || '{}');
}

export async function handleApi(req, res) {
  const url = new URL(req.url, 'http://localhost');
  if (!url.pathname.startsWith('/api/')) return false;
  try {
    if (req.method === 'GET' && url.pathname === '/api/symbols') {
      json(res, 200, { symbols });
    } else if (req.method === 'GET' && url.pathname === '/api/contracts/symbols') {
      json(res, 200, symbols.map(symbol => ({ symbol, lotSize: symbol === 'NIFTY' ? 75 : symbol === 'BANKNIFTY' ? 30 : 50 })));
    } else if (req.method === 'GET' && ['/api/contracts/expiries', '/api/greeks/expiries'].includes(url.pathname)) {
      json(res, 200, expiryDates());
    } else if (req.method === 'GET' && url.pathname === '/api/market') {
      const snapshot = selectedMarket(url);
      if (!snapshot) return json(res, 400, { error: 'Invalid symbol or expiry' }), true;
      json(res, 200, snapshot);
    } else if (req.method === 'GET' && url.pathname === '/api/market/nifty-summary') {
      const snapshot = selectedMarket(url);
      if (!snapshot) return json(res, 400, { error: 'Invalid symbol' }), true;
      json(res, 200, { ...snapshot.quote, source: 'demo' });
    } else if (req.method === 'GET' && url.pathname === '/api/market/top-movers') {
      const rows = rankedStocks('CHANGE', url.searchParams.get('topN') || 5);
      json(res, 200, { source: 'demo', gainers: rows.filter(row => row.change >= 0), losers: rows.filter(row => row.change < 0) });
    } else if (req.method === 'GET' && url.pathname === '/api/stocks/ranked') {
      json(res, 200, rankedStocks(url.searchParams.get('sortBy'), url.searchParams.get('top')));
    } else if (req.method === 'GET' && url.pathname === '/api/market/volume-profile') {
      const snapshot = selectedMarket(url);
      if (!snapshot) return json(res, 400, { error: 'Invalid symbol' }), true;
      json(res, 200, volumeProfile(snapshot));
    } else if (req.method === 'GET' && url.pathname === '/api/optionchain') {
      const snapshot = selectedMarket(url);
      if (!snapshot) return json(res, 400, { error: 'Invalid symbol or expiry' }), true;
      const count = Math.max(1, Math.min(8, Number(url.searchParams.get('strikesCount')) || 8));
      json(res, 200, snapshot.rows.slice(8 - count, 9 + count));
    } else if (req.method === 'GET' && url.pathname === '/api/optionchain/futures-price-series') {
      const snapshot = selectedMarket(url);
      if (!snapshot) return json(res, 400, { error: 'Invalid symbol' }), true;
      json(res, 200, snapshot.priceSeries);
    } else if (req.method === 'GET' && url.pathname === '/api/optionchain/minute-totals') {
      const snapshot = selectedMarket(url);
      if (!snapshot) return json(res, 400, { error: 'Invalid symbol or expiry' }), true;
      json(res, 200, snapshot.minuteTotals);
    } else if (req.method === 'GET' && url.pathname === '/api/optionchain/most-active-strikes') {
      const snapshot = selectedMarket(url);
      if (!snapshot) return json(res, 400, { error: 'Invalid symbol or expiry' }), true;
      const count = Math.max(1, Math.min(17, Number(url.searchParams.get('topN')) || 3));
      json(res, 200, [...snapshot.rows].sort((a, b) => Math.abs(b.ceChange) + Math.abs(b.peChange) - Math.abs(a.ceChange) - Math.abs(a.peChange)).slice(0, count));
    } else if (req.method === 'GET' && url.pathname === '/api/optionchain/maxpain') {
      const snapshot = selectedMarket(url);
      if (!snapshot) return json(res, 400, { error: 'Invalid symbol or expiry' }), true;
      json(res, 200, { source: 'demo', symbol: snapshot.symbol, expiryDate: snapshot.expiry, maxPainStrike: snapshot.maxPain.strike, painByStrike: snapshot.pains });
    } else if (req.method === 'GET' && url.pathname === '/api/maxpain/tracker') {
      const snapshot = selectedMarket(url);
      if (!snapshot) return json(res, 400, { error: 'Invalid symbol or expiry' }), true;
      const count = Math.max(1, Math.min(30, Number(url.searchParams.get('days')) || 5));
      const series = Array.from({ length: count }, (_, index) => ({ date: new Date(Date.now() - (count - index - 1) * 86400000).toISOString().slice(0, 10), maxPain: snapshot.maxPain.strike + ((index % 3) - 1) * snapshot.step }));
      json(res, 200, { source: 'demo', series, drift: series.map((point, index) => ({ date: point.date, points: index ? point.maxPain - series[index - 1].maxPain : 0 })), netDriftPts: series.at(-1).maxPain - series[0].maxPain });
    } else if (req.method === 'GET' && url.pathname === '/api/greeks/latest') {
      const snapshot = selectedMarket(url);
      if (!snapshot) return json(res, 400, { error: 'Invalid symbol or expiry' }), true;
      json(res, 200, { source: 'demo', symbol: snapshot.symbol, expiry: snapshot.expiry, rows: snapshot.rows.map((row, index) => ({ strike: row.strike, callDelta: row.delta, putDelta: +(row.delta - 1).toFixed(2), callGamma: snapshot.gamma[index].callGex, putGamma: snapshot.gamma[index].putGex, iv: row.iv })) });
    } else if (req.method === 'GET' && url.pathname === '/api/greeks/netgex') {
      const snapshot = selectedMarket(url);
      if (!snapshot) return json(res, 400, { error: 'Invalid symbol or expiry' }), true;
      json(res, 200, { source: 'demo', symbol: snapshot.symbol, netGex: +snapshot.gamma.reduce((sum, row) => sum + row.netGex, 0).toFixed(3), gammaFlip: snapshot.atm - snapshot.step, callWall: snapshot.atm + 3 * snapshot.step, putWall: snapshot.atm - 2 * snapshot.step, strikes: snapshot.gamma });
    } else if (req.method === 'GET' && url.pathname === '/api/greeks/intraday') {
      const snapshot = selectedMarket(url);
      if (!snapshot) return json(res, 400, { error: 'Invalid symbol or expiry' }), true;
      json(res, 200, snapshot.priceSeries.map((point, index) => ({ ...point, netGex: +(Math.sin(index / 4) * 0.12).toFixed(3) })));
    } else if (req.method === 'GET' && url.pathname === '/api/greeks/staircase') {
      const snapshot = selectedMarket(url);
      if (!snapshot) return json(res, 400, { error: 'Invalid symbol or expiry' }), true;
      json(res, 200, { source: 'demo', buckets: snapshot.gamma });
    } else if (req.method === 'GET' && url.pathname === '/api/signals/stream') {
      const snapshot = selectedMarket(url);
      if (!snapshot) return json(res, 400, { error: 'Invalid symbol' }), true;
      json(res, 200, [marketSignals(snapshot)]);
    } else if (req.method === 'GET' && url.pathname === '/api/signals/volume-profile-events') {
      const snapshot = selectedMarket(url);
      if (!snapshot) return json(res, 400, { error: 'Invalid symbol' }), true;
      json(res, 200, [{ type: 'Balanced', description: marketSignals(snapshot).description, source: 'demo' }]);
    } else if (req.method === 'POST' && url.pathname === '/api/oi/atm-strike') {
      const body = await readBody(req);
      const snapshot = marketSnapshot(String(body.Symbol || 'NIFTY').toUpperCase(), String(body.ExpiryDate || expiryDates()[0]).slice(0, 10));
      json(res, 200, { refPrice: snapshot.base, atmStrike: snapshot.atm, source: 'demo' });
    } else if (req.method === 'POST' && url.pathname === '/api/oi/compare') {
      json(res, 200, rankedStocks('CHANGE', 8).map((row, index) => ({ ...row, signal: ['Long Buildup', 'Short Buildup', 'Short Covering', 'Long Unwinding'][index % 4], source: 'demo' })));
    } else if (req.method === 'GET' && url.pathname === '/api/auth/session') {
      const email = cookieSession(req);
      json(res, 200, { signedIn: Boolean(email), email: email || null });
    } else if (req.method === 'POST' && ['/api/auth/register', '/api/users/register'].includes(url.pathname)) {
      const { email, password } = await readBody(req);
      const normalizedEmail = String(email || '').trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail) || typeof password !== 'string' || password.length < 8) return json(res, 400, { error: 'Enter a valid email and a password of at least 8 characters.' }), true;
      const accounts = readAccounts();
      if (accounts[normalizedEmail]) return json(res, 409, { error: 'This demo account already exists.' }), true;
      const salt = randomBytes(16).toString('hex');
      accounts[normalizedEmail] = { salt, hash: passwordHash(password, salt) };
      saveAccounts(accounts);
      const token = randomBytes(32).toString('hex');
      sessions.set(token, normalizedEmail);
      json(res, 201, { signedIn: true, email: normalizedEmail }, { 'Set-Cookie': sessionCookie(token) });
    } else if (req.method === 'POST' && ['/api/auth/login', '/api/users/login'].includes(url.pathname)) {
      const { email, password } = await readBody(req);
      const normalizedEmail = String(email || '').trim().toLowerCase();
      const account = readAccounts()[normalizedEmail];
      const attemptedHash = passwordHash(String(password || ''), account?.salt || 'invalid-salt');
      const expected = Buffer.from(account?.hash || '0'.repeat(128), 'hex');
      if (!account || !timingSafeEqual(Buffer.from(attemptedHash, 'hex'), expected)) return json(res, 401, { error: 'Invalid demo email or password.' }), true;
      const token = randomBytes(32).toString('hex');
      sessions.set(token, normalizedEmail);
      json(res, 200, { signedIn: true, email: normalizedEmail }, { 'Set-Cookie': sessionCookie(token) });
    } else if (req.method === 'POST' && url.pathname === '/api/users/google') {
      json(res, 501, { error: 'Google sign-in requires your own OAuth credentials and backend integration.' });
    } else if (req.method === 'POST' && url.pathname === '/api/auth/logout') {
      const cookie = req.headers.cookie?.split(';').map(value => value.trim()).find(value => value.startsWith('owli_demo_session='));
      if (cookie) sessions.delete(cookie.slice('owli_demo_session='.length));
      json(res, 200, { signedIn: false }, { 'Set-Cookie': 'owli_demo_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0' });
    } else {
      json(res, 404, { error: 'API route not found' });
    }
  } catch (error) {
    json(res, error instanceof SyntaxError ? 400 : 500, { error: error instanceof SyntaxError ? 'Invalid JSON' : 'Request failed' });
  }
  return true;
}
