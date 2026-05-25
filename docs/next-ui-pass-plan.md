# Next UI/UX Pass — Implementation Plan

Plan for the four items deliberately deferred from PR #12. Goal: each is its own PR, easy to scope, ship, and revert.

## Context

After PRs #5–#12, the foundation is in place:

- CI pipeline runs lint + Playwright + build on every PR
- Onboarding persists `region`, `organizationSize`, and `plan` and maps them into `tenant.settings.currency`, `tenant.settings.timezone`, `tenant.settings.dashboardDensity`, and `tenant.plan` via the `REGION_DEFAULTS` and `SIZE_TO_DENSITY` tables in `api.ts`
- Copy is in the agreed plain & friendly voice across auth, onboarding, landing, and core marketing pages, with new-market framing where the original copy implied established traction
- A reusable `<EmptyState />` lives at `components/EmptyState.tsx` and is wired into `TripManagement`
- The landing hero/section headings have been softened — `uppercase` and `tracking-tighter` dropped on h1/h2, body type loosened to `font-medium leading-relaxed`

Four pieces are intentionally left for follow-up PRs. Each is detailed below with scope, files, approach, and risk.

---

## 1. Modern SaaS Clean v2 — landing & marketing palette pivot

The single biggest open question. The current visual language is monochromatic brutalist (black, white, slate, with an orange brand accent). PR #12 softened the type but kept the palette. "Modern SaaS Clean" implies something quite different: lighter palette, more whitespace, gradients, illustrations, less aggressive blocks.

This change is the most subjective in the whole plan and the highest revert risk. Treat it as a multi-PR effort, not a single push.

### Scope this in three PRs

