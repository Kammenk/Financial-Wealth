# Design brief — Claude Design

Paste the block below into Claude Design to regenerate or extend the site. It describes
what `prototype.html` already implements, so it can also be used as a starting point for
variations.

---

Build a mobile-first single-page marketing site plus a multi-step quiz flow for a
Bulgarian financial-health test. All copy in Bulgarian. Two products: a free instant
score and a €19 detailed report.

**Audience:** Bulgarians 25–45, financially literate enough to be anxious but not
expert. Mostly on phones, mostly arriving from social media. Skeptical of anything that
smells like a bank or an MLM pitch.

**Tone:** Direct and unsentimental, the way a good doctor delivers results. Never
patronising, never hype. No exclamation marks, no "financial freedom", no rocket emoji.
The site's credibility comes from being specific.

**Visual direction:** A precision measuring instrument, not a fintech app. Avoid the
genre defaults — no purple-to-blue gradients, no lone acid-green accent on near-black,
no cream-and-terracotta. Reach instead for a muted petrol/teal as the brand colour with
brass as a secondary highlight, on a considered off-neutral ground. Serif headlines for
editorial gravitas paired with a monospace face for every number, percentage and label
— the mono is what makes it read as measurement. Separate semantic colours (green /
amber / red) for score states, kept distinct from the brand accent.

**Layout:** Single column, maximum ~430px, full-bleed sections divided by hairline rules
rather than floating cards. Generous vertical rhythm. Sticky header with a persistent
CTA. Must work in light and dark themes.

## Screens

**1. Landing (single scroll)**
- Hero: eyebrow "3 минути · без регистрация · безплатно", a headline that contrasts
  income with net worth, one-sentence explainer, primary CTA, and a reassurance line
  that no email or bank access is needed to see the result.
- "Why this matters": three statistics about Bulgarian household finances, presented as
  a hairline-ruled list, not cards.
- "What we measure": the six pillars — liquid reserve, debt load, savings rate,
  investments, protection, pension — as a 2-column grid, one line each.
- "How it works": three numbered steps.
- Free vs paid comparison: two columns, the paid one visually weighted.
- FAQ accordion, 5 questions, one of which explicitly says this is not investment advice.
- Founders: three people with photos and one-line bios.
- Closing CTA.
- Footer with a legal disclaimer (not a licensed investment intermediary).

**2. Quiz — 14 questions, one per screen**
- Sticky bar: back button, "04 / 14" counter in mono, thin progress rule.
- Question, optional help text, then either a numeric field or option buttons.
- Numeric fields: large mono digits, right-aligned so the number and its unit read
  together, with 4 tappable shortcut chips for common values.
- Choice questions advance automatically on tap; multi-select needs the button.
- Primary button pinned to the bottom of the screen.
- Questions cover: age, sex, region, household income, dependents, expenses, liquid
  savings, consumer debt, monthly loan payments, housing situation, investments,
  insurance held (multi-select), pension status, 3-year goal. Nothing identifying.

**3. Calculating** — a short screen that ticks through the six pillars being scored.
Builds anticipation; 1.5–2 seconds, not 5.

**4. Free result**
- Score 0–100 in very large mono, with a band label (Уязвимо / Под средното / Средно /
  Добро / Отлично).
- The score visualised as a horizontal calibrated scale with tick marks and a needle
  that animates into position — deliberately not a donut or radial gauge.
- Peer comparison: "Better than 52% of people aged 30–39".
- Six pillar meters: two unlocked with real values, four locked — value replaced by
  dots, explanation text blurred, small "заключено" chip.
- One free insight naming the weakest pillar.
- Email capture, framed as "send me my report", not a newsletter signup.
- Paid offer card: €19, five specific bullets, refund promise.

**5. Sample paid report**
- All six pillars unlocked.
- A "where you are / where you should be" table: current value against personal target,
  columns aligned across rows, tabular numerals.
- A 12-month plan in three phases with specific euro amounts.

**Motion:** Restrained. The needle sweeping into position on the result screen is the
one orchestrated moment. Respect `prefers-reduced-motion`.
