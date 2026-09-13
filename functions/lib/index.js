/**
 * NestWell Cloud Functions — trusted backend workflows.
 *
 * All functions operate on the NAMED Firestore database
 * (ai-studio-nestwellsocietya-3362f689-fc24-4131-9685-c6aa5e473e20)
 * via the Admin SDK (bypasses security rules by design).
 *
 *  - acceptInvite   (callable): server-validated invitation acceptance
 *  - confirmPayment (callable): server-confirmed payment recording
 *  - castVote       (callable): duplicate-protected vote casting
 *  - analytics triggers: rebuild platformAnalytics/{societyId} rollups
 */
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
initializeApp();
const DB_ID = 'ai-studio-nestwellsocietya-3362f689-fc24-4131-9685-c6aa5e473e20';
const db = getFirestore(DB_ID);
const REGION = 'asia-south1';
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function requireAuthEmail(request) {
    const email = request.auth?.token?.email?.toLowerCase();
    if (!email) {
        throw new HttpsError('unauthenticated', 'Sign-in required.');
    }
    return email;
}
async function audit(societyId, entry) {
    await db
        .collection('societies')
        .doc(societyId)
        .collection('auditLogs')
        .add({ ...entry, timestamp: FieldValue.serverTimestamp() });
}
// ---------------------------------------------------------------------------
// acceptInvite — server-validated invitation acceptance
// ---------------------------------------------------------------------------
export const acceptInvite = onCall({ region: REGION }, async (request) => {
    const email = requireAuthEmail(request);
    const uid = request.auth.uid;
    const code = String(request.data?.code || '').trim().toUpperCase();
    if (!code) {
        throw new HttpsError('invalid-argument', 'Invitation code is required.');
    }
    const inviteRef = db.collection('societyInvites').doc(code);
    const inviteSnap = await inviteRef.get();
    if (!inviteSnap.exists) {
        throw new HttpsError('not-found', 'Invitation code not found.');
    }
    const invite = inviteSnap.data();
    if (invite.status !== 'pending') {
        throw new HttpsError('failed-precondition', `Invitation is ${invite.status}.`);
    }
    if (new Date(invite.expiresAt).getTime() < Date.now()) {
        await inviteRef.update({ status: 'expired' });
        throw new HttpsError('failed-precondition', 'Invitation has expired.');
    }
    if (String(invite.email).toLowerCase() !== email) {
        throw new HttpsError('permission-denied', 'Invitation was sent to a different email.');
    }
    const societyId = invite.societyId;
    const now = new Date().toISOString();
    const userRecord = await import('firebase-admin/auth').then((m) => m.getAuth().getUser(uid).catch(() => null));
    const batch = db.batch();
    batch.set(db.collection('societies').doc(societyId).collection('members').doc(uid), {
        id: uid,
        uid,
        societyId,
        name: userRecord?.displayName || email.split('@')[0],
        email,
        phone: userRecord?.phoneNumber || '',
        role: invite.intendedRole,
        status: 'active',
        flatId: invite.flatId || '',
        flatNumber: '',
        towerName: '',
        type: 'Owner',
        profileComplete: false,
        invitedBy: invite.createdBy,
        joinedAt: now,
        createdAt: now,
        updatedAt: now,
    }, { merge: true });
    batch.update(inviteRef, { status: 'accepted', acceptedBy: uid, acceptedAt: now });
    const platformRef = db.collection('platformUsers').doc(uid);
    const platformSnap = await platformRef.get();
    const existingIds = platformSnap.exists
        ? platformSnap.data().societyIds || []
        : [];
    batch.set(platformRef, {
        id: uid,
        email,
        societyIds: Array.from(new Set([...existingIds, societyId])),
        currentSocietyId: societyId,
        updatedAt: now,
    }, { merge: true });
    await batch.commit();
    await audit(societyId, {
        actorId: uid,
        actorName: email,
        actorRole: invite.intendedRole,
        action: 'ACCEPT_INVITATION',
        targetType: 'SocietyInvite',
        targetId: code,
        reason: `Joined as ${invite.intendedRole} (server-validated)`,
    });
    return { societyId };
});
// ---------------------------------------------------------------------------
// confirmPayment — server-confirmed payment recording
// ---------------------------------------------------------------------------
export const confirmPayment = onCall({ region: REGION }, async (request) => {
    requireAuthEmail(request);
    const { societyId, billId, method, transactionId, amount } = request.data || {};
    if (!societyId || !billId || !method || !transactionId) {
        throw new HttpsError('invalid-argument', 'societyId, billId, method and transactionId are required.');
    }
    // Caller must be an active member of the society.
    const memberSnap = await db
        .collection('societies').doc(String(societyId))
        .collection('members').doc(request.auth.uid).get();
    if (!memberSnap.exists || memberSnap.data().status !== 'active') {
        throw new HttpsError('permission-denied', 'Active society membership required.');
    }
    const billRef = db.collection('societies').doc(String(societyId)).collection('bills').doc(String(billId));
    const billSnap = await billRef.get();
    if (!billSnap.exists) {
        throw new HttpsError('not-found', 'Bill not found.');
    }
    if (billSnap.data().status === 'Paid') {
        throw new HttpsError('failed-precondition', 'Bill is already paid.');
    }
    const now = new Date().toISOString();
    const paymentId = `pay-${Date.now()}`;
    const batch = db.batch();
    batch.update(billRef, {
        status: 'Paid',
        paidAt: now,
        paymentMethod: String(method),
        transactionId: String(transactionId),
    });
    batch.set(db.collection('societies').doc(String(societyId)).collection('payments').doc(paymentId), {
        id: paymentId,
        societyId: String(societyId),
        billId: String(billId),
        amount: Number(amount) || 0,
        currency: 'INR',
        provider: String(method),
        providerTransactionId: String(transactionId),
        status: 'confirmed',
        initiatedAt: now,
        confirmedAt: now,
        createdAt: now,
    });
    await batch.commit();
    await audit(String(societyId), {
        actorId: request.auth.uid,
        actorName: request.auth.token.email,
        actorRole: memberSnap.data().role,
        action: 'CONFIRM_PAYMENT',
        targetType: 'MaintenanceBill',
        targetId: String(billId),
        reason: `Payment confirmed via ${method}`,
    });
    return { paymentId, status: 'confirmed' };
});
// ---------------------------------------------------------------------------
// castVote — duplicate-protected vote casting
// ---------------------------------------------------------------------------
export const castVote = onCall({ region: REGION }, async (request) => {
    requireAuthEmail(request);
    const { societyId, electionId, position, candidateId } = request.data || {};
    if (!societyId || !electionId || !position || !candidateId) {
        throw new HttpsError('invalid-argument', 'societyId, electionId, position and candidateId are required.');
    }
    const uid = request.auth.uid;
    const memberSnap = await db
        .collection('societies').doc(String(societyId))
        .collection('members').doc(uid).get();
    if (!memberSnap.exists || memberSnap.data().status !== 'active') {
        throw new HttpsError('permission-denied', 'Active society membership required.');
    }
    const electionRef = db.collection('societies').doc(String(societyId)).collection('elections').doc(String(electionId));
    const electionSnap = await electionRef.get();
    if (!electionSnap.exists) {
        throw new HttpsError('not-found', 'Election not found.');
    }
    if (electionSnap.data().status !== 'Voting Active' && electionSnap.data().status !== 'voting') {
        throw new HttpsError('failed-precondition', 'Election is not open for voting.');
    }
    // Deterministic vote ID prevents duplicates: one vote per voter per position.
    const voteId = `vote-${String(electionId)}-${String(position).replace(/[^a-z0-9]/gi, '')}-${uid}`;
    const voteRef = db.collection('societies').doc(String(societyId))
        .collection('elections').doc(String(electionId))
        .collection('votes').doc(voteId);
    if ((await voteRef.get()).exists) {
        throw new HttpsError('already-exists', 'You have already voted for this position.');
    }
    const now = new Date().toISOString();
    const batch = db.batch();
    batch.set(voteRef, {
        id: voteId,
        societyId: String(societyId),
        electionId: String(electionId),
        position: String(position),
        candidateId: String(candidateId),
        voterId: uid,
        voterFlat: memberSnap.data().flatNumber || '',
        castAt: now,
    });
    batch.update(db.collection('societies').doc(String(societyId))
        .collection('elections').doc(String(electionId))
        .collection('nominations').doc(String(candidateId)), { voteCount: FieldValue.increment(1) });
    batch.update(electionRef, { totalVotesCast: FieldValue.increment(1) });
    await batch.commit();
    return { voteId };
});
// ---------------------------------------------------------------------------
// Analytics rollups (derived, rebuildable, non-authoritative)
// ---------------------------------------------------------------------------
async function rebuildAnalytics(societyId) {
    const base = db.collection('societies').doc(societyId);
    const [members, complaints, bills, visitors, bookings, society] = await Promise.all([
        base.collection('members').where('status', '==', 'active').count().get(),
        base.collection('complaints').where('status', 'in', ['reported', 'assigned', 'started']).count().get(),
        base.collection('bills').get(),
        base.collection('visitors').get(),
        base.collection('facilityBookings').get(),
        base.get(),
    ]);
    let outstanding = 0;
    let collected = 0;
    for (const d of bills.docs) {
        const b = d.data();
        if (b.status === 'Paid') {
            collected += Number(b.totalAmount) || 0;
        }
        else {
            outstanding += Number(b.totalAmount) || 0;
        }
    }
    const thirtyDaysAgo = Date.now() - 30 * 24 * 3600 * 1000;
    let recentVisitors = 0;
    for (const d of visitors.docs) {
        const created = d.data().createdAt ? new Date(d.data().createdAt).getTime() : 0;
        if (created >= thirtyDaysAgo)
            recentVisitors += 1;
    }
    const monthPrefix = new Date().toISOString().slice(0, 7);
    let monthBookings = 0;
    for (const d of bookings.docs) {
        const created = String(d.data().createdAt || '');
        if (created.startsWith(monthPrefix))
            monthBookings += 1;
    }
    const sdata = society.exists ? society.data() : {};
    await db.collection('platformAnalytics').doc(societyId).set({
        societyId,
        societyName: sdata.name || societyId,
        city: sdata.city || '',
        status: sdata.status || '',
        totalResidents: members.data().count,
        activeComplaints: complaints.data().count,
        outstandingAmount: outstanding,
        paymentsCollected: collected,
        visitorCountLast30Days: recentVisitors,
        facilityBookingsThisMonth: monthBookings,
        lastUpdatedAt: new Date().toISOString(),
    });
}
const triggerOpts = { region: REGION, database: DB_ID, retry: false };
function analyticsTrigger(collection, name) {
    return onDocumentWritten({ ...triggerOpts, document: `societies/{societyId}/${collection}/{docId}` }, async (event) => {
        const societyId = event.params.societyId;
        if (!societyId)
            return;
        await rebuildAnalytics(societyId);
    });
}
export const onMemberWrite = analyticsTrigger('members', 'onMemberWrite');
export const onComplaintWrite = analyticsTrigger('complaints', 'onComplaintWrite');
export const onBillWrite = analyticsTrigger('bills', 'onBillWrite');
export const onVisitorWrite = analyticsTrigger('visitors', 'onVisitorWrite');
export const onBookingWrite = analyticsTrigger('facilityBookings', 'onBookingWrite');
