# Product notes — financial wealth test (Bulgaria)

Feedback and open questions from the initial concept discussion, 22 July 2026.
Ordered roughly by how much each item could hurt the launch.

## Risks to settle before launch

### 1. The regulatory line

"Advice" in a paid report is exactly where this stops being a quiz and starts looking
like investment advice under ЗПФИ / MiFID II. The safe shape for v1: **diagnose and
educate, never recommend a product.**

- Fine: "your reserve should be €12,000 and you have €3,000"
- Fine: "consolidating these two loans would free roughly €90/month"
- Not fine: "put it in fund X", "buy this ETF", "switch to this pension provider"

Disclaimer belongs in the footer *and* inside the report itself. Worth deciding now
that a future copywriter is not allowed to soften it.

### 2. GDPR

The moment an email is attached to income, debt and insurance answers, that is personal
data — and the insurance question brushes against special-category data. Needed before
launch, not after:

- privacy policy and a stated lawful basis
- a processor agreement with the host
- a cookie/consent approach that defaults to declining non-essential

Cheapest structural mitigation: store quiz answers in an anonymous row, and only link an
email to it when the person explicitly asks for the report.

### 3. Refunds

EU digital-goods rules grant a 14-day withdrawal right unless the buyer explicitly
waives it at checkout. Either add the waiver checkbox, or just offer a no-questions
refund — at €19 the goodwill is worth more than the leakage. The prototype currently
promises a refund.

## Build advice

### Do not build the paid report engine for v1

This is the strongest recommendation here. Sell the €19 report, then **hand-write the
first 20–30** from a template using the person's answers. Roughly 20 minutes each. It
tells you which sections people actually care about, and you learn whether anyone pays
before spending two months automating a report nobody buys.

### Peer comparison is the sharpest hook, and a bootstrapping problem

"Better than 52% of Bulgarians aged 30–39" is the line people screenshot. But there is
no data on day one. Seed it from NSI / BNB / Eurostat figures, be honest that it is a
model, and swap to real data after a few hundred completions.

That dataset then becomes a PR engine in its own right — an annual "State of Bulgarian
personal finance" report earns press coverage that ad spend cannot buy.

### Statistics — verified 28 July 2026

All figures were checked against primary sources. Results:

**Landing-page statistics** (were design-supplied; two confirmed, one replaced):

- **45,6%** cannot face an unexpected expense — **CONFIRMED** via the Eurostat API
  (`ilc_mdes04`, 2024): Bulgaria = 45.6%, EU average 30.0%. "Highest in the EU" is true
  *for member states* — Bulgaria is #1 of the 27 (Latvia 45.3%, Greece 43.9% next). North
  Macedonia (45.8%) is higher but is a candidate, not a member. Prototype now says
  "highest among EU member states" to keep it airtight.
- **73% don't save** — **CONFIRMED**. Тренд survey, 3–10 Dec 2024, n=1005 (reported by
  bTV, Investor.bg). Only 24% save, 8% invest. Wording tightened to "не спестяват нищо".
- **78,6% rely on the state pension** — **COULD NOT BE SOURCED**; appears fabricated /
  misattributed by the design tool. **Replaced** with a verified figure from the same
  Тренд survey: **84% rely solely on income from salary or pension**.

**Analyst-file statistics** — all confirmed:

- EU household saving rate **~14,5%** (2024) — CONFIRMED (Eurostat; EU 14.5%, euro area 15.2%).
- BG **24% save / 73% don't** — CONFIRMED (Тренд, as above).
- **BNB rates, June 2026** — CONFIRMED **exactly** from the primary BNB press-release PDF:
  housing 2.41% (APR 2.75%), consumer 8.76% (APR 9.06%), other 4.64%, overdraft 13.20%,
  credit cards 21.16%. Every figure in the xlsx matches. ⚠️ These are a June-2026 snapshot
  and the spec itself says refresh monthly — re-pull before each release from
  bnb.bg → Статистика → Лихвена статистика.
- **DSTI-O**: 50% regulatory ceiling on new mortgages (in force 1 Apr 2024) and weighted
  DSTI-O **36.8%** in Q4 2024 — CONFIRMED (BNB press release PR_20250317).

Net: everything the analyst put in the file held up. The only bad number was the OECD
pension stat, which came from the design tool, not the analyst.

### Funnel details that matter

- Capture the email **after** showing the score, not before. Someone who has just seen
  a number they dislike is far more motivated than someone who has not.
- One question per screen, with a progress bar and a working back button.
- Analytics on **per-question drop-off**. Learning that question 7 kills 40% of the
  funnel is the most valuable thing available in month one.

## Scope for v1

**In:** landing page, 14-question quiz, instant free score, email capture, paid offer,
manually produced paid report.

**Explicitly out:** user accounts, PDF generation (a unique link to an HTML report is
enough), any second language, bank connections, dashboards, re-testing over time.

## The open question

**How do people find this?** A single-page site converts traffic; it does not create it.
Worth deciding early:

- finance creators on TikTok / Instagram
- employer partnerships — HR buying it as a staff benefit is a real B2B path, and
  probably a larger one than direct sales
- bank or insurance affiliate deals, with the caveat that these pull hard against the
  regulatory line above

And the related one: is the €19 report the business, or is it the qualifier for a €150
consultation? The answer changes what the report should end with.

## Files here

- `prototype.html` — clickable prototype, full flow, Bulgarian, mobile-first. Implements
  the Finograf design; fonts are inlined so it works offline and behind a strict CSP.
- `SCORING-MODEL.md` — the six-pillar model: formulas, weights, calibration tests. v2,
  merged with the design handoff. **Source of truth over both the prototype and the
  design file.**
- `DESIGN-BRIEF.md` — the brief that was sent to Claude Design. Superseded by the design
  itself (below); kept as a record of what was asked for.

## The design

Brand name: **Финограф / Finograf**. Design lives in Claude Design, project
`b1c03e5e-f402-43d1-8f99-f0c85e5f9e6b`, files `Finograf.dc.html` (resolved full flow) and
`Finograf Options.dc.html` (the variant exploration behind it).

System: Literata for headings, IBM Plex Sans for text, IBM Plex Mono for every number,
percentage and label. Petrol as brand colour, brass as second accent; green/amber/red
used only for result states, never decoratively. No cards — hairlines and vertical rhythm.

Two things the design added that were not in the brief and are worth keeping: dual
EUR/BGN pricing (€19 / 37,16 лв.), and a free re-test after six months as a paid-tier
benefit — that one quietly turns a one-off purchase into a reason to come back.