**PR A — Design system tokens + hero only**
- `index.css` `@theme` block: introduce real brand color values (the `--color-brand: #000000` placeholder was deliberate per the brutalist direction, but if we're pivoting, this needs an actual value, plus accent and gradient stops)
- New tokens: `--color-surface-soft`, `--color-surface-elevated`, `--gradient-hero-from`, `--gradient-hero-to`
- `LandingPage` hero only — drop the dark `#0F172A` background, replace with a soft white / cream + gradient blob backdrop
- Add a single illustration or product screenshot in place of the abstract image
- **Don't** touch the rest of the page yet — let this PR be reviewable as "hero before / hero after" in isolation

**PR B — Section-by-section pass on landing**
- Apply the new palette to Benefits, Comparison, Product, Case Study, How It Works, Testimonials, Payments, Pricing, Final CTA, FAQ sections in order
- Keep the brutalist blocks where they actually serve the content (the comparison table, the case study stat blocks); soften them everywhere else
- Smaller `rounded-[Xrem]` values where they currently feel oversized (some are `rounded-[4rem]`)
- Test render after each section to catch layout regressions

**PR C — Other marketing pages alignment**
- Apply the same tokens to `ProductPage`, `AboutPage`, `PricingPage`, `ContactPage`, `SolutionsPage`, `InfrastructurePage`
- Each page gets a quick before/after — they share `MarketingLayout`, so the nav already updates everywhere

### Before any of this lands

Ask the user for at least one concrete reference (URL of a SaaS landing page they want to mimic the feel of, or a Figma/Dribbble shot). Without that, this turns into multiple revert cycles — the most expensive failure mode. The brutalist style was clearly intentional and the user has reverted some of my prior copy choices locally; a visual pivot without explicit direction is a coin flip.

### Critical files

- `index.css` (lines 4–25 — the `@theme` color tokens)
- `views/marketing/LandingPage.tsx`
- `views/marketing/{Product,About,Pricing,Contact,Solutions,Infrastructure}Page.tsx`
- Reuse the existing pattern from `components/marketing/MarketingLayout.tsx` for nav

### Verification

- `npm run lint` clean, `npm test` 4/4 green
- Visual diff via the dev server: keep the old hero as a fallback route during PR A so reviewers can A/B
- Lighthouse score before/after on `/` — flag if CLS or LCP regresses

---

## 2. EmptyState migration across remaining list views

Mechanical. The component is already in `components/EmptyState.tsx` and wired into `TripManagement`. Other inline empty states still need to migrate.

### Targets (found via grep on commit `572058a`)

| View | Current pattern | Action |
|---|---|---|
| `views/admin/DNQueue.tsx` (line 418-ish) | Already friendly, just inline | Replace with `<EmptyState />` for visual consistency |
| `views/admin/AdminDashboard.tsx` (line 655 — `dns.length === 0`) | Inline | Replace |
| `views/admin/Invoicing.tsx` (line 398 — `trips.length === 0`) | Inline | Replace |
| `views/admin/MarketplaceView.tsx` (line 350 — "No results for current filter") | Filter-specific | Use `EmptyState` with secondary "Clear filters" action |
| `views/facility/FacilityPortal.tsx` shipments tabs | Currently shows empty `<tbody>` | Add `<EmptyState />` per tab |
| `views/driver/DriverPortal.tsx` line 295 — "No active deployments found" | Inline | Replace |
| `views/client/ClientPortal.tsx` | Verify; likely needs one for the customer's tracking history | Add if missing |

### Approach

Single PR that touches all of them, OR one PR per file (mechanical, low risk either way). Recommend single PR with a clear commit listing the views migrated. Each migration is 5-10 lines of diff.

### Sample replacement pattern

```tsx
// Before
<div className="py-20 text-center">
  <Icon className="mx-auto text-slate-200 mb-4" size={48} />
  <p className="text-[10px] font-black uppercase tracking-widest">No data</p>
</div>

// After
<EmptyState
  icon={<Icon size={32} />}
  title="No deliveries yet"
  description="When you create your first delivery note, it'll show up here."
  actionLabel="Create a delivery note"
  onAction={() => setShowEditModal(true)}
/>
```

### Verification

- `npm run lint` + `npm test` — should pass without changes; consider adding a smoke test that intentionally renders one view with empty data to lock in the rendering

---

## 3. App-wide `addNotification` sweep — the remaining 90+ calls

PR #12 fixed the worst-offender jargon. The rest read fine for the most part, but a sweep would catch the long tail.

### Approach

Don't do this as one mega-PR. Instead:

**Build a small helper** in `services/notifications.ts` (new file) that wraps `useAppStore.addNotification` with pre-baked templates for common outcomes:

```ts
export const notify = {
  saved: (entity: string) => addNotification(`${entity} saved.`, 'success'),
  created: (entity: string) => addNotification(`${entity} created.`, 'success'),
  deleted: (entity: string) => addNotification(`${entity} removed.`, 'info'),
  saveFailed: (entity: string) => addNotification(`Couldn't save the ${entity.toLowerCase()}. Please try again.`, 'error'),
  loadFailed: (entity: string) => addNotification(`Couldn't load ${entity.toLowerCase()}. Please try again.`, 'error'),
  // …
};
```

Then migrate views to call `notify.saved('Trip')` instead of bespoke strings. This trades a one-time refactor for consistent copy going forward + makes future tone changes a single-file edit.

**Ship in two PRs:**

- PR A: introduce the `notify` helper + migrate 3-4 views as proof. Establish the pattern.
- PR B: codemod-style sweep across the rest of the app. Mostly mechanical.

### Critical files (grep `addNotification\s*\(` for the full list)

Highest-frequency callers:
- `views/admin/TripManagement.tsx`
- `views/admin/UserManagement.tsx`
- `views/admin/DNQueue.tsx`
- `views/admin/TripDetail.tsx`
- `views/admin/WarehouseManagement.tsx`
- `components/TaskManagement.tsx`
- `components/PaymentModal.tsx`
- `views/driver/DriverPortal.tsx`

### Verification

- `npm run lint` clean
- Spot-check that the helper centralizes punctuation, capitalization, and "Please try again." consistently

---

## 4. Consuming `dashboardDensity` per dashboard

The data flows correctly from onboarding → `tenant.settings.dashboardDensity` ∈ `'compact' | 'standard' | 'comfortable'`. No view reads it yet.

### Strategy

Build a small hook + scale views from it.

**Step 1 — new hook:** `hooks/useDensity.ts`

```ts
import { useTenantStore } from '../store';

const SCALE: Record<'compact' | 'standard' | 'comfortable', {
  pad: string; // padding class
  gap: string; // grid/flex gap
  row: string; // row height
}> = {
  compact:     { pad: 'p-4', gap: 'gap-3', row: 'py-3' },
  standard:    { pad: 'p-6', gap: 'gap-4', row: 'py-4' },
  comfortable: { pad: 'p-8', gap: 'gap-6', row: 'py-6' },
};

export const useDensity = () => {
  const density = useTenantStore(s => s.currentTenant?.settings?.dashboardDensity) ?? 'standard';
  return { density, ...SCALE[density] };
};
```

**Step 2 — apply incrementally**, one dashboard per small PR:

1. `views/admin/AdminDashboard.tsx` — biggest visual win, most-used view
2. `views/admin/DNQueue.tsx` table rows
3. `views/admin/TripManagement.tsx` trip cards
4. `views/facility/FacilityPortal.tsx` bay grid
5. `views/driver/DriverPortal.tsx` — may not need it; driver UI is single-task

Each PR replaces hard-coded `p-X`/`gap-Y`/`py-Z` classes with values from `useDensity()` on the heaviest containers. Per PR: 10-30 line diff per view.

### Critical files

- `hooks/useDensity.ts` (new)
- `views/admin/*.tsx`
- `views/facility/FacilityPortal.tsx`

### Verification

- Visual diff: log in as a demo user with each `organizationSize` choice and confirm the dashboards re-render with appropriate spacing
- Add a Playwright smoke test: log in with `Size: 1-10 Units` and check `data-density="compact"` attribute on a root container (cheap to test, catches regression)

---

## Recommended order

The plan above can be done in any order, but optimizing for review-friendliness and minimum revert risk:

1. **EmptyState migration** — lowest risk, mechanical, builds momentum
2. **`notify` helper + first migration** — small, valuable, sets the pattern
3. **`dashboardDensity` hook + AdminDashboard application** — first user-visible payoff for the onboarding customization work
4. **`notify` sweep** — finish the long tail
5. **`dashboardDensity` extended** to remaining dashboards
6. **Landing v2 PR A (design tokens + hero)** — only after the user gives a concrete reference
7. **Landing v2 PR B (sections)**
8. **Landing v2 PR C (other marketing pages)**

Items 1–5 add up to ~5 PRs, each 15-30 min of edits + CI. Items 6–8 are the bigger lift (1-2 hours per PR) and need direction first.

## Out-of-scope reminders

- **eTIMS + M-Pesa real integration** is still flagged in `docs/delivery-note-lifecycle.md` as future work and depends on getting Daraja + KRA credentials
- **Replacing the fictional testimonials on the landing page** (Amara Diallo, FastCourier "250% revenue growth") with real pilot quotes — content decision, not engineering
- **Applying the `bays` migration in Supabase** is already done (PR #4 added the SQL); just remember to re-run it in production when you provision the cluster
