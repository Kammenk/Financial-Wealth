# Analyst methodology — digest

Faithful summary of `methodology-source.xlsx` (the data analyst's spec, 11 sheets).
That spreadsheet is the **authoritative source**; this file is a readable digest so the
team and future work don't have to re-parse XML. Where this digest and the xlsx disagree,
the xlsx wins.

This is a **financial health check, explicitly not a bank credit score** — the spec says
so in several places, and it matters for the ЗПФИ/advice line (see NOTES.md).

## The 8-component total score (0–100)

From sheet **Показатели**. Weighted sum of eight components:

| Component | BG | Weight | Scope |
|-----------|----|-------:|-------|
| Cash flow | Паричен поток | 20% | Income vs essential / non-essential spend and surplus |
| Emergency readiness | Готовност за извънредни ситуации | 15% | Reserve months of cover |
| Debt health | Дългово здраве | 15% | Servicing, rates, revolving use, delinquency (own 5-part engine) |
| Wealth building | Изграждане на богатство | 15% | Saving, investment diversification, net worth |
| Protection | Финансова защита | 10% | Insurance gaps |
| Retirement readiness | Готовност за пенсиониране | 10% | Horizon, pension assets & contributions |
| Resilience | Финансова устойчивост | 10% | Income stability, reliance on credit |
| Behaviour | Финансово поведение | 5% | On-time payments, control, habits |

Bands (used for the two sub-engines; the top-level band labels we set separately):
Отлично / Много добро / Добро / Нужда от подобрение / Рисково / Критично.

## Inputs

**Каталог полета** — 111 fields; 85 in the "quick" model. Each tagged by status:
Основно (in v1) · Условно (shown on a prior answer) · По-късно / Подробно (later module).
Field IDs are grouped: CFG, DEM, INC, EXP, SAV, DEB, AST, INS, RET, GOA, BEH, EVT, INV.

**Demographics are comparison-only by design** — this is the key correction to how the
file was described:

- DEM-05 **sex** — status *По-късно*, note *"not needed for the main result."*
- DEM-06 **location**, DEM-08 **profession** — *По-късно*, comparison only.
- DEM-01 **age** — note *"age should not by itself change the result"*; only acts via the
  retirement horizon.
- DEM-03 **employment** and DEM-04 **housing** *do* legitimately feed the score
  (income stability, expenses/debt context).

## Cash-flow sub-engine (sheet Методика паричен поток)

50/30/20 framing on **net** income. Component = 40% essential + 20% non-essential + 40%
savings. Essential *includes* debt service. Point tables (linear between control points):

- **Essential %**: ≤40→100 · 40–50→85–100 · 50–60→55–85 · 60–70→25–55 · >70→0–25
- **Non-essential %**: ≤20→100 · 20–30→80–100 · 30–40→40–80 · >40→0–40
- **Savings %** (incl. voluntary pension): ≥30→100 · 20–30→80–100 · 10–20→40–80 ·
  0–10→0–40 · ≤0→0

Savings comparison shown in report (does not change score): EU household saving ~14.5%;
BG ~24% of adults say they save, ~73% do not.

## Debt-health sub-engine (sheet Методика дългово здраве)

Own weighted score, five parts:

| Part | Weight | Logic |
|------|-------:|-------|
| Payments / income | 35% | (mortgage + other payments) ÷ net income. 0%→100, 20%→90, 30%→75, 35%→60, 45%→40, 50%→20, ≥60%→0 |
| Debt / assets | 15% | points = MAX(0, 100 − debt/assets%). ≥100%→0 |
| Cost of debt | 15% | each loan's rate ÷ **live BNB benchmark** for that loan type; index >2.5×→0 |
| Cards & overdraft | 10% | 50% utilisation + 50% repayment (cards); 40% depth + 60% pattern (overdraft) |
| Payment discipline & ЦКР | 25% | binary 100/0; any late payment or 30-day+ ЦКР record → 0 |

**BNB rate benchmarks** (June 2026, to be refreshed monthly): housing 2.41% · consumer
8.76% · other 4.64% · overdraft 13.20% · cards 21.16%. BNB DSTI-O regulatory ceiling 50%
(shown only when a mortgage exists; it's a ceiling, not a healthy target).

**Delinquency caps the whole score**: resolved late payment → total ≤74; historical 30-day+
ЦКР → ≤59; current arrears ≤30d → ≤39; current arrears >30d → ≤19. Unverified ЦКР doesn't
penalise, but marks the result *provisional*. Lowest active cap wins.

## Report templates

Sheets **Отчет паричен поток** and **Отчет дългово здраве** give near-final user-report
layouts: summary → component scores with weights → financial overview → per-component
conclusion + one lead recommendation. All figures in euro. Only the *applicable* result
per component is shown to the user; the full scales stay in the methodology.

## Sourcing

The spec cites primary sources throughout — BNB (rate stats, ЦКР regulation, DSTI-O),
Eurostat (household saving), CFP Board, AFCPE, FICO, CFPB, FCA, MoneyHelper. This is the
project's strongest credibility asset and the reason to build on this rather than a
hand-rolled model.

## Archived sheets

`Sheet1` / `Sheet2` are the analyst's original field list, explicitly marked
*"АРХИВ – use the new sheets."* Ignore them.
