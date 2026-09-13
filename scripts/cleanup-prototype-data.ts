/**
 * NestWell Prototype Data Cleanup (ONE-TIME, DELIBERATE EXECUTION ONLY)
 *
 * Removes known prototype/mock records from Cloud Firestore so the
 * application starts from a clean production state:
 *
 *   platformUsers/   -> only real bootstrapped Platform Admin(s) remain
 *   societies/       -> empty (real societies are created via onboarding)
 *   societyInvites/  -> empty
 *   platformAnalytics/ -> empty (rebuilt from real data)
 *   supportSessions/ -> empty
 *   users/           -> legacy flat prototype collection (superseded by
 *                       platformUsers + societies/{id}/members)
 *
 * NEVER runs automatically. Requires:
 *   1. GOOGLE_APPLICATION_CREDENTIALS pointing at a service-account key
 *      with Firestore access, OR firebase-admin default credentials.
 *   2. Explicit --confirm flag.
 *   3. Explicit --project and --database (named database supported).
 *
 * NEVER touches Firebase Authentication accounts.
 *
 * Usage:
 *   npx tsx scripts/cleanup-prototype-data.ts \
 *     --project gen-lang-client-0898030963 \
 *     --database "(default)" \
 *     --confirm
 *
 * Dry run (lists what WOULD be deleted, deletes nothing):
 *   npx tsx scripts/cleanup-prototype-data.ts \
 *     --project gen-lang-client-0898030963 \
 *     --database "(default)"
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

interface Args {
  project: string;
  database: string;
  confirm: boolean;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i >= 0 && i + 1 < argv.length ? argv[i + 1] : undefined;
  };
  return {
    project: get('--project') || '',
    database: get('--database') || '(default)',
    confirm: argv.includes('--confirm'),
  };
}

// Document IDs / markers that identify prototype records.
const PROTOTYPE_SOCIETY_IDS = ['greenwood-heights'];
const PROTOTYPE_CREATED_BY = ['system-bootstrap', 'seed', 'demo'];

async function deleteCollection(
  db: FirebaseFirestore.Firestore,
  path: string,
  stats: { deleted: number }
): Promise<void> {
  const snap = await db.collection(path).listDocuments();
  for (const docRef of snap) {
    // Recurse into subcollections first
    const subcollections = await docRef.listCollections();
    for (const sub of subcollections) {
      await deleteCollection(db, `${path}/${docRef.id}/${sub.id}`, stats);
    }
    await docRef.delete();
    stats.deleted += 1;
  }
}

async function main(): Promise<void> {
  const args = parseArgs();
  if (!args.project) {
    console.error('Missing --project <project-id>');
    process.exit(1);
  }

  if (getApps().length === 0) {
    initializeApp({ projectId: args.project });
  }
  const db = getFirestore(args.database === '(default)' ? undefined : args.database);

  console.log(`Project:  ${args.project}`);
  console.log(`Database: ${args.database}`);
  console.log(`Mode:     ${args.confirm ? 'DELETE (confirmed)' : 'DRY RUN (no changes)'}`);
  console.log('');

  // 1. Discover root collections
  const rootCollections = await db.listCollections();
  console.log('Root collections:', rootCollections.map((c) => c.id).join(', ') || '(none)');
  console.log('');

  const targets: string[] = [];

  // 2. Legacy flat prototype collection (superseded data model)
  if (rootCollections.some((c) => c.id === 'users')) {
    targets.push('users');
  }

  // 3. Known prototype societies (full subtree)
  for (const sid of PROTOTYPE_SOCIETY_IDS) {
    const snap = await db.doc(`societies/${sid}`).get();
    if (snap.exists) {
      targets.push(`societies/${sid}`);
    }
  }

  // 4. Societies created by bootstrap/seed markers
  const societiesSnap = await db.collection('societies').get().catch(() => null);
  if (societiesSnap) {
    for (const doc of societiesSnap.docs) {
      const data = doc.data() as Record<string, unknown>;
      if (
        typeof data['createdBy'] === 'string' &&
        PROTOTYPE_CREATED_BY.includes(data['createdBy'] as string) &&
        !targets.includes(`societies/${doc.id}`)
      ) {
        targets.push(`societies/${doc.id}`);
      }
    }
  }

  // 5. Orphaned prototype analytics for deleted societies
  const analyticsSnap = await db.collection('platformAnalytics').get().catch(() => null);
  if (analyticsSnap) {
    for (const doc of analyticsSnap.docs) {
      const data = doc.data() as Record<string, unknown>;
      if (
        PROTOTYPE_SOCIETY_IDS.includes(doc.id) ||
        (typeof data['societyId'] === 'string' &&
          PROTOTYPE_SOCIETY_IDS.includes(data['societyId'] as string))
      ) {
        targets.push(`platformAnalytics/${doc.id}`);
      }
    }
  }

  if (targets.length === 0) {
    console.log('No prototype records found. Database is already clean.');
    return;
  }

  console.log('Prototype targets:');
  for (const t of targets) {
    console.log(`  - ${t}`);
  }
  console.log('');

  if (!args.confirm) {
    console.log('DRY RUN complete. Re-run with --confirm to delete.');
    return;
  }

  let deleted = 0;
  for (const t of targets) {
    const stats = { deleted: 0 };
    if (t.includes('/')) {
      // Single document path (possibly with subtree)
      const docRef = db.doc(t);
      const subcollections = await docRef.listCollections();
      for (const sub of subcollections) {
        await deleteCollection(db, `${t}/${sub.id}`, stats);
      }
      const snap = await docRef.get();
      if (snap.exists) {
        await docRef.delete();
        stats.deleted += 1;
      }
    } else {
      await deleteCollection(db, t, stats);
    }
    console.log(`Deleted ${stats.deleted} doc(s) under ${t}`);
    deleted += stats.deleted;
  }

  console.log('');
  console.log(`Cleanup complete. Total documents deleted: ${deleted}`);
  console.log('Firebase Authentication accounts were NOT touched.');
}

main().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
