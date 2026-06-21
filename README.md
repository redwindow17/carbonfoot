# EcoTrack 🌱 — Carbon Footprint Awareness Platform

> A smart, privacy‑first web assistant that helps individuals **understand, track, and reduce** their personal carbon footprint through simple inputs and context‑aware insights.

**Challenge vertical:** *Challenge 3 — Carbon Footprint Awareness Platform.*

**🔗 Live demo:** https://carbonfoot-coral.vercel.app

EcoTrack turns a handful of everyday questions (how you travel, heat your home, eat, and shop) into an estimated yearly footprint, then acts like a personal advisor: it works out **where your emissions actually come from** and recommends the **highest‑impact actions for you specifically**, with the savings calculated from your own numbers. Set a goal, commit to actions, and track your progress over time — all in the browser, with your data never leaving your device.

---

## ✨ What it does

- **Footprint calculator** — four categories (Transport, Home energy, Food, Goods & waste) with a live total that updates as you type.
- **Smart, personalised recommendations** — a rule engine that decides which advice is *relevant to you* and estimates each action's saving from *your* data (see [Approach & logic](#-approach--logic)).
- **Context benchmarking** — compare against regional averages (World, India, EU, US, …) and the per‑person target consistent with 1.5 °C.
- **Goals & projection** — set a reduction target, tick the actions you'll take, and watch your projected footprint fall toward the goal.
- **History tracking** — save snapshots over time and see your trend.
- **Private by design** — 100% client‑side; everything is stored locally in your browser.
- **Accessible & responsive** — keyboard‑navigable, screen‑reader friendly, dark‑mode aware.

---

## 🧠 Approach & logic

The brief asks for a *smart, dynamic assistant that makes logical decisions based on user context*. The core of EcoTrack is therefore not a static checklist but a small **recommendation engine** ([`src/domain/recommendations.ts`](src/domain/recommendations.ts)).

Each candidate action is a rule with three responsibilities:

