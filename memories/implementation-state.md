# Implementation State

> Last updated: 2026-03-31

## Phase: Development

## Completed

- [x] Project structure created (docs/, memories/)
- [x] Tech stack defined (techstack.md)
- [x] Business requirements documented (docs/overview.md)
- [x] Database schema designed (docs/database-schema.md)
- [x] CLAUDE.md configured
- [x] Initialize Vue 3 + Vite + TypeScript project
- [x] Setup Dexie.js database with schema (`src/db/index.ts`, `src/db/types.ts`)
- [x] App shell: router, AppHeader, BottomNav, layout
- [x] Views scaffolded: Home, Transactions, AddTransaction, Stats, Budgets, Categories, Settings
- [x] Category management — list by expense/income tabs, add via bottom sheet (name, icon, color)
- [x] Category edit — long press opens edit sheet (rename, change icon/color), delete with confirmation
- [x] Category icon system — CategoryIcon component with Phosphor Icons (96 icons), color picker (16 colors)
- [x] Bottom nav updated: replaced Stats with Categories menu item
- [x] Settings view with import/export data functionality
- [x] Composable: `useObservable` for Dexie liveQuery reactivity

## In Progress

- [ ] Transaction management (AddTransactionView exists but needs verification)
- [ ] Home view dashboard

## Not Started

- [ ] Statistics / reporting views (Stats menu removed from nav, view still exists)
- [ ] PWA setup (service worker + manifest)
- [ ] S3 backup export/import
- [ ] Budget tracking (BudgetsView exists but needs verification)
- [ ] Recurring transactions (optional)

## Key Decisions

| Decision | Detail |
|---|---|
| No wallet feature | Simplified — single implicit wallet |
| Categories | income / expense only (no saving type) |
| Tags | Inline string[] on transactions, no separate store |
| Denormalization | category_type stored on transactions for fast reads |
| IDs | UUID — offline-safe, sync-ready |
| Category sort | sort_order not indexed in Dexie — sort in JS after toArray() |
| Bottom nav | 5 items: Home, Transactions, Add(center), Categories, Settings |
| Phosphor Icons | @phosphor-icons/vue — async loaded via CategoryIcon component |

## Known Issues

- TypeScript errors in CategoriesView.vue: CATEGORY_ICONS/CATEGORY_COLORS array `as const` causes narrow type inference issues with `v-model`-like bindings (cosmetic, does not affect runtime)
- `sort_order` field not indexed in Dexie schema — `orderBy('sort_order')` fails silently, workaround: sort in JS
