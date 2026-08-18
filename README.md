# Simple Trade — Decibel "Copy-Trade Lite"

A deliberately plain trading app on Decibel, **Aptos testnet only**, plus a
copy-trade signal feature. Pick a market, pick a direction, pick a dollar
amount, press one button — or copy somebody else's trade idea with one click.

## Video
https://drive.google.com/file/d/1U2ZSDKtDvgf_bWcOUjo75lokutSW3pKt/view?usp=sharing

## App Live
https://decibel-challenge-misc34zmy-david-ruizs-projects-5158fd46.vercel.app/
It's not going to persist the signals on live due to the json file, but in the video is evidence of the correct behavior 

## Run it

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev
```

| Variable | What it is |
|---|---|
| `APTOS_API_KEY` | Aptos Labs (Geomi) key. Authenticates the fullnode *and* Decibel's REST API — they are one credential, not two. |
| `API_WALLET_PRIVATE_KEY` | The wallet that signs. Holds APT for gas, no collateral. AIP-80 format (`ed25519-priv-0x…`). |
| `API_WALLET_ADDRESS` | That wallet's address. Not read by the app; used for the lookup below. |
| `DECIBEL_SUBACCOUNT_ADDR` | The **trading account** holding the USDC. Not the wallet — see below. |
| `BUILDER_SUBACCOUNT_ADDR` | Builder code recipient. Must also be a trading account, not a wallet. |
| `BUILDER_MAX_FEE_BPS` | Fee ceiling in basis points. `10` = 0.1%. |


## What works

Everything below was run against real testnet, not asserted from the docs.

| Task |
|---|
| **MUST 1** — connect with a key from env |
| **MUST 2** — real trade via builder codes, approve then place |
| **MUST 3** — simple trade screen |
| **MUST 4** — balance/equity, positions with PnL, open orders |
| **SHOULD 5** — post an idea, entry from the SDK |
| **SHOULD 6** — chart with entry/TP/SL lines |
| **SHOULD 7** — one-click copy with builder code |
| **SHOULD 8** — persist and list signals | 

The order path was proven in the safe order: approve → rest a limit far from the
market → confirm it rests → cancel → confirm it clears → only then a filling
order.

### Not done

- **No STRETCH goals.** Polling rather than WebSocket, no outcome marking, no
  leaderboard. The brief says to stop and polish rather than bolt on features.
- **Signal outcomes are not tracked.** A signal stores its levels and expiry;
  nothing reads back whether it hit TP or SL, so the list shows ideas rather
  than a scored track record.

### With another day

Mark signal outcomes by reading fills back against each signal's TP/SL — it is
the difference between a list of ideas and a track record, and it is what makes
an author leaderboard mean anything. After that, the WebSocket relay: subscribe
server-side and push to the browser, since the socket authenticates with the API
key as a subprotocol and subscribing from the browser would ship that key to
every visitor.

## Decisions worth naming

**Dollars, not coin sizes.** The brief asks for a size and says a smart
12-year-old should manage it. "$25 of Bitcoin" is readable; "0.0004 BTC" is not,
and the market minimum is 0.00002 BTC. The step names its unit and shows the
size it buys, so nothing is hidden.

**Up/Down, not Buy/Sell.** Decibel is perps: you never hold the coin, and
"selling" opens a short. Calling it Buy/Sell let people short an asset while
believing they were selling holdings.

**Chain units are converted before rounding.** `tick_size`, `lot_size` and
`min_size` arrive already in chain units, so the conversion happens first and
the snap happens there. `Math.round` throughout — `0.29 * 1e6` is
`289999.99999999994`, and flooring loses a tick.

**Hand-rolled SVG chart.** A price line plus three horizontal rules did not
justify a charting dependency.

## How this was built, and what I changed after reviewing it

I used AI to get a starting point — the Next.js scaffold, the SDK wiring, and a
first pass at each screen — then read through the files and corrected what it had
got wrong. The corrections below are the ones that mattered.

**Wrong because the docs and the brief's snippet are wrong.** Found by probing
testnet rather than trusting either:

- `getBySubaccount` does not exist anywhere in the SDK — it is
  `getByAddr({ subAddr })`. Several readers take an object where the snippet
  passes a positional argument, and both clients 401 without `nodeApiKey`.
- `read.markets.getByName()` returns **null for every input**, including the
  exact name the SDK's own `marketNameByAddress()` hands back, so market lookup
  goes through `getAll()`. `getAllSpot()`, which the docs list, is not in the
  installed version at all.
- `"0x" + addr.padStart(64, "0")` double-prefixes an address that already starts
  with `0x`. Stripped first here, and asserted.
- The chain **does** enforce `builderFee <= maxFee`: an order carrying 25 bps
  against an approved 10 aborts with `EINVALID_MAX_FEE`. My notes said the
  opposite, and the safety note was rewritten once I tested it.

**Wrong in the generated app, found reading it.** These are mine:

- **It described perps as if they were spot.** I sold an asset I owned none of
  and the screen still said "What you own" and "130 bought" over a short
  position. Renamed throughout to Up/Down bets, with shorts shown as "sold
  short" and the down option explaining that you hold none of the asset.
- **The balance never moved after placing a bet**, because opening a position
  reserves margin rather than spending money. Equity, settled balance and
  free-to-bet are now three labelled numbers whose arithmetic adds up.
- **Dark mode was unreadable** — buttons and selects do not inherit text colour,
  so hardcoded white surfaces produced white-on-white controls.
- **Both screens were single 400-line files with inline styles**, and Tailwind
  was not installed at all despite the styling reading as though it were.
  Split into components; Tailwind added and the theme driven by variables.
- **Open bets reordered on every poll** — six consecutive polls returned six
  different orders — so a row could move under the cursor between aiming and
  clicking. Now sorted server-side.
- **A "Waiting orders" box that could never fill**, because every bet placed
  from the screen was immediate-or-cancel. Now hidden when empty, and the screen
  can place a bet that waits.
- **`/api/candles` silently defaulted to Bitcoin** when its market parameter was
  missing, so a missing parameter would have drawn a Bitcoin price line under
  another market's entry and stop loss. Now a 400.
- **The chart always showed the last 24 hours** regardless of when the idea was
  posted, so an older idea's entry line sat outside the visible range and the
  price line could never meet it. It now spans the idea's life.
- **"How much do you want to risk?"** was my wording, not the brief's — it asks
  to pick a size. Renamed, and the coin amount the dollars buy is shown.
- Dead code and inconsistency: three API routes nothing called, `Number()`
  coercions on values that were already numbers, a draft validated twice, and
  types scattered across three files with no rule about where they live.


## Safety note

**The biggest risk is the signing key leaking into the browser.** A private key
that ships in client JavaScript is unrecoverable — everyone who loaded the page
already has it — and in Next.js the boundary is one careless import away, since a
`lib/` module looks identical whether a route handler or a component imports it.
So the guard is structural rather than a convention: `lib/decibel.ts`,
`lib/orders.ts` and `lib/store.ts` each `import 'server-only'`, which fails the
**build** if a client component pulls them in, instead of failing quietly at
runtime. I verified it by deliberately importing the signing account into a
component — the build stopped with *"You're importing a module that depends on
server-only"* rather than producing a bundle. No variable is named
`NEXT_PUBLIC_*` (the only way Next inlines an env var into client code), every
`.env*` variant is gitignored except the placeholder template, and a search of
the built client chunks, the served HTML and every commit finds zero occurrences
of either secret — with a positive control confirming the same search does find
them in `.env.local`.