1. **Relevance gate** — *should this even be shown to this user?* (e.g. never suggest "switch to an EV" to someone who doesn't drive; never suggest a renewable tariff to someone already on one; never nudge the diet of an existing vegan).
2. **Personalised saving** — *how much would it save **this** person?* The estimate is computed from the user's own figures using the **same emission factors as the calculator**, so the advice is always internally consistent. For example, the "switch to an EV" saving is your actual car emissions × the fractional improvement of an EV on your grid.
3. **Personalised rationale** — a plain‑language explanation that quotes your own numbers.

Relevant actions are then **ranked by impact** (largest saving first, ties broken by least effort) and surfaced with an effort badge so you can pick your battles. Committing to actions feeds a **projection** that shows how close your choices get you to your goal.

This makes the output genuinely *dynamic*: two different users see different actions, in a different order, with different numbers.

---

## 🏗️ How it works

EcoTrack is a single‑page React app with a strict separation between **business logic** and **UI**:

```
src/
├── domain/          Pure, framework‑free business logic (100% unit‑tested)
│   ├── types.ts            Domain model
│   ├── emissionFactors.ts  All CO₂e factors in one auditable place (with sources)
│   ├── calculator.ts       Pure footprint calculation
│   ├── recommendations.ts  The context‑aware recommendation engine
│   ├── benchmarks.ts       Regional averages + 1.5 °C target comparison
│   ├── progress.ts         Goal projection, snapshots, trends
│   ├── validation.ts       Input/stored‑data sanitisation (never trusts input)
│   └── labels.ts           Human‑readable labels (shared by engine + UI)
├── app/             State & persistence
│   ├── AppProvider.tsx     Typed reducer store + derived state
│   ├── appContext.ts       `useApp()` hook
│   └── storage.ts          Defensive localStorage layer (schema‑versioned)
├── components/      Accessible UI (Tabs, form fields, charts, views)
├── utils/           Formatting & id helpers
└── ui/              Visual metadata (icons, colours)
```

**Data flow:** the `UserProfile` is the single source of truth. Everything else — the footprint, the recommendations, the projection — is *derived* from it with memoised pure functions and recomputed only when inputs change. Changes are persisted to `localStorage` and re‑validated on load.

---

## 🔢 The calculation model

All emission factors live in [`src/domain/emissionFactors.ts`](src/domain/emissionFactors.ts) so they can be audited and adjusted in one place. They are rounded, representative real‑world averages drawn from public sources:

| Area | Basis |
| --- | --- |
| Vehicle & transit | Per‑km factors by fuel type (≈ DEFRA/BEIS conversion factors) |
| Flights | Per‑trip estimates including non‑CO₂ radiative forcing |
| Electricity | Grid intensity by supply mix (≈ IEA / Our World in Data) |
| Heating | Per‑kWh by fuel; heat pumps modelled with a coefficient of performance |
| Diet | Annual dietary footprints by pattern (≈ Scarborough et al. 2014) |
| Benchmarks & target | Per‑capita CO₂ (Our World in Data); 1.5 °C target ≈ 2.3 t (IPCC) |

Shared home energy (electricity + heating) is divided across the household so each person's share is fair. Line items are rounded to whole kilograms **before** summing, so the parts always add up to the displayed total.

---

## ⚠️ Assumptions & limitations

- The figures are **estimates for awareness**, not a certified greenhouse‑gas inventory.
- Emission factors are global/representative averages; a real footprint varies with your exact region, vehicle, and grid.
- Diet and consumption are captured as qualitative tiers (a pragmatic trade‑off between accuracy and a form people will actually finish).
- Recommendation savings are **per‑action estimates and not strictly additive** — adopting two overlapping actions (e.g. *drive less* **and** *switch to an EV*) saves somewhat less than the sum. The projection caps total savings at your baseline and surfaces this caveat.
- Regional benchmarks are territorial per‑capita CO₂, compared against a consumption‑style estimate — close enough for context, not a like‑for‑like figure.

---

## ♿ Accessibility

Accessibility was a first‑class concern, not an afterthought:

- **Semantic structure** — landmark regions (`header`/`main`/`footer`), `fieldset`/`legend` grouping, a data `table` with a caption, and a "skip to content" link.
- **WAI‑ARIA Tabs** — full `tablist`/`tab`/`tabpanel` semantics with roving `tabindex` and arrow/Home/End keyboard navigation ([`Tabs.tsx`](src/components/Tabs.tsx)).
- **Forms** — every control has an associated `<label>`; help text and units are linked with `aria-describedby`.
- **Charts** — every value is written out as text; coloured bars are purely decorative (`aria-hidden`), so nothing is lost without sight or colour.
- **Live regions used sparingly** — the goal uses `role="progressbar"` with a descriptive `aria-valuetext`; saving a snapshot announces via a polite live region. The keystroke‑level total is *not* a live region (it would overwhelm screen‑reader users).
- **Visible focus**, **dark‑mode** support (`prefers-color-scheme`), and **reduced‑motion** support (`prefers-reduced-motion`).

Beyond manual care, the **heading outline** and **WAI‑ARIA Tabs keyboard behaviour** are covered by automated tests, and every tab is asserted to have **zero violations against the WCAG 2.0/2.1 A & AA rule set** using `axe-core` ([`App.axe.test.tsx`](src/App.axe.test.tsx)).

---

## 🔐 Security & privacy

- **No backend, no tracking, no third‑party calls** — the entire app runs locally, so there is no server attack surface and no data ever leaves the device.
- **All external input is untrusted.** Both form input and the contents of `localStorage` (which a user or a malicious script can edit) are funnelled through a **sanitiser** ([`validation.ts`](src/domain/validation.ts)) that always returns valid, in‑range data, repairing bad fields rather than throwing or propagating `NaN`.
- **Schema‑versioned storage** — stored data with an unknown version is discarded rather than mis‑read; corrupt JSON degrades gracefully to "start fresh".
- **No `dangerouslySetInnerHTML`, no `eval`** — React escapes all rendered content by default.
- Tamper/corruption handling is covered by tests in [`storage.test.ts`](src/app/storage.test.ts).

---

## 🧪 Testing

**122 tests across 21 files** at **100% statement / function / line coverage** (and 99.5% branches — the remainder being two provably‑unreachable defensive guards). Coverage thresholds are enforced in [`vite.config.ts`](vite.config.ts), so the bar can't silently regress.

- **Domain unit tests** — exact‑value checks on the calculator, context gating and ordering of recommendations (incl. the factor‑swap and tier‑step saving helpers and the effort tie‑break), benchmark verdicts, goal projection and trend, and input/storage sanitisation (including tampered and non‑object data).
- **Component & store tests** — every view (calculator, dashboard, breakdown, comparison, recommendations, progress), the `useReducer` store and its persistence/rehydration, reset confirmation, accessible number/select fields, and full‑app navigation.
- **Accessibility tests** — heading hierarchy and automated WCAG A/AA checks (`axe-core`) on each tab.

```bash
npm test            # run all tests once
npm run test:watch  # watch mode
npm run test:coverage
```

---

## 🚀 Getting started

**Prerequisites:** Node.js ≥ 18 and npm.

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server (http://localhost:5173)
npm run dev

# 3. Production build (output in dist/)
npm run build

# 4. Preview the production build locally
npm run preview
```

### npm scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server with hot reload |
| `npm run build` | Type‑check, then build a static production bundle |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the full test suite once |
| `npm run test:coverage` | Run tests with a coverage report |
| `npm run lint` | Lint with ESLint (incl. `jsx-a11y`) |
| `npm run typecheck` | Type‑check without emitting |

> The build uses a relative `base`, so the static `dist/` can be hosted from any sub‑path (e.g. GitHub Pages).

---

## 🛠️ Tech stack

- **React 18** + **TypeScript** (strict mode)
- **Vite** for dev/build, **Vitest** + **Testing Library** for tests
- **ESLint** with `typescript-eslint`, `react-hooks`, and `jsx-a11y`
- **No runtime UI dependencies** beyond React — charts are hand‑rolled accessible HTML/CSS to keep the bundle small (~57 KB gzipped) and fully controllable.

---

## 📄 License

Released under the [MIT License](LICENSE).
