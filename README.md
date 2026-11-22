# Owli interface clone

This is an independent, responsive implementation of the public Owli landing page and the route structure visible in its shipped web bundle. It is a **demo product**, with deterministic illustrative market data. The original dashboard requires sign-in, and its market API returns HTTP 401 without an account, so the private screens and analytics cannot yet be verified against the live product.

## Run

```sh
npm install
npm run dev
```

Open the local URL shown by Vite. Use **Explore demo dashboard** on the sign-in page, or create a browser-local demo account. Demo accounts and preferences stay in this browser. They are not production authentication.

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
- No calls are made to Owli's private API. Live exchange data, real account authentication, Google sign-in, and exact private-screen parity require a test account, API contract, and authorized market-data feed.
- The interface labels demo data prominently and does not present it as trading advice.

Build for static deployment with `npm run build`. A host serving deep links must fall back to `index.html`.
