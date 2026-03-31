# Personal Finance App – Techstack & Deployment Strategy

## 🎯 Goal
- Personal use (single user)
- Simple, fast, low-cost (~free)
- Mobile-first (PWA), but usable on desktop
- No traditional backend
- Data is **local-first**, with optional cloud backup

---

## 🧱 Tech Stack

### Frontend
- Vue 3
- Inertia.js (optional, can be removed if overkill)
- Vite (build tool)
- PWA (service worker + manifest)

### Local Database
- IndexedDB (via Dexie or similar wrapper)

### Data Strategy
- Local-first:
  - All reads/writes happen in IndexedDB
  - UI must work fully offline

- Data model:
  - JSON-based structure (flexible, easy export/import)
  - Include metadata:
    - version
    - updated_at (timestamp)

---

## ☁️ Backup Strategy (No Backend)

### Storage
- Amazon S3 (private bucket)

### Backup Format
- Full JSON dump of local database

Example:
```json
{
  "version": 1,
  "updated_at": 1710000000,
  "data": { ... }
}