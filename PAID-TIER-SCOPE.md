# Paid tier — scope

The €19 tier runs the **full analyst methodology**: the complete debt-health engine with
live BNB rate benchmarking, real net worth and diversification, a pension gap, and a
12-month plan with real numbers. It's the depth people pay for. This document scopes the
flow, the fields, the scoring it unlocks, the deliverables, and the decisions still open.

Source of truth for every field and rule: `methodology-source.xlsx` / `METHODOLOGY.md`.
Free-tier behaviour: `SCORING-MODEL.md` (v3).

## Design principle

**85 is the ceiling, not what any one person answers.** The catalogue is 111 fields (85 in
the analyst's "quick" model); most are *conditional* — shown only on a trigger — or
*repeating* (per loan / card / mortgage / asset class). A debt-free renter answers ~30; a
typical mortgaged household with a loan and a card answers ~50; only a genuinely complex
balance sheet approaches 80. And the ~17 the free quiz already collected are **pre-filled,
not re-asked**.

## Field decomposition (from the catalogue)

**Always shown (~33 base fields).** Setup (scope, period, currency), demographics (age,
dependants, employment, housing), retirement horizon, employment income + income stability,
core monthly expenses (utilities, food, transport, health, internet, total debt payments,
non-essential, annual irregular), savings block (current accounts, deposits, emergency
portion, monthly savings), pension-fund assets, payment discipline + ЦКР self-report,
retirement standard, main goal, and the behaviour/wellbeing questions.

**Conditional (~52 fields), gated by a trigger:**

| Trigger | Fields unlocked |
|---|---|
| Renter | rent |
| Owner | property tax, maintenance, main-home value |
| Has a mortgage | *per mortgage*: balance, rate, payment, rate type, remaining term |
| Has other loans | *per loan*: type, balance, rate, payment, term, secured/unsecured |
| Has credit cards | *per card*: balance, limit, rate, min payment, repayment behaviour |
| Uses an overdraft | used amount, rate, usage pattern |
| Reported a delinquency | longest delinquency period (severity → score cap) |
| Variable income | bonus/commission, business, lowest-usual-month |
| Other income | pension, rent, interest/dividends, other |
| Has investments | *per class*: stocks, ETFs, mutual funds, bonds, crypto, metals, other |
| Has a business | equity stake value |
| Holds insurance | *per policy*: sum insured, premium, expiry |
| Has dependants | childcare/education/dependant costs |
| Measurable goal | target amount, amount saved, timeline |

**Repeating groups** — mortgages, loans, cards, investment classes, insurance policies each
use an "add another" pattern with a running count. These are what let the debt-health engine
score *each contract* against its BNB benchmark.

**Net new questions vs the free tier:** the free quiz asked aggregates (one "essential", one
"debt payment", one "investments" figure). The paid deep-dive **decomposes those aggregates**
— it pre-fills the total and asks the user to split it per instrument/class. For a typical
mortgaged household that's ~25–35 genuinely new answers, most of them the per-loan and
per-asset detail the free tier couldn't ask for.

## Recommended flow

```
Landing → free quiz (~17) → free result + paywall
                                   │
                              [ PAYMENT ]        ← money first (see Decision 1)
                                   │
                    deep-dive questionnaire (sectioned, pre-filled, save/resume)
                                   │
                    full report (web) + PDF + email → 6-month re-test reminder
```

**Pay before the deep-dive, not after.** Rationale: the free result already delivered the
"aha" and the sample report showed exactly what €19 buys, so the paywall converts on the
promise, not on making them work first. Asking 85 questions *before* payment gives the
premium analysis away free and creates a huge pre-payment abandonment surface. Once someone
has paid, they finish. (Alternative — answer-first, pay-at-report — is lower friction to
*complete* but gives away the deep value and invites bail-at-checkout after all that work.
This is Decision 1 below; I recommend pay-first.)

## Making 85 fields not feel like 85

- **Pre-fill from the free quiz.** Show those answers as confirm-not-retype.
- **Section by the analyst's groups** with a progress map: Доходи · Разходи · Дългове ·
  Активи · Защита · Пенсия · Цели. Each section is a short screen set, not one wall.
- **Conditional disclosure.** Never show rent to an owner, or a per-loan block to someone
  with no loans.
- **"Add another"** for mortgages/loans/cards/assets, with a live count and running totals.
- **Save & resume via a magic link** (no account). Essential — people will finish a form
  this long across two sittings.
- **Skippable with a "provisional" mark.** The methodology already defines предварителна
  оценка for missing data — a skipped field marks that component provisional rather than
  blocking the report. This is the pressure-release valve that keeps completion high.
- **Explicit units** (monthly vs annual, currency) and inline validation.

## What the paid tier unlocks in scoring

Everything `SCORING-MODEL.md` v3 marked "paid only" becomes real:

- **Debt health — full 5-part engine.** Cost-of-debt index per contract vs the live BNB
  benchmark, weighted annual interest cost, potential refinance saving, card utilisation +
  repayment behaviour, overdraft depth + usage pattern, and the ЦКР delinquency **cap ladder**
  (74 / 59 / 39 / 19 by severity and recency). The free tier only did payments-to-income +
  debt-to-assets + a binary discipline flag.
- **Cash flow — real breakdown.** Essential sub-categories, annual-irregular ÷ 12, insurance
  and voluntary-pension contributions separated so nothing is double-counted.
- **Wealth — true net worth and diversification.** Assets − liabilities, liquid net worth,
  and concentration across asset classes (the free tier had a single investments figure).
- **Retirement — a pension gap.** Years-to-retirement + pension assets + desired income →
  a rough shortfall, instead of the free tier's pension-status lookup.
- **Protection — adequacy, not a count.** Sum-insured vs need, not just "N of 5 policies".
- **Behaviour/wellbeing** — the three subjective scales (control, confidence, stress),
  shown separately from the objective score as the analyst specifies.

## Report deliverables

The analyst already wrote the layouts (sheets *Отчет паричен поток*, *Отчет дългово здраве*).
The paid report is: overall 8-component summary → per-component result + conclusion + one
lead recommendation → "where you are / where you should be" targets → **BNB benchmarking
table** (your rate vs market, per contract, with potential saving) → 12-month plan in three
phases → priority action list. All euro. **Web view + downloadable PDF**, both from the same
generated data.

## What this forces that the free tier avoided

The free tier is a **static, client-only page** (localStorage, no server). The paid tier
can't be — it needs, and these are real costs:

1. **A payment processor** (Stripe or similar). *I scope this but do not set up payment
   collection myself* — the team wires the processor and its keys. EU digital-goods
   14-day withdrawal right applies (waiver checkbox at checkout, or honour the refund —
   the prototype already promises 14 days).
2. **Server-side state** — save/resume, generating and storing the report, emailing the
   PDF and the magic link.
3. **GDPR step-up.** This tier collects far more financial detail, ties it to an email and a
   payment, and *stores* it. That needs the lawful basis, a retention policy, and processor
   agreements in place **before** launch — the single biggest non-obvious cost here. See
   NOTES.md.
4. **Monthly BNB rate refresh.** The debt-health score depends on current benchmarks. For
   v1, a **manual monthly config update** (one number per loan type) is safer than scraping
   bnb.bg. The report already shows the reference month.
5. **The ЗПФИ / advice line gets closer.** Specific target numbers and a dated plan are fine
   as *diagnosis*; naming products or providers is not. Keep it diagnostic.

## Build phases

- **P0 — Decide** flow, payment placement, data model. (Decisions below.)
- **P1 — Deep-dive engine.** ✅ **Prototype built** (`deep-dive-prototype.html`):
  conditional disclosure, repeating groups, pre-fill, save/resume, reconciliation. What's
  left to production-harden: real magic-link resume (needs P4 server), field validation,
  and wiring the collected data object into P2.
- **P2 — Full scoring engine.** Port the analyst's two sub-engines faithfully — cost-of-debt
  vs BNB, utilisation, ЦКР caps, net worth, pension gap. **The heaviest, highest-value work.**
- **P3 — Report generator.** Web + PDF from one data object.
- **P4 — Server.** Payment, persistence, email, magic-link resume.
- **P5 — Ops & legal.** BNB refresh mechanism, GDPR/retention, refund handling.

Heaviest lifts: **P2** (scoring fidelity) and **P4** (server + payment). P1 and P3 build on
what exists.

## A cheaper path to the same validation

NOTES.md still recommends **hand-authoring the first 20–30 paid reports** from a template
before building P2–P5. That advice stands and this scope doesn't override it: sell the €19
report, collect the deep answers via a simple form (even the free-tier flow plus a follow-up
questionnaire), and **write the first cohort by hand** (~20 min each). You learn which
sections buyers actually value before spending weeks automating the debt engine. Automate
P2–P5 only once demand is proven. A sensible sequencing: **P1 (nice input flow) + hand-authored
reports → validate → then P2/P3 automation → then P4/P5 scale.**

## Paid-v1 subset (don't build all 85 first)

Even automated, the paid **v1** doesn't need every field. What justifies €19 over the free
score is: (a) the full debt-health engine with BNB benchmarking, (b) real net worth +
diversification, (c) the pension gap, (d) the plan with real numbers. That's ~30–40 added
fields — the per-loan/card/overdraft blocks, the asset breakdown, retirement horizon +
desired income, and goal progress. **Defer to paid-v2:** the wellbeing scales, per-policy
insurance expiry dates, commercial/agricultural property, and the detailed expense
sub-categories. Ship the differentiators first.

## Decisions for you

1. **Payment placement** — pay-first (recommended) vs answer-first/pay-at-report. Shapes the
   whole flow, save/resume, and refund exposure.
2. **Report delivery** — web link, PDF, or both (recommend both).
3. **Save/resume** — magic-link (recommended, no accounts) vs full accounts.
4. **BNB refresh** — manual monthly config (recommended for v1) vs automated scrape.
5. **Build vs hand-author first** — automate P2–P5 now, or validate with hand-written reports
   first (recommended). 
6. **v1 field scope** — the ~30–40 differentiator subset (recommended) vs all 85.

## Files

- `deep-dive-prototype.html` — **P1 built (28 Jul 2026)**: the deep-dive input
  flow prototype. Demonstrates pre-fill from the free quiz, sectioning + progress,
  conditional disclosure, repeating "add another" groups (mortgages/loans/cards/asset
  classes) with an inline editor, running-total reconciliation, skip→provisional, and
  save/resume. Scoring (P2) is intentionally out of scope — it ends on a "data collected"
  review. Fonts inlined; works offline.
- `PAID-TIER-SCOPE.md` — this document.
- `SCORING-MODEL.md` — free-tier model (v3); its "paid only" notes are what P2 implements.
- `METHODOLOGY.md` / `methodology-source.xlsx` — the full spec P2 must match.
- `NOTES.md` — the hand-author-first argument and the GDPR/legal blockers.
