const ROUTES = [
  ['/dashboard', 'Dashboard'], ['/oi-ladder', 'OI Ladder'], ['/oi-activity', 'OI Activity'],
  ['/option-chain', 'Option Chain'], ['/max-pain', 'Max Pain'],
  ['/strategic-positioning', 'Strategic Positioning'], ['/gamma-map', 'Gamma Map'],
  ['/stocks-ranked', 'Stocks Ranked'],
];
const SYMBOLS = ['NIFTY', 'BANKNIFTY', 'RELIANCE', 'HDFCBANK', 'ICICIBANK', 'TCS', 'INFY', 'SBIN', 'AXISBANK', 'TATAMOTORS'];
const app = document.querySelector('#app');
const marketCache = new Map();
let backendSession = null;
let renderVersion = 0;
const nextExpiry = () => { const date=new Date(); date.setUTCDate(date.getUTCDate()+(4-date.getUTCDay()+7)%7); return date.toISOString().slice(0,10); };
const state = { symbol: localStorage.getItem('owli-symbol') || 'NIFTY', expiry: nextExpiry(), range: '1D', interval: '15', mode: 'oi', search: '', sort: 'change', reverse: false, tab: 'all', menu: false, perLot: false, strikes: 8 };
const fmt = new Intl.NumberFormat('en-IN');
const money = n => fmt.format(Math.round(n));
const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const loggedIn = () => {
  if (new URLSearchParams(location.search).has('demo')) sessionStorage.setItem('owli-demo-session', 'yes');
  return backendSession === true || sessionStorage.getItem('owli-demo-session') === 'yes';
};
const route = () => location.pathname.replace(/\/$/, '') || '/';
const url = path => new URL(path, location.origin).pathname;
const nextPath = () => { const next=new URLSearchParams(location.search).get('next'); return next?.startsWith('/')&&!next.startsWith('//')?next:'/dashboard'; };
function go(path) { history.pushState({}, '', path); render(); scrollTo(0, 0); }
window.addEventListener('popstate', render);
document.addEventListener('click', e => {
  const a = e.target.closest('a[data-link]');
  if (a && !e.ctrlKey && !e.metaKey && !e.shiftKey) { e.preventDefault(); go(a.getAttribute('href')); }
});
function brand() { return `<span class="brand" aria-label="Owli">OWL<span>!</span></span>`; }
function publicHeader() { return `<header class="public-header"><a href="/landing" data-link>${brand()}</a><nav><a href="/landing#about">About Us</a><a href="/landing#features">Features</a><a href="/landing#pricing">Pricing</a><a href="/landing#learn">Learn</a></nav><a class="pill orange" href="/signin" data-link>Beta Access</a></header>`; }
function landing() {
  return `${publicHeader()}<main class="landing"><section class="hero" id="top"><span class="beta">Currently In Beta Testing</span><h1><em>Discover</em> what<br> really drives the<br><em> market</em></h1><p><em>Owli</em> makes options data clear, honest, and understandable. Because<br class="desktop"> <em>markets go where options flow.</em></p><div class="hero-actions"><a class="pill orange" href="/register" data-link>Get Beta Access</a><a class="pill outline" href="#features">See Features</a></div><a class="scroll-cue" href="#features">SCROLL <span>↓</span></a></section>
  <section class="landing-section" id="features"><div class="eyebrow">FEATURES</div><h2>Built to Read the Market</h2><p class="subhead">Focused tools for the retail trader. No clutter. Just the data that moves the needle.</p><div class="feature-grid"><article><span class="feature-no">01</span><h3>Open Interest Activity</h3><p>Track where option positions build or unwind through the session.</p><div class="mini-bars">${[32,48,42,66,54,86,72,92].map((n,i)=>`<i style="height:${n}%;background:${i%2?'#ff4d05':'#343434'}"></i>`).join('')}</div></article><article><span class="feature-no">02</span><h3>Option Chain</h3><p>Calls, puts, strikes and Greeks together in one clear view.</p><div class="feature-table"><span>CALL OI</span><span>STRIKE</span><span>PUT OI</span><b>28.4L</b><b>26,000</b><b>32.8L</b><b>31.7L</b><b>26,050</b><b>29.6L</b></div></article><article><span class="feature-no">03</span><h3>Greeks & Gamma</h3><p>Read positioning and risk with visual market context.</p><div class="wave">〰〰〰</div></article></div></section>
  <section class="landing-section pricing-section" id="pricing"><div class="eyebrow">PRICING</div><h2>Every move has a smart buildup</h2><p class="subhead">Professional-grade market insights now accessible to retail traders.</p><div class="pricing-card"><span class="beta">BETA ACCESS</span><h3>Beta Version</h3><p>We're testing the product, not your wallet. Your feedback fuels this phase.</p><div class="checks"><span>✓ Strike-Level Buildup</span><span>✓ Clean Option Chain</span><span>✓ Live OI Flow</span><span>✓ Open Interest Analysis</span></div><small>More features coming soon.</small><a class="pill orange" href="/register" data-link>Join The Beta Access</a></div></section>
  <section class="landing-section" id="learn"><div class="eyebrow">OWLI LEARNING HUB</div><h2>We're building more than a market reading tool.<br>We're building an understanding.</h2><div class="learn-grid"><article><span>◫</span><h3>Platform Walkthrough</h3><p>Step-by-step guides to get the most out of every feature.</p></article><article><span>◎</span><h3>Options Education</h3><p>From basics to advanced Greeks, learn to read the market, not guess it.</p></article><article><span>◉</span><h3>Live Market Sessions</h3><p>Watch real market reads with Owli and understand data as it moves.</p></article></div><small>*COMING SOON</small></section>
  <section class="landing-section about-section" id="about"><div class="eyebrow">ABOUT OWLI</div><h2>Clarity over complexity</h2><div class="about-grid"><div><div class="stat">95% <small>Traders lose money in F&O</small></div><div class="stat">1 in 9 <small>are profitable</small></div></div><p>Owli is a market reading platform for retail traders. We take options and futures data and present it in a way that's clean, useful, and easy to understand. Focused tools and learning resources help you spend less time figuring things out and more time reading the market.</p></div></section>
  <section class="landing-section values-section" id="values"><div class="eyebrow">CULTURE AT OWLI</div><h2>Small team. Big ownership</h2><p class="subhead">Owli is run by a small team with zero outside funding. We believe in openness, honest feedback, initiative, and empathy.</p><div class="values">${[['Own It','Take responsibility for the product as owners.'],['Responsible Building','Build with care and real market experience.'],['Authenticity','Speak clearly about what we build.'],['Openness','Encourage direct communication and curiosity.'],['Respect','Communicate with empathy and listen actively.']].map(x=>`<article><h3>${x[0]}</h3><p>${x[1]}</p></article>`).join('')}</div></section>
  <section class="final-cta"><div class="eyebrow">READY TO SEE THE MARKET CLEARLY?</div><h2>Stop guessing, start reading</h2><p>The market has always had a language. With Owli, you finally translate it.</p><a class="pill orange" href="/register" data-link>Explore Owli</a></section></main>${publicFooter()}`;
}
function publicFooter() { return `<footer class="public-footer"><div><a href="/landing" data-link>${brand()}</a><p>Bringing clarity to derivatives data for retail traders.</p></div><div><h3>Product</h3><a href="/landing#features">Features</a><a href="/landing#pricing">Pricing</a><a href="/landing#learn">Learning Hub</a></div><div><h3>Company</h3><a href="/landing#about">About Us</a><a href="/landing#values">Our Values</a></div><p class="disclaimer">This independent demo uses illustrative market data. It is for interface evaluation and education only, and does not provide trading recommendations or live exchange data.</p></footer>`; }
function authPage(kind) {
  const signin = kind === 'signin', forgot = kind === 'forgot-password';
  return `${publicHeader()}<main class="auth-page"><div class="auth-art"><div class="auth-orbit">◉</div><h2>Markets move.<br><em>Read the flow.</em></h2><p>Options data, made clear.</p></div><div class="auth-panel"><div class="auth-box"><div class="eyebrow">OWLI BETA</div><h1>${forgot?'Reset your password':signin?'Welcome Back!':'Create your account'}</h1><p>${forgot?'Set a new password for this browser’s demo account.':signin?'Owli’s been watching the market':'Start reading the market with Owli.'}</p><form id="auth-form" data-kind="${kind}"><label>Email<input name="email" type="email" placeholder="name@example.com" autocomplete="email" required></label><label>${forgot?'New password':'Password'}<input name="password" type="password" minlength="8" placeholder="${signin?'Enter your password':'At least 8 characters'}" autocomplete="${signin?'current-password':'new-password'}" required></label>${signin?'<a class="forgot" href="/forgot-password" data-link>Forgot password?</a>':''}<button class="pill orange wide" type="submit">${forgot?'Reset demo password':signin?'Sign In':'Create Account'}</button></form><div id="auth-message" role="status"></div>${forgot?'':`<button id="demo-access" class="pill outline wide">Explore demo dashboard</button>`}<p class="auth-switch">${signin?'No account yet? <a href="/register" data-link>Create one for free</a>':forgot?'Remembered it? <a href="/signin" data-link>Sign in</a>':'Already have an account? <a href="/signin" data-link>Sign in</a>'}</p><p class="demo-note">Demo accounts are stored on this local server. Live feeds and Google sign-in need provider credentials.</p></div></div></main>`;
}
function forgotPage() {
  return `${publicHeader()}<main class="auth-page single-auth"><div class="auth-panel"><div class="auth-box"><div class="eyebrow">OWLI BETA</div><h1>Password recovery</h1><p>Email delivery is not configured for this local demo. You can create another demo account or use Explore demo dashboard on the sign-in page.</p><a class="pill orange wide" href="/signin" data-link>Back to sign in</a></div></div></main>`;
}
function shell(title, content, showTitle=true) {
  return `<div class="app-shell horizontal"><header class="app-header"><a href="/dashboard" data-link>${brand()}</a><nav class="app-nav" aria-label="Dashboard pages">${ROUTES.map(([path,label])=>`<a class="${route()===path?'active':''}" href="${path}" data-link>${label}</a>`).join('')}</nav><button class="avatar" id="signout" title="Sign out" aria-label="Sign out">O</button></header><main class="workspace">${showTitle?`<div class="page-top"><div><h1>${title}</h1></div><span class="data-label">Illustrative data · Not live</span></div>`:'<div class="demo-strip">DEMO DATA · NOT LIVE MARKET INFORMATION</div>'}${content}</main></div>`;
}
function icon(label) { return ({Dashboard:'▦','OI Ladder':'▥','OI Activity':'◫','Option Chain':'▤','Max Pain':'◎','Strategic Positioning':'⌁','Gamma Map':'◉','Top Movers':'↗','Stocks Ranked':'≡','Stock History':'◷'})[label]; }
function selectors(extra='') { return `<div class="filters"><label>SYMBOL<select id="symbol">${SYMBOLS.map(s=>`<option ${state.symbol===s?'selected':''}>${s}</option>`).join('')}</select></label><label>EXPIRY<input id="expiry" type="date" value="${state.expiry}"></label>${extra}<span class="filters-note">Showing simulated market data</span></div>`; }
function seed() { return [...state.symbol].reduce((a,c)=>a+c.charCodeAt(0),0); }
function marketKey() { return `${state.symbol}|${state.expiry}`; }
async function loadMarket() {
  const key = marketKey();
  if (marketCache.has(key)) return;
  const response = await fetch(`/api/market?symbol=${encodeURIComponent(state.symbol)}&expiry=${encodeURIComponent(state.expiry)}`);
  if (!response.ok) throw new Error('Demo market data could not load');
  marketCache.set(key, await response.json());
}
function market() { return marketCache.get(marketKey()); }
function metric(label,value,change,positive=true) { return `<article class="metric"><span>${label}</span><strong>${value}</strong><small class="${positive?'up':'down'}">${change}</small></article>`; }
function barChart(rows, field, color='#ff4d05') { const max=Math.max(...rows.map(r=>Math.abs(r[field])),1); return `<div class="bar-chart" role="img" aria-label="${safe(field)} by strike">${rows.map(r=>`<div class="bar-col"><i style="height:${Math.max(5,Math.abs(r[field])/max*100)}%;background:${color}"></i><span>${r.strike}</span></div>`).join('')}</div>`; }
function lineChart(values, color='#ff4d05') { const w=760,h=220,min=Math.min(...values),max=Math.max(...values),span=max-min||1; const points=values.map((v,i)=>`${i*w/(values.length-1)},${h-(v-min)/span*(h-30)-15}`).join(' '); return `<svg class="line-chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="Illustrative time series"><line x1="0" y1="55" x2="760" y2="55"/><line x1="0" y1="110" x2="760" y2="110"/><line x1="0" y1="165" x2="760" y2="165"/><polyline points="${points}" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/></svg>`; }
function section(title, body, trailing='') { return `<section class="panel"><div class="panel-head"><h2>${title}</h2>${trailing}</div>${body}</section>`; }
function futuresStrip(m) {
  const change = state.symbol === 'NIFTY' ? 34.6 : Math.round(m.base * 0.0013 * 10) / 10;
  const low = m.base - Math.max(42, Math.round(m.base * 0.003));
  const high = m.base + Math.max(42, Math.round(m.base * 0.003));
  const position = Math.max(5, Math.min(95, ((m.base - low) / (high - low)) * 100));
  return `<section class="futures-strip" aria-label="Illustrative futures summary"><div class="futures-main"><h1>${safe(state.symbol)} Futures</h1><div class="futures-price">${money(m.base)} <span>↑ +${change.toFixed(1)} (${(change / m.base * 100).toFixed(2)}%)</span></div><div class="futures-range"><div class="range-track"><i style="left:${position}%"></i></div><div class="range-labels"><span>L: ${money(low)}</span><span>H: ${money(high)}</span></div></div></div><div class="futures-status"><span>Last Updated</span><strong>Demo snapshot</strong><small>Market Closed · Illustrative data</small></div></section>`;
}
function dashboard() { const raw=market(), m=state.perLot?{...raw,rows:raw.rows.map(r=>({...r,ceOI:r.ceOI/50,peOI:r.peOI/50,ceChange:r.ceChange/50,peChange:r.peChange/50}))}:raw, ce=m.rows.reduce((a,r)=>a+r.ceOI,0), pe=m.rows.reduce((a,r)=>a+r.peOI,0), shown=m.rows.slice(8-state.strikes,9+state.strikes), chart=m.priceSeries.map(point=>point.price);return shell('Dashboard',`${futuresStrip(m)}<div class="dashboard-controls"><label><span class="sr-only">Search scrip</span><input id="symbol-input" list="symbols" value="${state.symbol}" aria-label="Search scrip" placeholder="Search scrip..."></label><datalist id="symbols">${SYMBOLS.map(s=>`<option value="${s}">`).join('')}</datalist><label class="lot-toggle"><input id="per-lot" type="checkbox" ${state.perLot?'checked':''}> Per Lot</label><div class="control-spacer"></div><label><span class="sr-only">Strikes</span><select id="strikes">${[4,6,8].map(n=>`<option value="${n}" ${state.strikes===n?'selected':''}>${n} Strikes</option>`).join('')}</select></label><label><span class="sr-only">Expiry</span><input id="expiry" type="date" value="${state.expiry}"></label></div><div class="dashboard-grid"><div><h2>Intraday OI Activity</h2><div class="dash-table"><div class="dash-row head"><span>Time</span><span>Call OI</span><span>Put OI</span></div>${[...Array(15)].map((_,i)=>`<div class="dash-row"><span>${String(9+Math.floor(i/4)).padStart(2,'0')}:${String(i%4*15).padStart(2,'0')}</span><span>${(ce/1e6+i*.07).toFixed(2)} M</span><span>${(pe/1e6+i*.06).toFixed(2)} M</span></div>`).join('')}</div><h2 class="lower-title">OI Pulse</h2><div class="dash-table"><div class="dash-row head"><span>Time</span><span>Calls</span><span>Puts</span></div>${[1,2,3].map((v,i)=>`<div class="dash-row"><span>${11+i}:00</span><span>${money(m.rows[i+7].ceChange)}</span><span>${money(m.rows[i+7].peChange)}</span></div>`).join('')}</div></div><div><h2>Open Interest Ladder <small>PCR: ${(pe/ce).toFixed(2)}</small></h2><div class="dash-table"><div class="dash-row head four"><span>Total OI</span><span>Strike</span><span>Build Up</span><span>PCR</span></div>${shown.map(r=>`<div class="dash-row four ${r.strike===m.atm?'atm-row':''}"><span>${((r.ceOI+r.peOI)/1e6).toFixed(2)} M</span><span>${money(r.strike)}</span><span class="${r.peChange-r.ceChange>0?'up':'down'}">${r.peChange-r.ceChange>0?'Put':'Call'}</span><span>${(r.peOI/r.ceOI).toFixed(2)}</span></div>`).join('')}</div><h2 class="lower-title">Top OI Change</h2><div class="dash-table"><div class="dash-row head"><span>Strike</span><span>Calls</span><span>Puts</span></div>${m.rows.slice(6,10).map(r=>`<div class="dash-row"><span>${money(r.strike)}</span><span>${money(r.ceChange)}</span><span>${money(r.peChange)}</span></div>`).join('')}</div></div><div><h2>Market Breath</h2><div class="breath-panel"><div class="breath-title">Market Breath <span>Neutral</span></div><div class="breath-tiles"><div><strong>NPW</strong><b>Flat</b></div><div><strong>Writing Flow</strong><p>Balanced writing around the current strike</p></div><div class="full"><strong>OI Walls</strong><p>Call wall ${money(m.atm+3*m.step)} · Put wall ${money(m.atm-2*m.step)}</p></div><div><strong>PCR (T)</strong><b>${(pe/ce).toFixed(2)}</b></div><div><strong>CALL OI</strong><b>${(ce/1e6).toFixed(2)} M</b></div><div><strong>PUT OI</strong><b>${(pe/1e6).toFixed(2)} M</b></div><div><strong>ATM IV</strong><b>${m.rows[8].iv}%</b></div><div><strong>CALL WRITING</strong><b>${money(m.rows[8].ceChange)}</b></div><div><strong>PUT WRITING</strong><b>${money(m.rows[8].peChange)}</b></div></div></div><h2 class="lower-title">Volume Profile</h2>${barChart(m.rows,'ceOI','#229bbb')}<h2 class="lower-title">Market Read</h2><p class="market-read">Positioning <b>Neutral</b> · Flow <b>Neutral</b></p></div></div><div class="dashboard-bottom">${section(`${state.symbol} price movement`,lineChart(chart),'<span class="tag">1 DAY</span>')}${section('At-the-money snapshot',`<div class="snapshot"><div><span>ATM STRIKE</span><strong>${money(m.atm)}</strong></div><div><span>CALL OI</span><strong>${money(m.rows[8].ceOI)}</strong></div><div><span>PUT OI</span><strong>${money(m.rows[8].peOI)}</strong></div><div><span>NET CHANGE</span><strong>${money(m.rows[8].peChange-m.rows[8].ceChange)}</strong></div></div>`)}</div>`,false); }
function oiLadder() { const m=market(); return shell('OI Ladder',`${selectors()}${section('Strike-level open interest',`<p class="panel-sub">Compare call and put positioning around the at-the-money strike.</p><div class="ladder"><div class="ladder-head"><span>CALL OI</span><span>STRIKE</span><span>PUT OI</span></div>${m.rows.map(r=>`<div class="ladder-row ${r.strike===m.atm?'atm':''}"><div><span>${money(r.ceOI)}</span><i style="width:${r.ceOI/1e6*100}%"></i></div><strong>${money(r.strike)}</strong><div><i style="width:${r.peOI/1e6*100}%"></i><span>${money(r.peOI)}</span></div></div>`).join('')}</div>`)}`); }
function oiActivity() { const m=market(); return shell('OI Activity',`${selectors(`<label>INTERVAL<select id="interval">${['5','15','30','60'].map(x=>`<option ${state.interval===x?'selected':''}>${x}</option>`).join('')}</select></label>`)}<div class="metrics">${metric('CALL OI CHANGE',money(m.rows.reduce((a,r)=>a+r.ceChange,0)),'Session change')}${metric('PUT OI CHANGE',money(m.rows.reduce((a,r)=>a+r.peChange,0)),'Session change')}${metric('ACTIVE STRIKES','17','Around ATM')}${metric('INTERVAL',`${state.interval} min`,'Selected window')}</div>${section('Open interest activity',barChart(m.rows,'peChange','#229bbb'))}${section('Strike detail',optionTable(m.rows,'activity'))}`); }
function optionTable(rows, kind='chain') { return `<div class="table-wrap"><table><thead><tr><th>CALL OI</th><th>CHG OI</th><th>LTP</th><th>STRIKE</th><th>PUT LTP</th><th>CHG OI</th><th>PUT OI</th></tr></thead><tbody>${rows.map(r=>`<tr class="${r.strike===market().atm?'atm-row':''}"><td>${money(r.ceOI)}</td><td class="${r.ceChange>=0?'up':'down'}">${r.ceChange>=0?'+':''}${money(r.ceChange)}</td><td>${r.ceLtp.toFixed(1)}</td><th>${money(r.strike)}</th><td>${r.peLtp.toFixed(1)}</td><td class="${r.peChange>=0?'up':'down'}">${r.peChange>=0?'+':''}${money(r.peChange)}</td><td>${money(r.peOI)}</td></tr>`).join('')}</tbody></table></div>`; }
function optionChain() { const m=market(); return shell('Option Chain',`${selectors()}<div class="metrics">${metric('UNDERLYING',state.symbol,'Selected symbol')}${metric('SPOT',money(m.base),'▲ 0.82%')}${metric('ATM STRIKE',money(m.atm),'Nearest strike')}${metric('PCR',(m.rows.reduce((a,r)=>a+r.peOI,0)/m.rows.reduce((a,r)=>a+r.ceOI,0)).toFixed(2),'OI based')}</div>${section('Option Chain',`<div class="table-toolbar"><div class="segmented"><button class="${state.mode==='oi'?'selected':''}" data-mode="oi">Open Interest</button><button class="${state.mode==='greeks'?'selected':''}" data-mode="greeks">Greeks</button></div><span>CALLS <b class="orange-text">●</b> &nbsp; PUTS <b class="blue-text">●</b></span></div>${state.mode==='oi'?optionTable(m.rows):`<div class="table-wrap"><table><thead><tr><th>CALL DELTA</th><th>CALL IV</th><th>CALL LTP</th><th>STRIKE</th><th>PUT LTP</th><th>PUT IV</th><th>PUT DELTA</th></tr></thead><tbody>${m.rows.map(r=>`<tr class="${r.strike===m.atm?'atm-row':''}"><td>${r.delta.toFixed(2)}</td><td>${r.iv}%</td><td>${r.ceLtp.toFixed(1)}</td><th>${money(r.strike)}</th><td>${r.peLtp.toFixed(1)}</td><td>${r.iv+2}%</td><td>${(r.delta-1).toFixed(2)}</td></tr>`).join('')}</tbody></table></div>`}`)}`); }
function maxPain() { const m=market(), rows=m.pains, min=m.maxPain; return shell('Max Pain',`${selectors()}<div class="metrics">${metric('MAX PAIN STRIKE',money(min.strike),'Lowest aggregate pain')}${metric('SPOT',money(m.base),'Current reference')}${metric('DISTANCE',`${Math.abs(m.base-min.strike).toFixed(0)} pts`,'From spot')}${metric('EXPIRY',state.expiry,'Selected series')}</div>${section('Max pain by strike',barChart(rows,'pain','#229bbb'))}<p class="method-note">Max pain is calculated from the illustrative open interest above. It is not a forecast or recommendation.</p>`); }
function strategic() { const m=market(), labels=['Long Buildup','Short Buildup','Short Covering','Long Unwinding']; return shell('Strategic Positioning',`${selectors('<label>PERIOD<select id="interval"><option>15</option><option>30</option><option>60</option></select></label>')}<div class="metrics">${labels.map((x,i)=>metric(x.toUpperCase(),`${12+i*3} stocks`,i<2?'Positions added':'Positions reduced',i%2===0)).join('')}</div>${section('Positioning matrix',`<div class="position-grid">${labels.map((label,i)=>`<article class="position-card"><span class="position-dot ${i%2?'blue':'orange-bg'}"></span><h3>${label}</h3><p>${['RELIANCE','TCS','SBIN','INFY','HDFCBANK'].slice(i,i+3).join(' · ')}</p><strong>${12+i*3}</strong><small>instruments</small></article>`).join('')}</div>`)}${section('Activity by symbol',rankTable())}`); }
function gammaMap() { const m=market(); return shell('Gamma Map',`${selectors()}<div class="metrics">${metric('NET GEX',`${((seed()%60)-24).toFixed(1)} B`,'Illustrative exposure')}${metric('GAMMA FLIP',money(m.atm-m.step),'Reference level')}${metric('CALL WALL',money(m.atm+3*m.step),'High call gamma')}${metric('PUT WALL',money(m.atm-2*m.step),'High put gamma')}</div>${section('Gamma exposure by strike',`<div class="gamma-chart">${m.rows.map((r,i)=>`<div><span>${money(r.strike)}</span><i style="width:${25+((i*17+seed())%70)}%;background:${i<8?'#229bbb':'#ff4d05'}"></i><small>${i<8?'-':'+'}${((i*17+seed())%75+12).toFixed(1)}</small></div>`).join('')}</div>`)}<p class="method-note">Exposure is simulated for interface demonstration.</p>`); }
function moverRows() { return market().ranked; }
function rankTable() { let rows=moverRows().filter(r=>r.symbol.includes(state.search.toUpperCase()));rows.sort((a,b)=>state.sort==='symbol'?a.symbol.localeCompare(b.symbol):state.sort==='volume'?b.volume-a.volume:state.sort==='price'?b.price-a.price:b.change-a.change);if(state.reverse)rows.reverse();return `<div class="table-wrap"><table><thead><tr><th><button data-sort="symbol">SYMBOL ↕</button></th><th><button data-sort="price">PRICE ↕</button></th><th><button data-sort="change">CHANGE ↕</button></th><th><button data-sort="volume">VOLUME ↕</button></th><th>ACTION</th></tr></thead><tbody>${rows.map(r=>`<tr><th>${r.symbol}</th><td>₹${money(r.price)}</td><td class="${r.change>=0?'up':'down'}">${r.change>=0?'+':''}${r.change}%</td><td>${money(r.volume)}</td><td><button class="row-link" data-symbol="${r.symbol}">Open dashboard</button></td></tr>`).join('')}</tbody></table></div>`; }
function topMovers() { let rows=moverRows(), gainers=rows.filter(r=>r.change>0), losers=rows.filter(r=>r.change<0);return shell('Top Movers',`${section('Near-month futures movers',`<p class="panel-sub">Ranked change in this illustrative market session.</p><div class="two-col"><div><h3 class="table-title up">Top gainers</h3>${miniMover(gainers)}</div><div><h3 class="table-title down">Top losers</h3>${miniMover(losers)}</div></div>`)}`); }
function miniMover(rows) { return `<div class="mover-list">${rows.map(r=>`<button data-symbol="${r.symbol}"><strong>${r.symbol}</strong><span>₹${money(r.price)}</span><b class="${r.change>=0?'up':'down'}">${r.change>=0?'+':''}${r.change}%</b></button>`).join('')}</div>`; }
function stocksRanked() { return shell('Stocks Ranked',`${section('Market rankings',`<div class="table-toolbar"><input id="stock-search" type="search" placeholder="Search symbols" value="${safe(state.search)}"><div class="segmented"><button class="${state.sort==='change'?'selected':''}" data-sort="change">Change</button><button class="${state.sort==='volume'?'selected':''}" data-sort="volume">Volume</button></div></div>${rankTable()}`)}`); }
function stockHistory() { const m=market(), count=({'1D':22,'1W':35,'1M':60,'3M':90})[state.range]||22, vals=m.history.slice(-count).map(row=>row.close);return shell('Stock History',`${selectors(`<label>RANGE<select id="range">${['1D','1W','1M','3M'].map(x=>`<option ${state.range===x?'selected':''}>${x}</option>`).join('')}</select></label>`)}<div class="metrics">${metric('SYMBOL',state.symbol,'Selected')}${metric('LATEST',`₹${money(vals.at(-1))}`,'▲ 1.24%')}${metric('HIGH',`₹${money(Math.max(...vals))}`,'Selected period')}${metric('LOW',`₹${money(Math.min(...vals))}`,'Selected period')}</div>${section(`${state.symbol} historical trend`,lineChart(vals,'#229bbb'))}${section('Historical observations',`<div class="table-wrap"><table><thead><tr><th>DATE</th><th>OPEN</th><th>HIGH</th><th>LOW</th><th>CLOSE</th><th>CHANGE</th></tr></thead><tbody>${vals.slice(-10).reverse().map((v,i)=>`<tr><th>${new Date(m.history.at(-1-i).date+'T00:00:00Z').toLocaleDateString('en-IN')}</th><td>${money(v-8)}</td><td>${money(v+12)}</td><td>${money(v-16)}</td><td>${money(v)}</td><td class="${i%2?'down':'up'}">${i%2?'-':'+'}${(i*.2+.5).toFixed(2)}%</td></tr>`).join('')}</tbody></table></div>`)}`); }
const pages={'/dashboard':dashboard,'/oi-ladder':oiLadder,'/oi-activity':oiActivity,'/option-chain':optionChain,'/max-pain':maxPain,'/strategic-positioning':strategic,'/gamma-map':gammaMap,'/top-movers':topMovers,'/stocks-ranked':stocksRanked,'/stock-history':stockHistory};
async function render() {
  const version = ++renderVersion;
  let p = route();
  if (p === '/m') p = '/dashboard';
  if (p === '/m/signin') p = '/signin';
  if (p === '/m/register') p = '/register';
  if (p === '/' || p === '/landing') app.innerHTML = landing();
  else if (p === '/forgot-password') app.innerHTML = forgotPage();
  else if (['/signin', '/register'].includes(p)) app.innerHTML = authPage(p.slice(1));
  else if (pages[p]) {
    if (!loggedIn() && backendSession === null) {
      try {
        const response = await fetch('/api/auth/session');
        backendSession = response.ok && (await response.json()).signedIn;
      } catch { backendSession = false; }
    }
    if (version !== renderVersion) return;
    if (!loggedIn()) { go('/signin?next=' + encodeURIComponent(p)); return; }
    try {
      await loadMarket();
      if (version !== renderVersion) return;
      app.innerHTML = pages[p]();
    } catch {
      app.innerHTML = `${publicHeader()}<main class="not-found"><h1>Dashboard data could not load</h1><p>Refresh the page to retry the demo API.</p></main>`;
    }
  } else app.innerHTML = `${publicHeader()}<main class="not-found"><h1>Page not found</h1><a class="pill orange" href="/landing" data-link>Return home</a></main>`;
  bind();
  if (location.hash) setTimeout(() => document.querySelector(location.hash)?.scrollIntoView(), 0);
}
function bind() {
  document.querySelector('#menu-toggle')?.addEventListener('click',()=>{state.menu=!state.menu;render()});
  document.querySelector('#signout')?.addEventListener('click',async()=>{await fetch('/api/auth/logout',{method:'POST'}).catch(()=>{});backendSession=false;sessionStorage.removeItem('owli-demo-session');go('/signin')});
  document.querySelector('#symbol')?.addEventListener('change',e=>{state.symbol=e.target.value;localStorage.setItem('owli-symbol',state.symbol);render()});
  document.querySelector('#symbol-input')?.addEventListener('change',e=>{const s=e.target.value.toUpperCase();if(SYMBOLS.includes(s)){state.symbol=s;localStorage.setItem('owli-symbol',s)}render()});
  document.querySelector('#per-lot')?.addEventListener('change',e=>{state.perLot=e.target.checked;render()});
  document.querySelector('#strikes')?.addEventListener('change',e=>{state.strikes=Number(e.target.value);render()});
  document.querySelector('#expiry')?.addEventListener('change',e=>{state.expiry=e.target.value;render()});
  document.querySelector('#interval')?.addEventListener('change',e=>{state.interval=e.target.value;render()});
  document.querySelector('#range')?.addEventListener('change',e=>{state.range=e.target.value;render()});
  document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{state.mode=b.dataset.mode;render()}));
  document.querySelectorAll('[data-sort]').forEach(b=>b.addEventListener('click',()=>{state.reverse=state.sort===b.dataset.sort?!state.reverse:false;state.sort=b.dataset.sort;render()}));
  document.querySelectorAll('[data-symbol]').forEach(b=>b.addEventListener('click',()=>{state.symbol=b.dataset.symbol;localStorage.setItem('owli-symbol',state.symbol);go('/dashboard')}));
  document.querySelector('#stock-search')?.addEventListener('input',e=>{state.search=e.target.value;const pos=e.target.selectionStart;render();const input=document.querySelector('#stock-search');input.focus();input.setSelectionRange(pos,pos)});
  document.querySelector('#demo-access')?.addEventListener('click',()=>{sessionStorage.setItem('owli-demo-session','yes');go(nextPath())});
  document.querySelector('#auth-form')?.addEventListener('submit',handleAuth);
}
async function handleAuth(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const email = String(data.get('email') || '').trim().toLowerCase();
  const password = String(data.get('password') || '');
  const message = document.querySelector('#auth-message');
  if (form.dataset.kind === 'forgot-password') {
    message.textContent = 'Password recovery is unavailable for demo accounts. Create another demo account to continue.';
    return;
  }
  const endpoint = form.dataset.kind === 'register' ? 'register' : 'login';
  try {
    const response = await fetch(`/api/auth/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const result = await response.json();
    if (!response.ok) { message.textContent = result.error || 'Account request failed.'; return; }
    backendSession = true;
    go(endpoint === 'register' ? '/dashboard' : nextPath());
  } catch {
    message.textContent = 'The demo API is unavailable. Try again shortly.';
  }
}

render();

