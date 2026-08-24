# Reconciled questionnaire — Cash-flow module (Паричен поток)

**Version:** reconciliation draft, 24 Aug 2026
**Source of truth:** `Бизнес изисквания - Паричен поток` (§4) + `Техническа спецификация - Паричен поток` (§3, §4, §5)
**Scope:** ONLY the questions whose answers feed the cash-flow score (the 20% component).
Emergency / debt-health / wealth / protection / retirement / resilience / behaviour questions
are governed by their own methodology sheets and are **out of scope here** — but shared fields
(housing, dependants, the debt records) are flagged where they overlap.

## Conventions (apply to every money question)

- **Monthly only.** No annual entry, no annual→monthly conversion (business §2.2; tech VAL). ⚠️ removes the `/12` fields.
- **EUR only.** No currency picker.
- **Individual (SELF) only.** No household.
- Every money value is a **decimal ≥ 0**. Negative → `BLOCKED_INVALID_VALUE`. `0` is a valid answer; blank/null on an *applicable* field is a missing value, **not** zero (business BR-CF-06, tech §4).
- A conditional source that is **not selected** normalises to `0` and is not asked.
- **Net** figures (after tax, social security, usual direct costs).

**Type legend:** `€m` = monthly euro amount · `int` = non-negative integer · `Y/N` = boolean ·
`enum` = single choice · `multi` = multi-select · `repeater` = list of sub-records (≥1 when parent = Yes).

---

## 0. Setup

| ID | Question | Type | Rule | Change vs prototype |
|----|----------|------|------|---------------------|
| `CFG-01` | За кого попълвате проверката? | enum | **Locked to "Само за себе си"** (only option) | Was multi-option → lock to SELF |
| ~~`CFG-02`~~ | ~~Как ще въвеждате сумите?~~ | — | **REMOVED** | Entry-method toggle deleted |
| ~~`CFG-03`~~ | ~~Основна валута~~ | — | **REMOVED** | Currency fixed to EUR |

---

## 1. About you (shared fields)

| ID | Question | Type | Condition | Mandatory | Feeds |
|----|----------|------|-----------|-----------|-------|
| `DEM-04` | Какъв е жилищният Ви статус? | enum | always | yes | Gates rent / property-tax / maintenance / mortgage |
| `DEM-02` | **Колко лица са зависими от доходите Ви?** | int | always | yes | Gates `EXP-09`; Protection module |
| ~~`INC-08`~~ | ~~Колко стабилен е общият Ви доход?~~ | — | — | — | **REMOVE per business §4.1** ⚠️ see Open Items |

**`DEM-04` values:** `OWN_NO_MORTGAGE` (Собственик без ипотека) · `OWN_WITH_MORTGAGE` (Собственик с ипотека) ·
`RENT` (Наемател) · `FAMILY` (Живея със семейство/безплатно) · `OTHER` (Друго).
`DEM-02` renamed — plain integer, the word "брой" removed from the label.

---

## 2. Monthly income  → **income bucket**

`totalMonthlyIncome = INC-01 + INC-02 + INC-03 + INC-04 + INC-05 + INC-06 + INC-07`

| ID | Question | Type | Condition | Mandatory |
|----|----------|------|-----------|-----------|
| `INC-01` | Среден нетен месечен доход от трудова дейност | €m | always | yes (0 allowed) |
| `G-INC` | Имате ли и други редовни доходи? | multi | always | — |
| `INC-02` | Среден допълнителен месечен доход от бонуси, комисионни и извънреден труд | €m | `G-INC ∋ bonus` | yes if shown |
| `INC-03` | Среден нетен месечен доход от собствен бизнес | €m | `G-INC ∋ business` | yes if shown |
| `INC-04` | Среден нетен месечен доход от пенсия | €m | `G-INC ∋ pension` | yes if shown |
| `INC-05` | Среден нетен месечен доход от наем | €m | `G-INC ∋ rent` | yes if shown |
| `INC-06` | Среден месечен доход от лихви и дивиденти | €m | `G-INC ∋ interest` | yes if shown |
| `INC-07` | Други редовни нетни доходи | €m | `G-INC ∋ other` | yes if shown |

Guidance chips: bonus/interest = average over last 12 months; rent = net after tax & usual direct costs;
interest = realised only, no unrealised appreciation; other = regular social payments/alimony, **no gifts or one-offs**.
✅ Already matches the plan — keep as-is.

---

## 3. Essential expenses  → **essential bucket**

All monthly averages. `essentialExpenseTotal` = these **plus** the derived debt payments in §4.
There is **no editable "total essential" field**; any displayed total is read-only.

