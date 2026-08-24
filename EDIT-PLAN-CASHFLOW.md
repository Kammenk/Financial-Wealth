# Edit plan — align the prototype to the cash-flow spec

**Version:** draft, 24 Aug 2026
**Targets:** `prototype.html`, `prototype-limited.html`, `prototype-full.html` (identical engine + `QS` schema — **mirror every edit across all three**) and `cashflow-methodology-check.js`.
`full-questionnaire*.html` / `deep-dive-prototype.html` carry no engine and are out of scope.
**Companion:** `QUESTIONNAIRE-CASHFLOW.md` (the reconciled question set this plan implements).

---

## 0. Scoring reconciliation — RESOLVED against `methodology-source.xlsx`

The essential>70% and non-essential>40% tails differed between the prototype and the Technical
Specification. Checked against the analyst's authoritative sheet **`Методика паричен поток` §4**:

| Band | Analyst xlsx says | Prototype does | Spec says |
|------|-------------------|----------------|-----------|
| Essential **>70%** | "**0–25**" (range only — **no endpoint given**) | 25→0 linear over 70–**100%** | 25→0 linear over 70–**80%**, then 0 |
| Non-ess **>40%** | "**0–40**" (range only — **no endpoint given**) | 40→0 linear over 40–**100%** | 40→0 linear over 40–**60%**, then 0 |

**Conclusion:** the analyst table is *underspecified* in the tail (it gives the point range but not
where the line reaches 0). The Technical Specification **completes** it — it does not contradict it —
and its stricter close (0 at 80% / 60%) is the more defensible reading of a "Рисково" band. **Adopt the
spec's endpoints.** Everything else (weights 40/20/40, all control points up to the tail, the savings
table, the level thresholds, debt-health-as-separate) matches across analyst, prototype, and spec.

**Engine change** (piecewise `pw()` interpolates over control points, so just insert the zero breakpoints):

```js
// BEFORE
T_ESS  = [[0,100],[0.40,100],[0.50,85],[0.60,55],[0.70,25],[1.0,0]]
T_NON  = [[0,100],[0.20,100],[0.30,80],[0.40,40],[1.0,0]]
// AFTER
T_ESS  = [[0,100],[0.40,100],[0.50,85],[0.60,55],[0.70,25],[0.80,0],[1.0,0]]
T_NON  = [[0,100],[0.20,100],[0.30,80],[0.40,40],[0.60,0],[1.0,0]]
```
`T_SAVE` and `T_DSR` unchanged.

> Two further **methodology deltas** the newer business/tech docs introduce vs. the analyst baseline —
> both are client decisions in `QUESTIONNAIRE-CASHFLOW.md`, confirm before shipping (see §5):
> 1. **Savings becomes 3-part.** Analyst: `SAV-04 + EXP-13` only (2-part). New business doc §4.6 adds
>    monthly **investment contributions** (`SAV-05`) → raises the savings % (and score) for anyone who invests.
> 2. **Debt becomes per-obligation.** Analyst: aggregate `EXP-02 + EXP-11` in essential. Spec: derive
>    payments from the mortgage/loan/card/overdraft records (AC-02/03/04, no double counting).

---

## 1. Engine / scoring  (search: `T_ESS`, `T_NON`)
- [ ] Apply the `T_ESS` / `T_NON` breakpoint change above (all 3 files).
- [ ] No change to `pw()`, weights (`w:0.20` cash-flow component), `T_SAVE`, `T_DSR`.

## 2. `mapAnswers()` — bucket wiring  (search: `function mapAnswers`)

| Bucket | Current | Change to |
|--------|---------|-----------|
| income | `sum(INC-01..07)` | ✅ unchanged |
| essential | `sum(EXP-01,04,05,06,07,08,09,10,12) + g('EXP-03')/12 + g('EXP-15')/12` | `sum(EXP-01,03,04,05,06,07,08,09,10,12)` — **EXP-03 monthly (drop /12)**, **EXP-15 removed** |
| nonessential | `g('EXP-14')` | `g('EXP-14') + g('GAM-02')`; expose `gambling = g('GAM-02')` for the >5% warning |
| savings | `g('SAV-04') + g('EXP-13')` | `g('SAV-04') + g('SAV-05') + g('EXP-13')` |
| debtpay | `g('EXP-02') + g('EXP-11')` | **derive from records** (below) |

**Derived debt payment** (replaces the aggregates):
```js
totalMortgagePayment    = Σ MORTGAGE[i].pay
totalLoanPayment        = Σ LOAN[i].pay
totalCardDebtPayment    = Σ (CARD[i].paidInFull ? 0 : CARD[i].carriedPay)
totalOverdraftCashOutflow = (G-OVER==='yes') ? g('DEB-OD-FEES') + g('DEB-OD-PRIN') : 0
debtpay = totalMortgagePayment + totalLoanPayment + totalCardDebtPayment + totalOverdraftCashOutflow
```
> ⚠ **Repeater sub-field audit required.** `mapAnswers` already reads `eSum('DEB-CARD','bal')` etc., so
> records use short keys (`bal`, …). Confirm/add the sub-fields these formulas need:
> - `DEB-MORT`: `pay` (monthly), `rate`, `rateType` FIXED/VARIABLE, `term` — **all mandatory**
> - `DEB-LOAN`: `type`, `pay`, `rate`, `term`, `securityType` SECURED/UNSECURED
> - `DEB-CARD`: `paidInFull` Y/N, `carriedPay` (required iff `paidInFull=false`), plus existing `bal`, `limit`, `rate`
> - Overdraft: add `DEB-OD-FEES` (interest+fees/mo) and `DEB-OD-PRIN` (principal reduction/mo) — today only `DEB-16` used-amount + `DEB-17` rate exist.

