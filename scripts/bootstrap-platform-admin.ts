/**
 * NestWell Platform Admin Bootstrap (ONE-TIME, DELIBERATE EXECUTION ONLY)
 *
 * Grants `platform_admin` to exactly one Firebase Authentication user by
 * writing their `platformUsers/{uid}` document via the Admin SDK (bypasses
 * security rules by design — this is the trusted bootstrap path).
 *
 * Normal client signup can NEVER create a platform admin: the client
 * `syncPlatformUser` always writes `platformRole: null`, and the security
 * rules reject client writes to `platformRole`.
 *
 * Prerequisites:
 *   1. `npm install -g firebase-admin tsx` (or add to devDependencies)
 *   2. Service-account key JSON with Firebase Admin + Firestore access:
 *        export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
 *   3. The admin's Firebase Auth account must already exist
 *      (create it via the app signup screen or Firebase Console first).
 *
 * Usage:
 *   npx tsx scripts/bootstrap-platform-admin.ts \
 *     --email admin@nestwell.in \
 *     --project gen-lang-client-0898030963 \
 *     --database "ai-studio-nestwellsocietya-xxx" \
 *     --confirm
 *
 * Dry run (verifies the Auth user exists, writes nothing):
 *   npx tsx scripts/bootstrap-platform-admin.ts \
 *     --email admin@nestwell.in \
 *     --project gen-lang-client-0898030963 \
 *     --database "ai-studio-nestwellsocietya-xxx"
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

function parseArgs() {
  const argv = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i >= 0 && i + 1 < argv.length ? argv[i + 1] : undefined;
  };
  return {
    email: get('--email') || '',
    project: get('--project') || '',
    database: get('--database') || '(default)',
    confirm: argv.includes('--confirm'),
  };
}

async function main(): Promise<void> {
  const args = parseArgs();
  if (!args.email || !args.project) {
    console.error('Usage: --email <admin-email> --project <project-id> [--database <db>] [--confirm]');
    process.exit(1);
  }

  if (getApps().length === 0) {
    initializeApp({ projectId: args.project });
  }
  const auth = getAuth();
  const db = getFirestore(args.database === '(default)' ? undefined : args.database);

  // 1. Verify the Auth user exists (never create auth accounts silently)
  let uid: string;
  try {
    const user = await auth.getUserByEmail(args.email);
    uid = user.uid;
    console.log(`Auth user found: ${args.email} (uid: ${uid})`);
  } catch {
    console.error(`No Firebase Auth account exists for ${args.email}.`);
    console.error('Create the account first (app signup or Firebase Console), then re-run.');
    process.exit(1);
  }

  // 2. Read existing platformUsers doc
  const ref = db.doc(`platformUsers/${uid}`);
  const snap = await ref.get();
  const existing = snap.exists ? (snap.data() as Record<string, unknown>) : null;
  console.log(`Existing platformUsers/${uid}:`, existing ? JSON.stringify(existing) : '(none)');

  if (existing?.['platformRole'] === 'platform_admin') {
    console.log('User is already a platform admin. Nothing to do.');
    return;
  }

  if (!args.confirm) {
    console.log('');
    console.log('DRY RUN: would set platformRole = "platform_admin". Re-run with --confirm to apply.');
    return;
  }

  // 3. Grant platform admin (merge: never clobber existing profile fields)
  await ref.set(
    {
      id: uid,
      email: args.email,
      platformRole: 'platform_admin',
      updatedAt: new Date().toISOString(),
      ...(existing ? {} : { name: args.email.split('@')[0], societyIds: [], createdAt: new Date().toISOString() }),
    },
    { merge: true }
  );

  // 4. Audit the bootstrap in a platform-level log (best effort)
  await db.collection('platformAuditLogs').add({
    actorId: uid,
    actorEmail: args.email,
    action: 'PLATFORM_ADMIN_BOOTSTRAP',
    targetType: 'PlatformUser',
    targetId: uid,
    timestamp: FieldValue.serverTimestamp(),
    note: 'One-time trusted bootstrap via Admin SDK',
  }).catch((e) => console.warn('Audit log write skipped:', e));

  console.log('');
  console.log(`SUCCESS: ${args.email} is now a NestWell platform admin.`);
}

main().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
