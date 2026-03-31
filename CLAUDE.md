# CLAUDE.md — minvoice

## Project overview

Personal finance app (single user). Local-first PWA built with Vue 3 + Vite, IndexedDB for storage, optional S3 backup. See below for where to find details.

## Context loading rules

To save context, do NOT read files eagerly. Only load what is needed for the current task:

- **Business/domain docs** → `docs/` directory. Read only the relevant file for the feature being discussed.
- **Tech stack & deployment** → `techstack.md` (project root).
- **Implementation status & progress** → `memories/` directory. Check here before starting work to understand what has been built.
- **Do NOT** bulk-read all docs or all source files upfront. Read on demand.

## Language

- The user communicates in Vietnamese. Respond in Vietnamese unless asked otherwise.
- Code, comments, commit messages, and variable names must be in English.

## Code style

- Vue 3 Composition API with `<script setup>` syntax.
- TypeScript for all `.ts` and `.vue` files.
- Use Dexie.js for IndexedDB access.
- CSS: scoped styles in SFCs, mobile-first responsive design.
- Prefer small, focused components. One component = one responsibility.
- No unnecessary abstractions — keep it simple for a single-user app.

## File & folder conventions

- `src/components/` — reusable UI components.
- `src/views/` or `src/pages/` — page-level components.
- `src/stores/` — Pinia stores (if used).
- `src/db/` — Dexie database schema and helpers.
- `src/types/` — shared TypeScript types/interfaces.
- `docs/` — business requirements and design docs (not code).
- `memories/` — implementation status tracking (managed by Claude memory system).

## Development workflow

- Run `npm run dev` for local development.
- Run `npm run build` to build for production.
- Run `npm run lint` to check code quality.
- Don't run build commands, let user run it manually

## Git

- Commit messages in English, concise, imperative mood.
- Do NOT commit unless explicitly asked.
- Do NOT push unless explicitly asked.

## Custom commands

### `/save`
Save current implementation state to `memories/implementation-state.md`. Run this after completing a feature or making key decisions. Scans project structure (not source code content) and updates the state file.

### `/recall`
Read back implementation state from `memories/implementation-state.md` and give a quick status summary. Use this at the start of a new conversation to restore context without re-reading source code.

---

## What to avoid

- No over-engineering. This is a personal app, not an enterprise system.
- No backend/API calls for core functionality — everything runs locally.
- No mocking in tests unless absolutely necessary — prefer real IndexedDB (via fake-indexeddb or similar).
- Do not add packages without discussing with the user first.
- Do not create README.md or other documentation files unless asked.