## 3. Questionnaire schema `QS`  (search: `const QS`)

**Remove** the objects: `CFG-02`, `CFG-03`, `INC-08`, `EXP-02`, `EXP-11`, `EXP-15`, `DEB-21`.
*(INC-08: keep the field for the Resilience component but exclude from cash flow — see §5.1.)*

**Change:**
- `CFG-01` → single fixed option "Само за себе си".
- `DEM-02` → label "Колко лица са зависими от доходите Ви?", type integer, drop "брой".
- `EXP-03` → label/help = **monthly average** (remove any annual framing).
- `EXP-05` → label "Средни разходи за **необходима** поддръжка и ремонти".

**Add:**
- `GAM-01` Y/N "Имате ли разходи за хазарт?" (always).
- `GAM-02` €m "Средни месечни разходи за хазарт" (`when GAM-01==='yes'`, mandatory).
- `SAV-05` €m "Колко инвестирате средно на месец?" (always, 0 allowed).
- Ensure the **mortgage repeater** (`DEB-MORT`) is shown/required `when DEM-04==='OWN_WITH_MORTGAGE'`
  with ≥1 record, and the loan/card repeaters expand on `G-LOANS`/`G-CARDS = yes` (they already exist).

**Housing enum** — align `DEM-04` values to the spec set: `OWN_NO_MORTGAGE, OWN_WITH_MORTGAGE, RENT, FAMILY, OTHER`
(prototype uses `own/mortgage/rent/...`; keep internal codes but map them 1:1 and use them consistently in `when` guards and `essential`/property-tax conditions).

## 4. Report / validation / projection  (search: `function report`, `function render`)

Currently minimal (near-zero Cyrillic report text; no `BLOCKED_*`, no projection). Build to spec §7/§8/§10/§11:
- [ ] **Blocking gate** before scoring — implement the `BLOCKED_*` states (tech §4 / `QUESTIONNAIRE-CASHFLOW.md` §11): unsupported scope/currency, incomplete input, invalid value, `usedBalance>creditLimit`, zero income, `monthlySavingTotal > max(0, freeFundsBeforeSaving)`. Block navigation past a step with a missing **applicable** field (mandatory-record repeaters included).
- [ ] **Template catalog** — add the fixed BG strings `CF_SUMMARY`, `CF_RECOMMEND_DEFICIT/ESSENTIAL_RISK/ESSENTIAL_AND_SAVING/NONESSENTIAL_AND_SAVING/SAVING/STRONG_ACCUMULATION/BALANCED`, `CF_WARNING_GAMBLING_OVER_5_PERCENT`, `CF_PROJECTION`, and the per-component conclusion strings (business §8.2). Text is materialised from `{templateId, params}` — no free text.
- [ ] **Lead-recommendation selector** — evaluate `OUT-010…070` in order, first match wins; gambling warning `OUT-W01` independent (spec §10.1/10.2).
- [ ] **Projection** — `PROJ-001…006` with `deltaEssentialTo50 / deltaNonEssentialTo30 / deltaSavingTo20`; only `OUT-050` with sufficient residual yields a `projectedScore`; deficit/ambiguous-source show delta, `projectedScore=null` (spec §11).
- [ ] **bg-BG formatting** — comma decimal, space thousands, `€` after the amount, `ROUND_HALF_UP` for display only; raw values drive categories/formulas (spec §13).

## 5. Open items to confirm with client
1. **INC-08** — keep the question (Resilience uses it) but exclude from cash flow? (recommended) or delete outright?
2. **Savings 3-part** (adds `SAV-05` investment contributions) — confirm the intended lift vs. the analyst's 2-part baseline.
3. **EXP-12 insurance** — always-ask vs. gate behind a yes/no.
4. **EXP-13** — move under the "Спестявания" UI section (maps to savings)?

## 6. Verification
- [ ] Update `cashflow-methodology-check.js`: new tail (`0.80→0`, `0.60→0`), 3-part savings, derived debt; keep the 6 profiles green and **add boundary profiles at essential 75%/85% and non-ess 50%/55%** to lock the new tail.
- [ ] Add golden checks for each `BLOCKED_*` and each `OUT-0xx` recommendation, and the projection example (income 2000 / ess 1200 / non 400 / save 200 → 58 → +200 → 74).
- [ ] Manual pass of the 5 spec acceptance tests T01–T12 through the UI.

## 7. Suggested sequencing (branches, small commits)
1. `fix/scoring-tail` — §1 + §6 check update (smallest, isolated, provable).
2. `feat/questionnaire-reconcile` — §2 + §3 (schema + wiring; the bulk).
3. `feat/cashflow-report` — §4 (validation + templates + projection).
Mirror each across the 3 prototypes in the same commit.
