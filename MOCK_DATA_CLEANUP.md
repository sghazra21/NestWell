# NestWell — Manual Mock/Prototype Data Cleanup Guide

This guide explains how to identify and remove prototype/mock data from the
NestWell Firestore database so the app starts from a clean production state.

> **Never touch Firebase Authentication accounts during cleanup.**
> Only Firestore documents are removed. Auth users are recreated/kept intact.

Project: `gen-lang-client-0898030963`
Database: `ai-studio-nestwellsocietya-3362f689-fc24-4131-9685-c6aa5e473e20`

---

## 1. What counts as prototype data

| Marker | Meaning |
|---|---|
| `societies/greenwood-heights` (entire subtree) | Auto-seeded demo tenant |
| Any `societies/{id}` with `createdBy: "system-bootstrap"`, `"seed"`, or `"demo"` | Seeded tenant |
| `users/` (root collection) | Legacy flat prototype model (superseded by `platformUsers` + `societies/{id}/members`) |
| `platformAnalytics/{id}` for deleted/prototype societies | Fabricated metrics |
| Records referencing `greenwood.in` emails, `Sayan Ghosh`, `Rahul Verma` | Demo personas |

Expected clean state:

```text
platformUsers/     -> only real bootstrapped Platform Admin(s)
societies/         -> empty (real societies come from onboarding)
societyInvites/    -> empty
platformAnalytics/ -> empty
supportSessions/   -> empty
```

---

## 2. Option A — Firebase Console (manual, safest for small data)

1. Open [Firestore Database](https://console.firebase.google.com/project/gen-lang-client-0898030963/firestore)
   and select the `ai-studio-nestwellsocietya-...` database.
2. For each prototype collection/document above:
   - Open the document → ⋮ menu → **Delete document**.
   - For `societies/greenwood-heights`, tick **delete subcollections** (or
     delete each subcollection: `towers`, `flats`, `members`, `visitors`,
     `complaints`, `bills`, `payments`, `facilities`, `facilityBookings`,
     `notices`, `elections`, `auditLogs`).
3. Verify the **Data** tab shows only the expected clean state.

## 3. Option B — Cleanup script (repeatable, audited)

Prerequisites: Node 22+, a service-account key with Firestore access.

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# Dry run first — lists targets, deletes nothing:
npx tsx scripts/cleanup-prototype-data.ts \
  --project gen-lang-client-0898030963 \
  --database ai-studio-nestwellsocietya-3362f689-fc24-4131-9685-c6aa5e473e20

# Deliberate execution:
npx tsx scripts/cleanup-prototype-data.ts \
  --project gen-lang-client-0898030963 \
  --database ai-studio-nestwellsocietya-3362f689-fc24-4131-9685-c6aa5e473e20 \
  --confirm
```

The script never runs automatically, never touches Auth, and reports every
deleted document.

## 4. Option C — Firebase CLI (targeted deletes)

```bash
firebase login --no-localhost

# Delete the whole prototype tenant (recursive):
firebase firestore:delete \
  --project gen-lang-client-0898030963 \
  --database ai-studio-nestwellsocietya-3362f689-fc24-4131-9685-c6aa5e473e20 \
  -r societies/greenwood-heights

# Delete the legacy flat collection:
firebase firestore:delete \
  --project gen-lang-client-0898030963 \
  --database ai-studio-nestwellsocietya-3362f689-fc24-4131-9685-c6aa5e473e20 \
  -r users
```

## 5. Verification after cleanup

1. **Console**: Data tab matches the expected clean state above.
2. **App**: open the deployed app → sign in → you should see
   "You are not a member of any society yet" (or the Platform Console if
   bootstrapped as admin). No residents, bills, visitors, or numbers.
3. **Automated**: run the production test series —
   `bash scripts/verify-production.sh` — all categories must pass.

## 6. If real data exists alongside prototype data

Do NOT wipe whole collections. Instead:

1. Export a backup first (Firestore → Import/Export in Console).
2. Delete only the documented prototype markers from §1
   (specific society IDs, `createdBy` markers, legacy `users/` docs).
3. Re-run verification (§5) and confirm real societies/members are intact.
