# Database Schema — IndexedDB (Dexie.js)

## Overview

Local-first schema designed for a single-user personal finance app. Optimized for fast reads, simple serialization to JSON for S3 backup, and future extensibility.

---

## Object Stores

### users

Single record store. Exists for backup/restore identity and future multi-device sync.

```
keyPath: "id"

{
  id: string (uuid)
  name: string
  email: string
  created_at: number (timestamp ms)
}
```
 
No additional indexes needed — single record, accessed by key only.

---

### categories

```
keyPath: "id"

{
  id: string (uuid)
  user_id: string | null    // null = default/system category
  name: string              // e.g. "Food", "Salary"
  type: "income" | "expense"
  icon: string              // emoji or icon name
  color: string             // hex color
  sort_order: number        // for custom ordering in UI
  is_archived: boolean      // soft delete — hide from pickers but keep for history
  created_at: number        // timestamp ms
}
```

**Indexes:**

| Index | KeyPath | Purpose |
|---|---|---|
| `by_type` | `type` | Filter categories by income/expense |
| `by_user` | `user_id` | Distinguish default vs custom categories |

---

### transactions

The core store. Denormalized with `category_name` and `category_type` for fast reads without lookups.

```
keyPath: "id"

{
  id: string (uuid)
  user_id: string
  category_id: string
  category_type: "income" | "expense"   // denormalized from category
  amount: number                         // always positive
  note: string                           // optional, default ""
  transaction_date: number               // timestamp ms, user-selected date
  tags: string[]                         // inline tags, no separate store needed
  created_at: number                     // timestamp ms
  updated_at: number                     // timestamp ms
}
```

**Indexes:**

| Index | KeyPath | Compound | Purpose |
|---|---|---|---|
| `by_date` | `transaction_date` | no | Sort/filter by date |
| `by_category` | `category_id` | no | Stats by category |
| `by_type` | `category_type` | no | Quick income vs expense filter |
| `by_user_date` | `[user_id, transaction_date]` | yes | Primary query: user's transactions by date range |
| `by_user_type_date` | `[user_id, category_type, transaction_date]` | yes | Stats: total income/expense in date range |
| `by_user_category_date` | `[user_id, category_id, transaction_date]` | yes | Stats: spending per category in date range |

---

### recurring_transactions (optional — future)

```
keyPath: "id"

{
  id: string (uuid)
  user_id: string
  category_id: string
  category_type: "income" | "expense"
  amount: number
  note: string
  frequency: "daily" | "weekly" | "monthly" | "yearly"
  start_date: number           // timestamp ms
  end_date: number | null      // null = no end
  last_generated_date: number  // track which occurrences have been created
  is_active: boolean
  created_at: number
}
```

**Indexes:**

| Index | KeyPath | Purpose |
|---|---|---|
| `by_active` | `[is_active, start_date]` | Find active recurrences to generate |

---

### budgets (optional — future)

```
keyPath: "id"

{
  id: string (uuid)
  user_id: string
  category_id: string | null   // null = total budget across all categories
  amount: number               // monthly limit
  month: string                // "2026-03" format for easy comparison
  created_at: number
}
```

**Indexes:**

| Index | KeyPath | Purpose |
|---|---|---|
| `by_month` | `[user_id, month]` | Get all budgets for a month |
| `by_category_month` | `[user_id, category_id, month]` | Get budget for specific category + month |

---

## Dexie.js Schema Declaration

```typescript
import Dexie, { type EntityTable } from 'dexie'

const db = new Dexie('minvoice') as Dexie & {
  users: EntityTable<User, 'id'>
  categories: EntityTable<Category, 'id'>
  transactions: EntityTable<Transaction, 'id'>
}

db.version(1).stores({
  users: 'id',
  categories: 'id, type, user_id',
  transactions: 'id, transaction_date, category_id, category_type, [user_id+transaction_date], [user_id+category_type+transaction_date], [user_id+category_id+transaction_date]',
})
```

---

## JSON Backup Format (S3)

```json
{
  "version": 1,
  "exported_at": 1711800000000,
  "user": { ... },
  "categories": [ ... ],
  "transactions": [ ... ]
}
```

- `version` — schema version for migration on restore.
- Full dump — simple, no incremental complexity for a single-user app.
- Restore = clear stores + bulk insert.

---

## Design Decisions

1. **Denormalized `category_type` on transactions** — Avoids joining categories just to filter income vs expense. Category list is small and rarely changes, so the duplication cost is negligible.

2. **Inline `tags: string[]`** — For a single-user app, a separate tags + junction store is overkill. Array field is sufficient and serializes cleanly to JSON. Tradeoff: cannot index individual tags efficiently in IndexedDB, but full-text search on small datasets is fast enough.

3. **`is_archived` on categories instead of delete** — Deleting a category would orphan transactions. Archiving hides it from the UI while preserving historical data integrity.

4. **`sort_order` on categories** — Lets the user reorder categories in the UI without re-sorting by name or created_at.

5. **Compound indexes** — IndexedDB compound indexes enable range queries like "all expenses for user X in March 2026" in a single indexed scan. This is the most important optimization for statistics pages.

6. **Timestamps as numbers (ms)** — Simpler to compare and index than ISO strings. Convert to Date objects only at the UI layer.

7. **UUID for IDs** — Safe for offline-first: no auto-increment conflicts if multi-device sync is added later.

---

## Future Extensions

### Budget tracking
Add `budgets` store (defined above). Query transactions by `[user_id+category_id+transaction_date]` to compare actual spend vs budget limit per month.

### Recurring transactions
Add `recurring_transactions` store (defined above). On app open, check `last_generated_date` and generate missing transaction records into `transactions` store.

### Multi-device sync with S3
- Add `updated_at` to all records.
- On sync: download latest S3 backup, merge by `id` using `updated_at` as conflict resolver (last-write-wins).
- Upload merged result back to S3.
- For simplicity, keep full-dump approach — dataset is small for personal use.