| ID | Question | Type | Condition | Mandatory |
|----|----------|------|-----------|-----------|
| `EXP-01` | Наем | €m | `DEM-04 = RENT` | yes if shown |
| `EXP-03` | Данък върху недвижимите имоти и такса битови отпадъци | €m | `DEM-04 ∈ {OWN_NO_MORTGAGE, OWN_WITH_MORTGAGE}` | yes if shown |
| `EXP-04` | Комунални услуги | €m | always | yes (0 allowed) |
| `EXP-05` | Средни разходи за необходима поддръжка и ремонти | €m | `DEM-04 ∈ {OWN_NO_MORTGAGE, OWN_WITH_MORTGAGE}` | yes if shown |
| `EXP-06` | Храна и стоки за дома | €m | always | yes (0 allowed) |
| `EXP-07` | Транспорт | €m | always | yes (0 allowed) |
| `EXP-08` | Здравеопазване и лекарства | €m | always | yes (0 allowed) |
| `EXP-09` | Разходи за деца, образование и зависими лица | €m | `DEM-02 ≥ 1` | yes if shown |
| `EXP-10` | Интернет и телефон | €m | always | yes (0 allowed) |
| `EXP-12` | Общо месечни застрахователни премии | €m | always | yes (0 allowed) — actually-paid premiums; classified essential |

**Changes:** `EXP-03` now entered as the **monthly average** (was annual `/12`).
`EXP-05` labelled **необходима** poддръжка (necessary, not discretionary).

---

## 4. Debts  → derived payments feed **essential bucket** (no editable aggregates)

> **Core correction (AC-02/03/04):** the editable aggregate payment questions are removed and the
> monthly payment totals are **derived** from per-obligation records. No value is entered twice.

| ~~ID~~ | ~~Question~~ | Action |
|--------|--------------|--------|
| ~~`EXP-02`~~ | ~~Месечни ипотечни плащания~~ | **REMOVED** → derive from `MORTGAGE[]` |
| ~~`EXP-11`~~ | ~~Месечни плащания по заеми, кредитни карти и авто~~ | **REMOVED** → derive from `LOAN[]` + `CARD[]` |
| ~~`DEB-21`~~ | ~~Как използвате овърдрафта през последните 6 месеца?~~ | **REMOVED** (business §4.4) |

### 4.1 Mortgages
| Trigger | `DEM-04 = OWN_WITH_MORTGAGE` ⇒ `MORTGAGE[]` requires **≥1 record** (else `BLOCKED_INCOMPLETE_INPUT`) |
|---|---|
| Record fields | `balance` €, `annualInterestRate` %, `monthlyPayment` €m, `rateType` = FIXED/VARIABLE, `remainingTermYears` int — **all mandatory** |
| Derived | `totalMortgagePayment = Σ monthlyPayment` → into essential (read-only) |

### 4.2 Other loans
| Trigger | `G-LOANS` (Имате ли други заеми?) = Yes ⇒ `LOAN[]` requires **≥1 record** |
|---|---|
| Record fields | `type`, `balance` €, `annualInterestRate` %, `monthlyPayment` €m, `remainingTermYears` int, `securityType` = SECURED/UNSECURED — **all mandatory** |
| Derived | `totalLoanPayment = Σ monthlyPayment` → into essential |

### 4.3 Credit cards
| Trigger | `G-CARDS` (Имате ли кредитни карти?) = Yes ⇒ `CARD[]` requires **≥1 record** |
|---|---|
| Record fields | `usedBalance` €, `creditLimit` €, `annualInterestRate` %, `paidInFullMonthly` Y/N, `carriedBalancePaymentMonthly` €m *(required only if `paidInFullMonthly = false`)* |
| Validation | `usedBalance > creditLimit` → `BLOCKED_INVALID_VALUE` |
| Derived | `totalCardDebtPayment = Σ (paidInFullMonthly ? 0 : carriedBalancePaymentMonthly)` → into essential |
| Rule | Paid-in-full card adds **€0** (purchases already sit in the expense categories); a carried balance adds **only** the payment toward the old/carried balance |

### 4.4 Overdraft
| Trigger | `G-OVER` (Имате ли овърдрафт?) = Yes ⇒ `OVERDRAFT` object required |
|---|---|
| Fields | `usedAmount` €, `annualInterestRate` %, `interestFeesMonthly` €m, `principalReductionMonthly` €m — **all mandatory** |
| Derived | `totalOverdraftCashOutflow = interestFeesMonthly + principalReductionMonthly` → into essential |

> Delinquency questions `DEB-18` (late payments), `DEB-19` (ЦКР 30d+), `DEB-22` (longest arrears)
> belong to the **debt-health module**, not cash flow — keep them, but they do **not** touch the cash-flow score.

---

## 5. Non-essential expenses & gambling  → **non-essential bucket**

`nonEssentialExpenseTotal = EXP-14 + gamblingMonthly`

| ID | Question | Type | Condition | Mandatory |
|----|----------|------|-----------|-----------|
| `EXP-14` | Средни месечни неосновни разходи | €m | always | yes (0 allowed) |
| `GAM-01` | **Имате ли разходи за хазарт?** | Y/N | always | yes |
| `GAM-02` | **Средни месечни разходи за хазарт** | €m | `GAM-01 = Yes` | yes if shown |

**New:** the gambling split. `EXP-14` covers dining out, holidays, entertainment, hobbies, subscriptions
and other discretionary spend **and excludes gambling**. `GAM-02` is added to the non-essential total
**separately** (not folded into `EXP-14`). If `gamblingRate > 5%` of income → independent report warning
`CF_WARNING_GAMBLING_OVER_5_PERCENT` (does not double-penalise points).

