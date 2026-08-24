# Scoring model — v3

The scoring model *is* the product. This document is the source of truth; `prototype.html`
implements exactly what is written here.

**v3 (28 July 2026).** Rebuilt onto the data analyst's **8-component framework**
(see METHODOLOGY.md / `methodology-source.xlsx`). The analyst's framework, weights, and
point tables are authoritative. This file specifies how the **free ~16-question quiz**
realises those 8 components, and where it approximates parts that need the full 85-field
model. Supersedes the v2 six-pillar model entirely.

## Two tiers

- **Free quiz (~16 questions)** — computes all 8 components, approximating the parts that
  need more inputs, and returns the headline 0–100 plus 2–3 unlocked components.
- **Paid report** — the full 85-field model: the debt-health 5-part engine, per-loan BNB
  rate benchmarking, ЦКР delinquency handling, diversification and net-worth detail, the
  12-month plan. Not yet built as an input flow; the sample report approximates it from
  the free inputs and says so.

## Components and weights (the analyst's, unchanged)

Cash flow 20 · Emergency 15 · Debt health 15 · Wealth building 15 · Protection 10 ·
Retirement 10 · Resilience 10 · Behaviour 5. Total is the weighted sum, then the
delinquency cap is applied.

## Free-tier inputs (~16)

age(band) · dependants · employment · income stability · housing · net income ·
essential spend (excl. debt) · non-essential spend · monthly debt payments (incl. mortgage) ·
monthly savings · liquid reserve · consumer debt balance · investments · insurance(multi) ·
pension status · payment discipline · shock-cover.

Demographics beyond age/employment/housing (**sex, location, profession**) are **not asked
in the free quiz and never change the score** — comparison-only per the analyst.

## Free-tier component formulas

Notation: `inc` net monthly income; `essExcl` essential spend excluding debt; `pay` monthly
debt payments; `essTotal = essExcl + pay` (the analyst's essential includes debt service).
All components clamp to 0–100. `pw(x, table)` = linear interpolation over the analyst's
control points.

### 1. Cash flow (20%) — analyst tables, faithful
```
essPct  = essTotal / inc     scored by ESS  table  [≤40→100, 50→85, 60→55, 70→25, ≥100→0]
nonPct  = nonEss   / inc     scored by NON  table  [≤20→100, 30→80, 40→40, ≥100→0]
savePct = savings  / inc     scored by SAVE table  [≤0→0, 10→40, 20→80, ≥30→100]
score   = 0.40*essScore + 0.20*nonScore + 0.40*saveScore
```

### 2. Emergency readiness (15%) — our curve (analyst gives no point table for this component)
```
months = reserve / essTotal
score  = sqrt(min(1, months / 6)) * 100
```
sqrt so 0→1 month matters more than 5→6. Flagged: this curve is ours, not the analyst's.

### 3. Debt health (15%) — free subset of the 5-part engine, renormalised
Free tier scores the three parts answerable without loan-level detail, reweighted to sum
to 1 (35/15/25 → /0.75):
```
payScore    = pw(pay/inc, DSR table)         [0→100,20→90,30→75,35→60,45→40,50→20,≥60→0]
assetsScore = max(0, 100 − debt/assets*100)   assets = reserve + investments
discScore   = 100 if no late payments else 0
score = (0.35*payScore + 0.15*assetsScore + 0.25*discScore) / 0.75
```
Cost-of-debt and card/overdraft parts need per-loan inputs → **paid tier only**.

### 4. Wealth building (15%) — half savings, half investment adequacy
```
saveScore = same saveScore as cash flow
invTarget = max(0.3, (ageMidpoint − 25) * 0.08)   // multiples of annual income, BG-calibrated
invScore  = sqrt(min(1, (invest/(inc*12)) / invTarget)) * 100
score     = 0.5*saveScore + 0.5*invScore
```
Diversification and full net worth need the asset breakdown → paid tier.

### 5. Protection (10%) — additive
```
+10 any cover · +30 health · +30 life · +20 property (or +12 renter/with-family, no property)
+8 accident · +6 casco · −10 dependants but no life
```

### 6. Retirement readiness (10%)
```
lookup: не се осигурявам 10 · не знам 30 · само задължителни 50 · доброволен фонд 75
−10 if age ≥ 55 and only mandatory
```
Full version uses years-to-retirement, pension assets and desired income → paid.

### 7. Resilience (10%)
```
0.6 * incomeStability + 0.4 * employmentStability
stability: постоянен 100 · предимно 80 · променлив 45 · сезонен 20
employment: трудов договор 85 · самонает 60 · пенсионер 70 · безработен 15 · друго 55
```

### 8. Behaviour (5%)
```
shock-cover (can you cover a one-month shock without a new loan):
да 100 · частично 50 · не 0 · не съм сигурен 40
```

## Delinquency cap (from the debt-health engine, simplified)

Applied to the **final total**: resolved late payment → ≤74 · current arrears → ≤39.
The full ЦКР cap ladder (74 / 59 / 39 / 19 by severity and recency) lives in the paid tier.

## Top-level bands

85–100 Отлично · 70–84 Добро · 55–69 Средно · 40–54 Под средното · 0–39 Уязвимо.

## Peer percentile

`pct = clamp(round(50 + (total − 55) * 1.15), 2, 98)` — placeholder centred on an assumed
median of 55, derived from the score itself, **not real data**. Replace before any public
comparison claim (NOTES.md).

## Calibration

Four regression profiles. The analyst's cash-flow model is stricter than v2, so a genuinely
paycheck-to-paycheck household lands lower; the "typical" profile below is a median household
that saves a little. Re-check these before changing any formula.

| Profile | Total | Band |
|---------|------:|------|
| Struggling — 25–34, €1,200 income, 1 dep, €600 ess + €420 debt pay, €0 saved, €200 reserve, €6k debt, renting, no cover, "не знам", resolved late payment | **21** | Уязвимо |
| Typical — 35–44, €2,500 income, 2 deps, €1,150 ess + €450 debt pay, €300 saved, €5k reserve, €6k debt, €6k invested, mortgage, health+property, mandatory pension | **62** | Средно |
| Solid — 35–44, €4,000 income, 1 dep, €1,900 ess + €450 debt pay, €700 saved, €14k reserve, no debt, €35k invested, mortgage, health+life+property, third pillar | **86** | Отлично |
| Excellent — 45–54, €6,000 income, 1 dep, €2,400 ess, no debt pay, €1,800 saved, €25k reserve, €180k invested, owned, all cover, third pillar | **97** | Отлично |

## Known approximations (free tier)

- Emergency-readiness curve is ours, not an analyst table.
- Debt health omits cost-of-debt and card/overdraft (need per-loan inputs).
- Wealth omits diversification and full net worth.
- Retirement is pension-status only; no horizon/gap maths.
- Peer percentile is synthetic.
- Home equity still ignored (biggest blind spot in a high owner-occupancy country).

All of these close in the paid 85-field tier.
