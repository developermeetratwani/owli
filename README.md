# Owli interface clone

This is an independent, responsive implementation of the public Owli landing page and the route structure visible in its shipped web bundle. It is a **demo product** with a local backend and deterministic illustrative market data. The original dashboard requires sign-in, and its market API returns HTTP 401 without an account, so private screens and analytics cannot yet be verified against the live product.

## Run

```sh
npm install
npm run dev
```

Open the local URL shown by Vite. Use **Explore demo dashboard** on the sign-in page, or create a local demo account. Accounts are stored by the local server; browser preferences remain on this device. This is not production authentication.

The local API runs in the same Vite server. It provides market snapshots, option chains, OI activity, max pain, Greeks, gamma, movers, history, signals, and demo registration and sign-in. Password hashes are stored in `.data/accounts.json`; sessions are held in memory and reset when the server restarts. The API uses no live market feed.

Copy `.env.example` to `.env` if you want to record future market-data or Google OAuth credentials. The fields are intentionally blank. A provider adapter and OAuth callback must be built before those keys can enable live data or Google sign-in.

## Included routes

| Public | Market workspace |
| --- | --- |
| `/landing` | `/dashboard` |
| `/signin` | `/oi-ladder` |
| `/register` | `/oi-activity` |
| `/forgot-password` | `/option-chain` |
| | `/max-pain` |
| | `/strategic-positioning` |
| | `/gamma-map` |
| | `/top-movers` |
| | `/stocks-ranked` |
| | `/stock-history` |

The original bundle also exposes `/m`, `/m/signin`, and `/m/register`; these resolve to the responsive dashboard and auth views here.

## Scope and next integration

- All listed views are navigable and responsive. Symbol, expiry, interval, range, chain tab, stock search, and sorting controls work against demo data.
- The landing page is modeled on the live public page. The workspace is an inferred interface because the real dashboard is protected.
- The frontend calls its own `/api` backend. It does not call Owli's private API. Live exchange data, production authentication, Google sign-in, and exact private-screen parity require a test account, API contract, and authorized market-data feed.
- The interface labels demo data prominently and does not present it as trading advice.

Build for static deployment with `npm run build`. A host serving deep links must fall back to `index.html`.
