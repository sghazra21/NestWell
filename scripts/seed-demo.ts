/**
 * NestWell Demo Seeding Script
 *
 * Creates a realistic test society with towers, flats, residents,
 * complaints, notices, facilities, visitors, elections, and bills.
 *
 * Uses Firebase Admin SDK to bypass security rules.
 *
 * Prerequisites:
 *   1. npm install -g firebase-admin tsx (or add to devDependencies)
 *   2. Service-account key JSON: export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
 *
 * Usage:
 *   npx tsx scripts/seed-demo.ts \
 *     --project gen-lang-client-0898030963 \
 *     --database "ai-studio-nestwellsocietya-xxx" \
 *     --society demo-society \
 *     --confirm
 *
 * Dry run (verifies config, writes nothing):
 *   npx tsx scripts/seed-demo.ts \
 *     --project gen-lang-client-0898030963 \
 *     --society demo-society
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

function parseArgs() {
  const argv = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i >= 0 && i + 1 < argv.length ? argv[i + 1] : undefined;
  };
  return {
    project: get('--project') || '',
    database: get('--database') || '(default)',
    society: get('--society') || 'demo-greenview',
    confirm: argv.includes('--confirm'),
  };
}

function randomId(): string {
  return Math.random().toString(36).substring(2, 10);
}

async function main(): Promise<void> {
  const args = parseArgs();
  if (!args.project) {
    console.error('Usage: --project <project-id> [--database <db>] [--society <id>] [--confirm]');
    process.exit(1);
  }

  if (getApps().length === 0) {
    initializeApp({ projectId: args.project });
  }
  const db = getFirestore(args.database === '(default)' ? undefined : args.database);

  if (!args.confirm) {
    console.log('DRY RUN — would seed society data. Re-run with --confirm to apply.');
    return;
  }

  const societyId = args.society;
  console.log(`Seeding society: ${societyId}`);

  // ─── 1. Society ───
  const society = {
    id: societyId,
    name: 'Greenview Heights',
    legalName: 'Greenview Heights Apartment Owners Welfare Association',
    city: 'Mumbai',
    address: '12 MG Road, Bandra West, Mumbai 400050',
    status: 'active',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    features: {
      facilityBooking: true,
      visitorManagement: true,
      maintenanceBilling: true,
      complaints: true,
      elections: true,
      notices: true,
    },
    registeredNumber: `RWA-MUM-2026-${Math.floor(1000 + Math.random() * 900)}`,
    totalFlats: 0,
    totalResidents: 0,
    createdAt: new Date().toISOString(),
    createdBy: 'system',
    updatedAt: new Date().toISOString(),
  };
  await db.doc(`societies/${societyId}`).set(society);
  console.log('  ✓ Society created');

  // ─── 2. Towers ───
  const towerData = [
    { code: 'A', name: 'Tower A', floors: 14 },
    { code: 'B', name: 'Tower B', floors: 14 },
  ];
  for (const t of towerData) {
    await db.doc(`societies/${societyId}/towers/tower-${t.code.toLowerCase()}`).set({
      ...t,
      id: `tower-${t.code.toLowerCase()}`,
      societyId,
      totalFlats: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  console.log('  ✓ Towers created');

  // ─── 3. Flats ───
  const flatIds: string[] = [];
  const residentNames = [
    'Amit Sharma', 'Priya Patel', 'Rajesh Kumar', 'Sneha Iyer', 'Vikram Desai',
    'Anjali Mehta', 'Sanjay Gupta', 'Kavita Nair', 'Mohit Singh', 'Pooja Reddy',
    'Arjun Rao', 'Deepa Joshi', 'Rohan Malhotra', 'Neha Kapoor', 'Suresh Pillai',
    'Meera Bhat', 'Karthik Menon', 'Ritu Agarwal', 'Ajay Thakur', 'Smita Kulkarni',
    'Ravi Teja', 'Pallavi Deshmukh', 'Nitin Bhatt', 'Shruti Kulkarni', 'Abhishek Jha',
  ];
  let flatIndex = 0;

  for (const tower of towerData) {
    const floorsCount = tower.floors;
    for (let floor = 1; floor <= floorsCount; floor++) {
      const units = ['A', 'B', 'C', 'D'];
      for (const unit of units) {
        if (flatIndex >= 40) break; // cap demo at 40 flats
        const flatNumber = `${tower.code}-${floor}${unit.padStart(2, '0')}`;
        const flatId = `flat-${flatNumber.toLowerCase()}`;
        flatIds.push(flatId);
        const residentName = residentNames[flatIndex % residentNames.length];
        const isOccupied = flatIndex < 25;
        const flatType = flatIndex % 3 === 0 ? '3BHK' : '2BHK';

        await db.doc(`societies/${societyId}/flats/${flatId}`).set({
          id: flatId,
          number: flatNumber,
          towerId: `tower-${tower.code.toLowerCase()}`,
          towerName: tower.name,
          floor,
          type: flatType,
          status: isOccupied ? 'occupied' : 'vacant',
          ownerIds: isOccupied ? [`uid-${flatIndex}`] : [],
          tenantIds: [],
          societyId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Create member records for occupied flats
        if (isOccupied) {
          const uid = `uid-${flatIndex}`;
          const email = `${residentName.toLowerCase().replace(/\s+/g, '.')}@example.com`;
          const role = flatIndex === 0 ? 'society_admin' : flatIndex < 3 ? 'committee' : 'resident';
          await db.doc(`societies/${societyId}/members/${uid}`).set({
            id: uid,
            uid,
            societyId,
            name: residentName,
            email,
            phone: `+91${9000000000 + flatIndex}`,
            role,
            status: 'active',
            flatId,
            flatNumber,
            towerName: tower.name,
            type: flatIndex % 5 === 0 ? 'Tenant' : 'Owner',
            designation: flatIndex === 0 ? 'Secretary' : flatIndex === 1 ? 'Treasurer' : flatIndex === 2 ? 'Maintenance Head' : 'Resident',
            profileComplete: true,
            joinedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }

        flatIndex++;
        if (flatIndex >= 40) break;
      }
      if (flatIndex >= 40) break;
    }
  }
  console.log(`  ✓ ${flatIndex} flats + members created`);

  // ─── 4. Complaints ───
  const complaints = [
    { title: 'Water leakage in parking area', category: 'Plumbing', priority: 'High' as const, flat: `${towerData[0].code}-101A`, tower: 'Tower A', residentName: residentNames[0], status: 'assigned' as const },
    { title: 'Lift stuck between floors', category: 'Lift', priority: 'Urgent' as const, flat: `${towerData[0].code}-302B`, tower: 'Tower A', residentName: residentNames[2], status: 'started' as const },
    { title: 'Street lights not working near Gate 2', category: 'Electrical', priority: 'Normal' as const, flat: `${towerData[1].code}-501C`, tower: 'Tower B', residentName: residentNames[4], status: 'reported' as const },
    { title: 'Garden area maintenance needed', category: 'Cleaning', priority: 'Normal' as const, flat: `${towerData[1].code}-204D`, tower: 'Tower B', residentName: residentNames[7], status: 'resolved' as const },
  ];

  for (let i = 0; i < complaints.length; i++) {
    const c = complaints[i];
    const id = `comp-demo-${i}`;
    await db.doc(`societies/${societyId}/complaints/${id}`).set({
      ...c,
      id,
      societyId,
      ticketNumber: `TKT-${1000 + i}`,
      description: `${c.title} reported by ${c.residentName}.`,
      residentPhone: `+91${9000000000 + i}`,
      reportedAt: new Date(Date.now() - i * 86400000).toISOString(),
      timeline: [{ step: 'reported', title: 'Reported', time: new Date(Date.now() - i * 86400000).toISOString(), done: true }],
      comments: [],
    });
  }
  console.log('  ✓ Complaints created');

  // ─── 5. Facilities ───
  const facilities = [
    { name: 'Clubhouse', capacity: 40, pricePerHour: 500, icon: 'Building2' },
    { name: 'Swimming Pool', capacity: 15, pricePerHour: 200, icon: 'Waves' },
    { name: 'Gymnasium', capacity: 10, pricePerHour: 100, icon: 'Dumbbell' },
  ];
  for (const fac of facilities) {
    const id = `fac-${fac.name.toLowerCase().replace(/\s+/g, '-')}`;
    await db.doc(`societies/${societyId}/facilities/${id}`).set({
      ...fac,
      id,
      societyId,
      description: `${fac.name} for residents`,
      timings: '06:00 AM - 10:00 PM',
      availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      slots: [],
    });
  }
  console.log('  ✓ Facilities created');

  // ─── 6. Visitors ───
  const visitors = [
    { name: 'Delivery - Amazon', phone: '+919800000001', flat: `${towerData[0].code}-101A`, tower: 'Tower A', residentName: residentNames[0], type: 'Delivery' as const, status: 'inside' as const, purpose: 'Package delivery', company: 'Amazon' },
    { name: 'Guest - Mehta Family', phone: '+919800000002', flat: `${towerData[0].code}-203C`, tower: 'Tower A', residentName: residentNames[1], type: 'Guest' as const, status: 'expected' as const, purpose: 'Family visit', company: '' },
    { name: 'Service - Urban Company', phone: '+919800000003', flat: `${towerData[1].code}-401B`, tower: 'Tower B', residentName: residentNames[5], type: 'Service' as const, status: 'exited' as const, purpose: 'AC repair', company: 'Urban Company' },
  ];
  for (let i = 0; i < visitors.length; i++) {
    const v = visitors[i];
    const id = `vis-demo-${i}`;
    await db.doc(`societies/${societyId}/visitors/${id}`).set({
      ...v,
      id,
      societyId,
      expectedDate: new Date().toISOString().split('T')[0],
      expectedTime: '10:00 AM',
      passNumber: `PASS-${2000 + i}`,
      qrCode: `QR-${randomId()}`,
      gateNumber: '1',
      createdAt: new Date(Date.now() - i * 3600000).toISOString(),
    });
  }
  console.log('  ✓ Visitors created');

  // ─── 7. Bills ───
  for (let i = 0; i < Math.min(10, flatIds.length); i++) {
    const id = `bill-demo-${i}`;
    const flatId = flatIds[i];
    const flatNumber = flatId.replace('flat-', '').toUpperCase();
    await db.doc(`societies/${societyId}/bills/${id}`).set({
      id,
      societyId,
      billNumber: `INV-2026-${3000 + i}`,
      flat: flatNumber,
      tower: flatNumber.startsWith('A') ? 'Tower A' : 'Tower B',
      residentName: residentNames[i % residentNames.length],
      month: 'January',
      year: 2026,
      maintenanceFee: 3500,
      parkingFee: 500,
      lateFee: 0,
      totalAmount: 4000,
      status: i < 3 ? 'Paid' : i < 7 ? 'Pending' : 'Overdue',
      dueDate: '2026-01-15',
      lineItems: [
        { description: 'Monthly Maintenance', amount: 3500, type: 'maintenance' },
        { description: 'Covered Parking', amount: 500, type: 'parking' },
      ],
      subtotal: 4000,
      billingPeriod: 'January 2026',
    });
  }
  console.log('  ✓ Bills created');

  // ─── 8. Notices ───
  const notices = [
    { title: 'Annual General Meeting Notice', category: 'event' as const, message: 'AGM scheduled for March 15, 2026 at 6:00 PM in the Clubhouse. All flat owners are requested to attend.', audience: 'Entire Society' as const, priority: 'urgent' as const, publishedBy: 'Secretary' },
    { title: 'Water Tank Cleaning Schedule', category: 'maintenance' as const, message: 'Overhead tanks will be cleaned on Saturday, Feb 22. Water supply will be interrupted from 10 AM to 4 PM.', audience: 'Entire Society' as const, priority: 'normal' as const, publishedBy: 'Maintenance Head' },
    { title: 'Security Update: New Visitor Protocol', category: 'security' as const, message: 'Starting March 1, all visitors must be pre-registered via the app or by calling the guard desk. Walk-in visitors will require resident confirmation.', audience: 'Entire Society' as const, priority: 'normal' as const, publishedBy: 'Security Committee' },
  ];
  for (let i = 0; i < notices.length; i++) {
    const n = notices[i];
    const id = `notice-demo-${i}`;
    await db.doc(`societies/${societyId}/notices/${id}`).set({
      ...n,
      id,
      societyId,
      date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
      time: '10:00 AM',
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    });
  }
  console.log('  ✓ Notices created');

  // ─── 9. Election ───
  const electionId = `elec-demo-${Date.now()}`;
  await db.doc(`societies/${societyId}/elections/${electionId}`).set({
    id: electionId,
    societyId,
    title: 'Annual Committee Elections 2026',
    term: '2026-2028',
    description: 'Election for President, General Secretary, and Treasurer positions for the 2026-2028 term.',
    positions: ['President', 'General Secretary', 'Treasurer'],
    nominationStart: new Date().toISOString(),
    nominationEnd: new Date(Date.now() + 14 * 86400000).toISOString(),
    votingStart: new Date(Date.now() + 15 * 86400000).toISOString(),
    votingEnd: new Date(Date.now() + 21 * 86400000).toISOString(),
    status: 'Nomination Open',
    eligibleVotersCount: 25,
    totalVotesCast: 0,
    createdAt: new Date().toISOString(),
  });

  // Nominations
  const nominations = [
    { position: 'President' as const, candidateId: 'uid-0', candidateName: residentNames[0], flat: `${towerData[0].code}-101A`, tower: 'Tower A', phone: '+919000000000', email: `${residentNames[0].toLowerCase().replace(/\s+/g, '.')}@example.com`, profession: 'Lawyer', yearsInSociety: 5, manifesto: 'Will focus on safety and infrastructure improvements.', status: 'Approved' as const },
    { position: 'General Secretary' as const, candidateId: 'uid-1', candidateName: residentNames[1], flat: `${towerData[0].code}-203C`, tower: 'Tower A', phone: '+919000000001', email: `${residentNames[1].toLowerCase().replace(/\s+/g, '.')}@example.com`, profession: 'Software Engineer', yearsInSociety: 3, manifesto: 'Transparent communication and community building.', status: 'Approved' as const },
    { position: 'Treasurer' as const, candidateId: 'uid-2', candidateName: residentNames[2], flat: `${towerData[0].code}-302B`, tower: 'Tower A', phone: '+919000000002', email: `${residentNames[2].toLowerCase().replace(/\s+/g, '.')}@example.com`, profession: 'CA', yearsInSociety: 4, manifesto: 'Digital-first billing and transparent financial reporting.', status: 'Approved' as const },
  ];
  for (let i = 0; i < nominations.length; i++) {
    const n = nominations[i];
    await db.doc(`societies/${societyId}/elections/${electionId}/nominations/nom-demo-${i}`).set({
      ...n,
      id: `nom-demo-${i}`,
      societyId,
      electionId,
      voteCount: 0,
      nominatedAt: new Date().toISOString(),
    });
  }
  console.log('  ✓ Election + nominations created');

  // ─── Summary ───
  console.log('');
  console.log('═'.repeat(50));
  console.log(`  Demo society "${societyId}" seeded successfully!`);
  console.log('═'.repeat(50));
  console.log(`  Society:     ${society.name}`);
  console.log(`  Towers:      ${towerData.length}`);
  console.log(`  Flats:       ${flatIndex}`);
  console.log(`  Members:     ${Math.min(flatIndex, 25)}`);
  console.log(`  Complaints:  ${complaints.length}`);
  console.log(`  Facilities:  ${facilities.length}`);
  console.log(`  Visitors:    ${visitors.length}`);
  console.log(`  Bills:       ${10}`);
  console.log(`  Notices:     ${notices.length}`);
  console.log(`  Elections:   1 (${nominations.length} nominees)`);
  console.log('═'.repeat(50));
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
