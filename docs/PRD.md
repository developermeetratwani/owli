# Owli.pro product analysis and reconstruction PRD

**Status:** Evidence-based draft

**Observed:** 23 November 2026

**Purpose:** Describe what Owli.pro appears to do and define a buildable product target for this repository.

## Executive summary

Owli.pro presents itself as an options and futures market-reading workspace for retail traders. Its public landing page says it makes options data easier to understand and emphasizes the idea that “markets go where options flow.” The signed-in web bundle contains views for open interest (OI), an option chain, max pain, strategic positioning, gamma exposure, stock rankings, and related market signals. Users appear to select an underlying symbol and expiry, then compare price, OI, call/put positioning, and derived indicators. The product is an analysis interface; the inspected browser bundle did not establish an order-placement workflow.

The actual private dashboard cannot yet be visually verified: opening `/dashboard` without an account redirects to sign-in, and the market API rejects unauthenticated requests. The functional descriptions below distinguish the public page, shipped browser code, and our reconstruction choices. They do not claim access to Owli's private server implementation or live data contracts.

## Evidence and confidence

| Source | What it establishes | Limit |
| --- | --- | --- |
| [Public landing page](https://owli.pro/landing) | Product positioning, public copy, beta access, feature themes | Marketing copy does not prove signed-in behavior |
| [Sign-in page](https://owli.pro/m/signin) and [registration page](https://owli.pro/m/register) | Email/password entry, Google sign-in affordance, account creation and password recovery links | We did not use a signed-in account |
| [Shipped browser bundle](https://owli.pro/assets/index-DlILPg_2.js), inspected on 23 November 2026 | Route names, page component labels, client-side calculations, and requested API paths | Shipped client code does not reveal private server code, response guarantees, entitlement rules, or executed behavior |
| [Current local implementation](../README.md) | What this repository currently runs | It is a demo reconstruction, not evidence of Owli's private behavior |

## Product goals

1. Let a trader inspect a symbol's options and futures context in one workspace.
2. Make strike-level OI, intraday OI changes, call/put balance, price context, and derived readings legible without manual spreadsheet work.
3. Support deeper analysis through focused views for option chain, max pain, positioning, gamma, movers, and history.
4. Make data freshness, source, selected expiry, units, and unavailable states clear on every view.

## Users and primary jobs

| User | Job |
| --- | --- |
| Retail derivatives trader | Choose NIFTY, BANKNIFTY, or another available symbol and read current positioning around the active expiry. |
| Market researcher | Compare OI and price over time, inspect individual strikes, and review ranked stocks or movers. |
| New options learner | Understand the meaning of OI, PCR, max pain, Greeks, and gamma through clear labels and context. |

These are intended users inferred from the public positioning and bundle labels; Owli has not provided its own persona document.

## Core user flow

1. Visitor lands on the public page and requests beta access or signs in.
2. Authenticated user opens the dashboard and selects a symbol, expiry, strike count, and lot-size display.
3. Dashboard shows a futures price summary and a three-column market workspace: intraday OI activity and pulse; an OI ladder and leading changes; market breath, volume profile, and market read.
4. User opens a specialized view, keeps symbol and expiry context where relevant, and examines the underlying table or chart.
5. User can move back to the dashboard or select another symbol without losing their current context.

Steps 2–4 are derived from shipped UI components; their exact signed-in appearance and transitions need validation with an authorized account.

## Feature requirements

### P0 — Account and navigation

- Public landing page with About, Features, Pricing, Learn, and beta-access navigation.
- Email/password registration and sign-in, Google sign-in when configured, password recovery when an email service is configured, and sign-out.
- Protected workspace routes; unauthenticated users are redirected to sign-in and returned to the requested page after authentication.
- Desktop navigation for Dashboard, OI Ladder, OI Activity, Option Chain, Max Pain, Strategic Positioning, Gamma Map, and Stocks Ranked. The bundle also contains top-movers and stock-history experiences.
- A mobile layout that preserves access to the same core information.

### P0 — Market dashboard

- Symbol selector with contract search and supported lot size; expiry selector; strike-count control.
- Futures quote showing price, change, daily high/low, last update, and market status.
- Intraday OI activity with timestamped call and put changes; a separate OI pulse summary.
- Strike-level ladder with total OI, strike, build-up indication, and put/call ratio (PCR); a leading OI-change section.
- Market breath including net put writing, writing flow, OI walls, PCR, overall call/put OI, and implied-volatility context.
- Volume profile and a market-read section. Each calculated reading must show its source inputs, unit, timestamp, and unavailable state.

### P1 — Specialist analysis

| View | Required behavior |
| --- | --- |
| OI Ladder | Compare call and put positioning by strike; mark the at-the-money (ATM) area and support expiry changes. |
| OI Activity | Show time-based OI changes and strike detail; allow interval selection. |
| Option Chain | Show calls and puts around strikes, including OI, OI change, price, and a Greeks view. |
| Max Pain | Show the calculated minimum-pain strike, comparison with spot, and a history or tracker where data exists. |
| Strategic Positioning | Group instruments by long/short build-up, short covering, and long unwinding, with a selectable period. |
| Gamma Map | Show per-strike and net gamma exposure, gamma-flip and wall levels when supported by data. |
| Stocks Ranked and Top Movers | Rank and filter instruments, with a path back to symbol-level analysis. |
| Stock History | Show price history and tabular observations over selectable ranges. |

### P0 — Data and backend behavior

- Define a market-data provider adapter. Keep provider URL and API keys in server-side configuration; never send keys to the browser or commit them.
- Normalize contract symbols, expiries, futures prices, option-chain rows, minute totals, OI comparisons, Greeks, gamma, volume profile, max pain, rankings, and signals into documented API responses.
- Validate symbol, expiry, range, and request size. Return clear loading, no-data, stale-data, and provider-error states.
- State whether a value is live, delayed, historical, or simulated. Do not label simulated values as live.
- Use authenticated sessions for private data. Apply authorization and rate limits appropriate to the eventual provider contract.
- Make formula inputs and assumptions explicit for PCR, max pain, gamma exposure, walls, and positioning classifications. A client-side label alone is not proof of the original calculation method.

The shipped client requests endpoint families under `/api/contracts`, `/api/market`, `/api/optionchain`, `/api/oi`, `/api/maxpain`, `/api/greeks`, `/api/signals`, `/api/stocks`, and `/api/users`. These names guide the reconstruction; the private server's exact schemas, freshness, formulas, and permission rules remain unverified.

## Success criteria

- A user can register, sign in, select a symbol/expiry, inspect dashboard and specialist views, and sign out without broken navigation.
- Dashboard figures reconcile with the underlying API rows and displayed units; selector changes update all dependent views consistently.
- Every data-bearing screen visibly identifies simulated, delayed, stale, or live status and handles missing data without invented values.
- Authenticated deep links work after refresh. Private endpoints reject unauthorized requests.
- Desktop and mobile layouts pass visual review against authorized screenshots of the original where parity is required.
- Backend integration tests cover market responses, calculations, authentication, and invalid inputs; browser checks cover the main user flow.

## Current repository state and gaps

This repository currently includes a Vite frontend and local Node API with deterministic demo market data, local email/password demo accounts, and the route names observed in the bundle. Empty credential fields are provided in [`.env.example`](../.env.example). The local API implements endpoint families exposed by the browser bundle, but its response shapes and calculations are independent approximations. Google sign-in, email password recovery, live provider integration, production session storage, and verified private-screen parity are outstanding.

## Validation needed before calling this an exact clone

1. Authorized screenshots or a test account for the real dashboard and each specialist view.
2. The market-data provider contract, licensed usage rights, sample payloads, units, refresh intervals, and failure behavior.
3. Formula definitions for market breath, signals, gamma, positioning, and max pain.
4. Real auth and entitlement rules, including Google OAuth, password recovery, and account lifecycle.
5. Product owner's decision on which features are essential for launch versus beta-only or future work.

Until those inputs are available, this PRD describes the observable product and a testable reconstruction target, not a verified specification of Owli's private backend.
