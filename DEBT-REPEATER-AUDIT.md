# Debt-repeater audit — branch 2 prep

**Version:** 24 Aug 2026
**Purpose:** confirm exactly which sub-fields the mortgage/loan/card/overdraft records already
capture, so `feat/questionnaire-reconcile` can wire *derived* cash-flow debt payments (removing the
aggregate `EXP-02`/`EXP-11`) without guessing — and flag where the cash-flow spec collides with the
**debt-health** module, which reads the same records.
**Sources:** `prototype-full.html` (`QS` group definitions), `debt-methodology-check.js` (consumer).

---

## Verdict at a glance

| Record | Cash-flow needs | Status |
|--------|-----------------|--------|
| **Mortgage** (`DEB-MORT`) | monthly payment (+ balance/rate/type/term) | ✅ **READY** — has `pay` |
| **Loan** (`DEB-LOAN`) | monthly payment (+ type/balance/rate/term/security) | ✅ **READY** — has `pay` |
| **Credit card** (`DEB-CARD`) | paid-in-full? + carried-balance payment | ⚠️ **DECISION** — has `behavior` + `minpay`, not the spec's boolean + carried-payment |
| **Overdraft** (`DEB-16/17`) | monthly interest+fees, monthly principal reduction | ⛔ **2 FIELDS MISSING** |

The mortgage & loan payment data **already exists** in the repeaters and is unused by cash flow today
(cash flow reads the aggregate `EXP-02`/`EXP-11` instead) — so a user currently enters mortgage/loan
payments **twice**. That is precisely the AC-02 double-entry the spec removes; deriving from the records
is low-risk because the data is already there.

---

## 1. Mortgage — `DEB-MORT` (`when DEM-04==='mortgage'`) ✅

| Spec field | Existing key | Note |
|------------|--------------|------|
| monthlyPayment | `pay` | ✅ used directly for `totalMortgagePayment` |
| balance | `bal` | ✅ |
| annualInterestRate | `rate` | ✅ |
| rateType FIXED/VARIABLE | `rtype` | has 4 options (`fixed/variable/mixed/idk`) vs spec's 2 — cosmetic for cash flow |
| remainingTermYears | `term` | ✅ |

**Cash-flow wiring:** `totalMortgagePayment = Σ DEB-MORT[i].pay`. No schema change needed.

## 2. Loan — `DEB-LOAN` (`when G-LOANS==='yes'`) ✅

| Spec field | Existing key |
|------------|--------------|
| type | `ltype` |
| balance | `bal` |
| annualInterestRate | `rate` |
| monthlyPayment | `pay` |
| remainingTermYears | `term` |
| securityType SECURED/UNSECURED | `sec` (+`idk`) |

**Cash-flow wiring:** `totalLoanPayment = Σ DEB-LOAN[i].pay`. No schema change needed.

## 3. Credit card — `DEB-CARD` (`when G-CARDS==='yes'`) ⚠️ DECISION

Existing sub-fields: `bal` (used balance), `limit`, `rate`, **`minpay`** (minimum/usual monthly payment),
**`behavior`** (4-level: `always` / `usually` / `above_min` / `min`).

The spec models a card as **`paidInFullMonthly` (Y/N)** + **`carriedBalancePaymentMonthly`**, and computes
`totalCardDebtPayment = Σ (paidInFull ? 0 : carriedBalancePayment)` — a paid-in-full card adds €0.

**Cross-module constraint:** the debt-health engine already uses BOTH existing keys —
`minpay` in its payments/income part (`debt-methodology-check.js:47`) and `behavior` in its
repayment-behaviour score (`:70`). **Do not delete them.**

Two ways to satisfy cash flow without breaking debt-health:

- **Option A (low friction, reuse):** derive from existing data —
  `paidInFull := behavior==='always'`; `cardPayment := paidInFull ? 0 : minpay`.
  No new field. Caveat: `minpay` is labelled "минимална или **обичайна** вноска" and may include
  new-purchase spend, so it's a *proxy* for the carried-balance payment, not a strict AC-04 match.
- **Option B (strict AC-04):** add one field `carriedPay` "Месечно плащане към пренесения баланс",
  shown only when `behavior!=='always'`; cash flow uses it, debt-health keeps `minpay`/`behavior`.
  Cleanest fidelity; one extra question per carried card.

→ **Recommend Option A** unless the client wants strict carried-balance isolation, then B.

## 4. Overdraft — `DEB-16` + `DEB-17` (+ `DEB-21`) ⛔ 2 FIELDS MISSING

Existing: `DEB-16` used amount, `DEB-17` annual rate, `DEB-21` "как използвате овърдрафта през
последните 6 месеца" (5-level). Overdraft is **not wired into cash flow at all** today.

Spec cash-flow outflow = **`interestFeesMonthly` + `principalReductionMonthly`** — **neither exists.**

**Add** (both `when G-OVER==='yes'`, €m, mandatory):
- `DEB-OD-FEES` — "Средни месечни лихви и такси по овърдрафта"
- `DEB-OD-PRIN` — "Сума, с която реално намалявате овърдрафта месечно"

Then `totalOverdraftCashOutflow = G-OVER==='yes' ? DEB-OD-FEES + DEB-OD-PRIN : 0`.

**⚠️ Cross-module conflict on `DEB-21`:** the cash-flow business doc §4.4 says **remove `DEB-21`**, but
the debt-health engine uses it for its overdraft-pattern score (`debt-methodology-check.js:75`, `ODUSE`)
and partly to detect overdraft presence (`:64`). Removing it degrades debt-health.
→ **Do not delete `DEB-21` outright.** Keep the field for debt-health and simply exclude it from the
cash-flow flow, OR get an analyst decision to drop the overdraft-pattern part. Also update the
debt-health `hasOD` detection to not depend on `DEB-21` (`a['G-OVER']==='yes' || odBal>0`).

---

## 5. Net branch-2 schema work (result of this audit)

- **No change:** mortgage, loan (payment fields present).
- **Add:** `DEB-OD-FEES`, `DEB-OD-PRIN` (overdraft); `GAM-01`+`GAM-02` (gambling); `SAV-05` (investments) — last two from `QUESTIONNAIRE-CASHFLOW.md`, unrelated to debt.
- **Card:** Option A (no schema change) or B (add `carriedPay`).
- **Keep for debt-health, exclude from cash flow:** `DEB-21`, card `behavior`/`minpay`, `INC-08`.
- **Cash-flow debt derivation:**
  ```
  debtpay = Σ DEB-MORT.pay + Σ DEB-LOAN.pay
          + Σ (DEB-CARD.behavior==='always' ? 0 : DEB-CARD.minpay)      // Option A
          + (G-OVER==='yes' ? DEB-OD-FEES + DEB-OD-PRIN : 0)
  ```

## 6. For the client (new items this audit raises)

5. **`DEB-21` removal vs debt-health** — the cash-flow doc removes it, but debt-health scores overdraft
   pattern from it. Keep-for-debt-health-only, or accept debt-health losing that input?
6. **Card carried-balance payment** — Option A (reuse `minpay`, proxy) or Option B (add a dedicated field, strict AC-04)?

*(Items 1–4 remain in `EDIT-PLAN-CASHFLOW.md` §5.)*
