# Powerful Mock History — Upgrade Plan

## 1. Cloud sync (login required)
- Enable **Lovable Cloud** so saved mocks persist across devices.
- **Email + password** sign up / log in (no Google for now — we can add later).
- Anonymous users keep using `localStorage` (offline mode). On first login we offer to **import local history into the cloud**.
- A header avatar shows sign-in state with Login / Logout actions.

> One question before I touch auth: do you want any extra **profile data** later (display name, avatar, coaching institute)? If yes I'll add a `profiles` table; if no I'll keep just email/password. Defaulting to **no profile table** unless you say otherwise — it can be added later without breaking anything.

## 2. Rich metadata per mock
Each saved record gains:
- **Mock date** (date picker, defaults to today)
- **Source / test series** (e.g. LegalEdge, CL, Career Launcher)
- **Mock type** chip — *Full*, *Sectional*, *Revision*, *Surprise*
- **Difficulty** — Easy / Medium / Hard / Brutal
- **Tags** — free-form chips (e.g. `weak-LR`, `time-pressure`)
- **Notes** — textarea for reflection
- Section snapshot is still stored, so accuracy/percentile recompute on demand.

## 3. Edit & duplicate
- ✏️ **Edit** opens a dialog to change label, metadata, even section attempt/correct numbers — saves recompute totals.
- 📋 **Duplicate** clones a mock as a new draft (handy for re-attempting the same paper).
- 🗑️ Existing delete stays.

## 4. Auto-snapshot + filtering
- **Auto-snapshot**: when you change inputs significantly (≥10 marks delta vs last unsaved snapshot), we keep the last 3 in a "Drafts" tray you can promote to a real saved mock.
- **Filter bar** above the history table: search by label, filter by tag chip, filter by source, sort by date / score / percentile.
- PDF export (already shipped) respects the active filter.

## Technical sketch (for reference)

```text
DB
└─ mocks (id, user_id, label, score, total, accuracy, percentile,
          rank, rank_mode, cohort_size, sections jsonb,
          mock_date, source, mock_type, difficulty, tags text[],
          notes, created_at, updated_at)
   RLS: user can CRUD only own rows.

Frontend
├─ src/hooks/use-auth.ts            ← session + user
├─ src/lib/mocks.functions.ts       ← createServerFn CRUD (requireSupabaseAuth)
├─ src/lib/mock-history.ts          ← unified API: cloud if signed in, else local
├─ src/components/AuthDialog.tsx    ← email/password sign in & sign up
├─ src/components/MockEditor.tsx    ← edit/duplicate dialog
└─ src/components/MockHistory.tsx   ← filters, tags, drafts, edit/duplicate buttons
```

## Build order
1. Enable Lovable Cloud + create `mocks` table with RLS.
2. Auth dialog + header user menu + import-local-on-first-login prompt.
3. `mocks.functions.ts` (list / upsert / delete) and unified history hook.
4. Rich metadata fields + edit / duplicate dialog.
5. Auto-snapshot drafts + filter/sort bar.
6. Wire PDF export to current filter.

Reply **go** to proceed (or tell me to drop anything). Confirm whether you want a `profiles` table for future display name / avatar.
