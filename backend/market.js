export const symbols = ['NIFTY', 'BANKNIFTY', 'RELIANCE', 'HDFCBANK', 'ICICIBANK', 'TCS', 'INFY', 'SBIN', 'AXISBANK', 'TATAMOTORS'];

export function expiryDates(count = 5, from = new Date()) {
  const date = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const offset = (4 - date.getUTCDay() + 7) % 7;
  date.setUTCDate(date.getUTCDate() + offset);
  return Array.from({ length: count }, (_, index) => {
    const expiry = new Date(date);
    expiry.setUTCDate(expiry.getUTCDate() + index * 7);
    return expiry.toISOString().slice(0, 10);
  });
}

export function marketSnapshot(symbol = 'NIFTY', expiry = expiryDates()[0]) {
  const seed = [...symbol].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  const base = symbol === 'NIFTY' ? 26120 : symbol === 'BANKNIFTY' ? 59640 : symbol === 'RELIANCE' ? 1542 : symbol === 'TCS' ? 3156 : 900 + seed % 2100;
  const step = base > 20000 ? 50 : base > 3000 ? 20 : 10;
  const atm = Math.round(base / step) * step;
  const rows = Array.from({ length: 17 }, (_, index) => {
    const strike = atm + (index - 8) * step;
    const distance = Math.abs(index - 8);
    const value = seed + index * 37;
    return {
      strike,
      ceOI: Math.round((64 - distance * 3 + value % 16) * 13000),
      peOI: Math.round((64 - distance * 3 + (value * 3) % 17) * 13000),
      ceChange: Math.round((value % 19 - 8) * 3200),
      peChange: Math.round(((value * 7) % 21 - 9) * 3000),
      ceLtp: Math.max(2, (base - strike) * 0.55 + 210 - distance * 12),
      peLtp: Math.max(2, (strike - base) * 0.55 + 210 - distance * 12),
      iv: Math.round(12 + distance * 0.7 + value % 4),
      delta: +(0.5 + (atm - strike) / step * 0.055).toFixed(2),
    };
  });
  const pains = rows.map(candidate => ({
    strike: candidate.strike,
    pain: rows.reduce((total, option) => total + option.ceOI * Math.max(0, candidate.strike - option.strike) + option.peOI * Math.max(0, option.strike - candidate.strike), 0),
  }));
  const maxPain = pains.reduce((best, item) => item.pain < best.pain ? item : best);
  const priceSeries = Array.from({ length: 32 }, (_, index) => ({
    minute: `${String(9 + Math.floor(index / 4)).padStart(2, '0')}:${String(index % 4 * 15).padStart(2, '0')}`,
    price: +(base + Math.sin(index / 3) * 22 + index * 1.8 + seed % 8).toFixed(2),
  }));
  const minuteTotals = Array.from({ length: 15 }, (_, index) => ({
    snapshotMinute: `${String(9 + Math.floor(index / 4)).padStart(2, '0')}:${String(index % 4 * 15).padStart(2, '0')}`,
    ce_MinDiff: Math.round((index % 6 - 2) * 3200),
    pe_MinDiff: Math.round((index % 5 - 1) * 3000),
    totalCE_OI: rows.reduce((sum, row) => sum + row.ceOI, 0) + index * 70000,
    totalPE_OI: rows.reduce((sum, row) => sum + row.peOI, 0) + index * 60000,
  }));
  const gamma = rows.map((row, index) => ({
    strike: row.strike,
    callGex: +((row.ceOI * (0.008 + index * 0.0001)) / 1e6).toFixed(3),
    putGex: +((-row.peOI * (0.009 - index * 0.0001)) / 1e6).toFixed(3),
  })).map(row => ({ ...row, netGex: +(row.callGex + row.putGex).toFixed(3) }));
  const history = Array.from({ length: 90 }, (_, index) => {
    const date = new Date(Date.now() - (89 - index) * 86400000).toISOString().slice(0, 10);
    const close = +(base - 120 + index * 1.6 + Math.sin(index * 0.75) * 18).toFixed(2);
    return { date, open: +(close - 8).toFixed(2), high: +(close + 12).toFixed(2), low: +(close - 16).toFixed(2), close, change: +((index % 2 ? -1 : 1) * (index * 0.02 + 0.5)).toFixed(2) };
  });
  const ranked = rankedStocks('CHANGE', 10);
  const positioning = ['Long Buildup', 'Short Buildup', 'Short Covering', 'Long Unwinding'].map((label, index) => ({ label, count: 12 + index * 3, symbols: ranked.slice(index, index + 3).map(row => row.symbol) }));
  return {
    source: 'demo', symbol, expiry, base, step, atm, rows, maxPain,
    pains, priceSeries, minuteTotals, gamma, history, ranked, positioning,
    quote: { symbol, price: base, change: +(base * 0.0013).toFixed(2), changePct: 0.13, low: base - Math.max(42, Math.round(base * 0.003)), high: base + Math.max(42, Math.round(base * 0.003)), status: 'Market Closed', lastUpdated: 'Demo snapshot' },
  };
}

export function rankedStocks(sortBy = 'CHANGE', top = 10) {
  const rows = symbols.slice(2).map((symbol, index) => ({
    symbol,
    price: 900 + index * 113,
    change: +((index % 2 ? -1 : 1) * (0.7 + index * 0.42)).toFixed(2),
    volume: 1000000 + index * 319000,
  }));
  const key = String(sortBy).toUpperCase();
  rows.sort((left, right) => key === 'VOLUME' ? right.volume - left.volume : key === 'PRICE' ? right.price - left.price : Math.abs(right.change) - Math.abs(left.change));
  return rows.slice(0, Math.max(1, Math.min(100, Number(top) || 10)));
}

export function volumeProfile(snapshot) {
  const buckets = snapshot.rows.map((row, index) => ({
    price: row.strike,
    volume: Math.round((row.ceOI + row.peOI) / 10 + (index % 4) * 10000),
    callVolume: Math.round(row.ceOI / 10),
    putVolume: Math.round(row.peOI / 10),
  }));
  return { source: 'demo', symbol: snapshot.symbol, buckets, summary: { state: 'Balanced', lean: 'Mixed', pointOfControl: buckets.reduce((best, item) => item.volume > best.volume ? item : best).price } };
}

export function marketSignals(snapshot) {
  const call = snapshot.rows.reduce((sum, row) => sum + row.ceOI, 0);
  const put = snapshot.rows.reduce((sum, row) => sum + row.peOI, 0);
  return {
    source: 'demo', symbol: snapshot.symbol,
    pcr: +(put / call).toFixed(2),
    category: 'Neutral',
    description: 'Illustrative call and put positioning is broadly balanced.',
    volumeProfile: volumeProfile(snapshot).summary,
  };
}
