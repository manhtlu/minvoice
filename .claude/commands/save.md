Save the current implementation state to `memories/implementation-state.md`.

## Steps

1. Read the current `memories/implementation-state.md` to understand the existing state.
2. Scan the project to determine what has changed since the last save:
   - Check `git status` and `git log` for recent changes (if git is initialized).
   - Glob `src/**` to see what source files exist.
   - Review any new or modified docs in `docs/`.
3. Update `memories/implementation-state.md` with:
   - Move completed items from "In Progress" / "Not Started" to "Completed".
   - Update "In Progress" with current work.
   - Add any new tasks discovered to "Not Started".
   - Record new "Key Decisions" if any were made in this session.
   - Log any "Known Issues" encountered.
   - Update the "Last updated" date to today.
   - Update the "Phase" if it has changed (e.g., Planning → Development).
4. Confirm to the user what was updated.

## Rules

- Do NOT read all source files in detail — only scan file names and structure.
- Keep the file concise and scannable.
- Use checkbox format: `- [x]` done, `- [ ]` not started.
- Respond in Vietnamese.