---

## 6. Savings, investments & voluntary pension  → **savings bucket**

`monthlySavingTotal = SAV-04 + SAV-05 + EXP-13`  (loan principal repayment is **not** saving)

| ID | Question | Type | Condition | Mandatory | Includes |
|----|----------|------|-----------|-----------|----------|
| `SAV-04` | Колко спестявате средно на месец? | €m | always | yes (0 allowed) | Cash, savings accounts, deposits, reserve, targeted cash — **excl.** investments & voluntary pension |
| `SAV-05` | **Колко инвестирате средно на месец?** | €m | always | yes (0 allowed) | **New** monthly contributions to stocks/ETF/funds/bonds/crypto/metals/other — **excl.** market-value change |
| `EXP-13` | Месечни доброволни пенсионни вноски | €m | always | yes (0 allowed) | Voluntary only — **excl.** mandatory pension |

**New:** `SAV-05` monthly investment **contributions** (the prototype only captured investment *balances*
in `AST-04…10`, which feed wealth-building, not cash flow). Consider re-grouping `EXP-13` under "Спестявания"
in the UI since it maps to the savings bucket.

---

## 7. Removed from the current questionnaire (summary)

`CFG-02` · `CFG-03` · `INC-08` (⚠) · `EXP-02` · `EXP-11` · `EXP-15` (годишни непериодични) · `DEB-21`.

## 8. Added (summary)

`GAM-01` + `GAM-02` (gambling) · `SAV-05` (monthly investment contributions) ·
`CARD.paidInFullMonthly` + `CARD.carriedBalancePaymentMonthly` ·
`OVERDRAFT.interestFeesMonthly` + `OVERDRAFT.principalReductionMonthly`.

## 9. Changed (summary)

`CFG-01` locked to SELF · `DEM-02` renamed + integer · `EXP-03` annual→monthly · `EXP-05` "необходима" ·
`EXP-02`/`EXP-11` aggregates replaced by derived totals from the debt records.

---

## 10. Derived (read-only) values — never entered directly

```
totalMonthlyIncome      = Σ INC-01..07
totalMortgagePayment    = Σ MORTGAGE.monthlyPayment
totalLoanPayment        = Σ LOAN.monthlyPayment
totalCardDebtPayment    = Σ (CARD.paidInFullMonthly ? 0 : CARD.carriedBalancePaymentMonthly)
totalOverdraftCashOutflow = G-OVER ? (interestFeesMonthly + principalReductionMonthly) : 0
essentialExpenseTotal   = EXP-01+03+04+05+06+07+08+09+10+12
                          + totalMortgagePayment + totalLoanPayment
                          + totalCardDebtPayment + totalOverdraftCashOutflow
nonEssentialExpenseTotal = EXP-14 + GAM-02
monthlySavingTotal      = SAV-04 + SAV-05 + EXP-13
freeFundsBeforeSaving   = totalMonthlyIncome - essentialExpenseTotal - nonEssentialExpenseTotal
finalMonthlyResidual    = freeFundsBeforeSaving - monthlySavingTotal
unallocatedMonthlyResidual = max(0, finalMonthlyResidual)
monthlyDeficit          = max(0, essentialExpenseTotal + nonEssentialExpenseTotal - totalMonthlyIncome)
```
A positive residual is **shown separately** and never auto-counted as saving.

## 11. Blocking / validation states (from tech §4)

| Code | Trigger |
|------|---------|
| `BLOCKED_UNSUPPORTED_SCOPE` | scope ≠ SELF |
| `BLOCKED_UNSUPPORTED_CURRENCY` | currency ≠ EUR |
| `BLOCKED_INCOMPLETE_INPUT` | any applicable field missing · `OWN_WITH_MORTGAGE` & 0 mortgages · `G-LOANS`/`G-CARDS`=Yes & 0 records · `G-OVER`=Yes & no overdraft · `GAM-01`=Yes & no amount |
| `BLOCKED_INVALID_VALUE` | any money value < 0 · `usedBalance > creditLimit` |
| `BLOCKED_ZERO_INCOME` | `totalMonthlyIncome = 0` — no percentage score, no division by zero |
| `BLOCKED_INCONSISTENT_CASH_FLOW` | `monthlySavingTotal > max(0, freeFundsBeforeSaving)` |

Conditional = No → related values normalise to 0, not validated as missing.
Conditional = Yes → all related fields (and ≥1 record for a repeater) are mandatory.

---

## 12. Open items to confirm with the client

1. **`INC-08` income stability** — the cash-flow business doc says remove it (§4.1), but it currently feeds the
   **Resilience** component (0.6 × income-stability) in the 8-component model. Removing it from cash flow is fine;
   deleting the question entirely would zero part of Resilience. → *Keep the question for Resilience, just exclude it from cash flow?*
2. **`EXP-12` insurance premiums** — ask always (0 allowed), or gate behind a "do you pay premiums?" question?
   The insurance **types** question (`INS-01`) stays in the Protection module regardless.
3. **`EXP-13` placement** — keep the field ID but move it under the "Спестявания" section in the UI, since it maps to the savings bucket?
