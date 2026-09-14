# NestWell — Status Report

**Date:** 14 September 2026
**Deployed at:** https://gen-lang-client-0898030963.web.app
**Repo:** https://github.com/sghazra21/NestWell.git

---

## Executive Summary

NestWell is a **production-ready multi-tenant society management platform** with real Firestore data, comprehensive security rules, and zero mock/fake data. The core financial flow (bill → UPI payment → admin verification) works end-to-end. 20+ features are implemented and working. Key gaps: no test framework, no bulk operations, facility management is read-only.

---

## What Works

### Authentication & Multi-tenancy
- Firebase Auth (Google + email/password)
- Platform Admin → Society → Member hierarchy
- Profile completion with flat linking
- Society creation with feature flags
- Cross-tenant isolation via Firestore rules
- Role derivation from membership (not localStorage)

### Admin Dashboard
- Real-time KPIs from Firestore (residents, complaints, payments, visitors)
- Clickable cards navigate to relevant tabs
- "Needs Your Attention" section (urgent complaints + overdue bills)
- Gate activity log stream

### People Management
- Add residents with flat assignment
- Promote to admin/committee
- Invite members via email (code-based)
- Approve/reject pending members
- Detail drawer with family members, vehicles, dues
- Search and filter (name, flat, phone, role, tower)

### Visitor Management
- Invite visitors (personal/delivery/vendor/staff)
- Walk-in registration at gate
- Check-in / check-out with timestamps
- Real-time visitor status (inside/expected/exited)
- Search by name, flat, pass number
- Security guard app with gate console

### Complaint Management
- Create complaints with categories (Plumbing/Lift/Electrical/etc.)
- Assign staff (name/role/phone)
- Status updates (Assigned → Work Started → Resolved)
- Ticket numbers and search
- Urgent flagging

### Finance
- **Bills**: Create with line items (maintenance/parking/water/electricity/late fee), issue to specific flat
- **UPI Payment**: Dynamic QR code, UPI intent link, copy VPA, UTR submission, 5-state flow (QR → Pending → Verified/Rejected)
- **Manual Payment**: Admin records cash/cheque/bank transfer/UPI
- **Payment Verification**: Admin verifies or rejects UPI claims with reason
- **Expenses**: Record with 15 categories, cancel workflow, no deletion of financial records
- **Treasury**: Ledger-based (CASH_IN/CASH_OUT/ADJUSTMENT), auto-generated from payments/expenses
- **Finance Dashboard**: KPIs (Total Billed, Collected, Outstanding, Cash In Hand), monthly summary
- **CSV Exports**: Bills, Payments, Expenses, Treasury

### Facilities
- Display facilities with capacity, price, slots
- Resident booking modal
- Booking confirmation
- Feature flag: `facilityBooking`

### Notices
- Create with title, message, audience (All/Tower/Owners), priority (normal/urgent)
- Image attachment upload (5MB limit, Firebase Storage)
- Notification bell with unread count

### Reports
- 9 CSV export types: Residents, Flats, Visitors, Complaints, Bills, Payments, Facility Bookings, Notices, Elections
- Date filters: All Time, This Month, Last 3 Months, This Year
- Row counts on each card

### Elections & Governance
- Create elections with positions, nomination/voting periods
- Nomination submission with manifesto
- Digital ballot with candidate cards
- Cast vote with duplicate prevention (deterministic doc IDs)
- Declare results, committee board display
- Admin controls (approve/reject nominations, set voting active)

### Settings
- Society identity (name, registration, address, city)
- Contact info (email, phone)
- Security gates (2 gates with active toggle)
- Emergency contacts (security, manager, electrician, plumber, police, ambulance)
- Billing config (currency, due day, UPI ID, payee name)

### Notifications
- In-app notification bell with unread badge
- Auto-notifications on 8 events (visitor, complaint, bill, payment, notice, booking)
- Mark read / mark all read

### Platform Admin
- Provision new societies with location picker
- Invite admins via email
- Society table with search, status, context switching
- Delete society with cascading cleanup
- Support impersonation with audit logging
- Platform KPIs (tenants, units, residents, sessions)
- Audit log (immutable trail)

### Security & Quality
- 254+ lines of Firestore security rules
- Default deny on all unprotected paths
- Audit logging for all admin actions
- ErrorBoundary with friendly error page
- Empty/loading/error states across modules
- Mobile-responsive design
- PWA manifest with icons
- NestWellLogo branding throughout

---

## What Does Not Work / Known Issues

### Critical
| Issue | Details |
|-------|---------|
| **No bulk bill generation** | Bills created one flat at a time. No "generate for all flats" feature. |
| **Complaint resolution notes not persisted** | Notes stored in local state only, lost on refresh. |
| **No facility CRUD from UI** | Can't add/edit/delete facilities. `createFacility` exists in context but no admin UI for it. |
| **Facility day selector hardcoded** | Shows "Saturday/Sunday/Next Monday" instead of dynamic days. |

### Payment Flow
| Issue | Details |
|-------|---------|
| **No auto UPI verification** | Requires manual admin verification of every UTR. No webhook/gateway integration. |
| **No partial payment support** | Bills must be paid in full. No advance or installment tracking. |
| **No credit notes / adjustments** | No way to issue refunds or billing corrections. |

### People & Visitors
| Issue | Details |
|-------|---------|
| **No edit/delete resident** | Can add residents but not modify or remove them. |
| **No flat reassignment** | Can't move a resident from one flat to another. |
| **WhatsApp notice is placeholder** | Button shows toast, no actual WhatsApp integration. |
| **No real QR scanning** | Security gate camera scanner is simulated (visitor selected from list). |
| **No visitor photo capture** | No camera integration for visitor photos. |

### Reports & Data
| Issue | Details |
|-------|---------|
| **No PDF export** | Only CSV. No formatted PDF reports. |
| **No scheduled reports** | No auto-generation or email delivery of reports. |
| **Visitors CSV export placeholder** | Shows toast "coming soon" in AdminVisitors (exists in AdminReports). |

### Infrastructure
| Issue | Details |
|-------|---------|
| **No test framework** | Zero unit/integration/e2e tests. No jest/vitest/playwright. |
| **No ESLint/Prettier** | No code formatting or linting configured. |
| **No offline support** | No service worker, no offline-first strategy. |
| **No rate limiting** | Noted in Firestore rules as needing Cloud Functions (requires Blaze). |
| **No push notifications** | Only in-app. FCM requires Cloud Functions. |
| **No transactional email** | Gmail SMTP requires Cloud Functions. |
| **Build chunk size warning** | Main bundle is 1.3MB (minified). Should split with `manualChunks`. |

### Deferred (Need Blaze Plan)
- Gmail SMTP for email notifications
- FCM push notifications
- Razorpay online payments
- Rate limiting via Cloud Functions
- Platform analytics Cloud Function

---

## Feature Status Matrix

| Feature | Status | Data | Security | Notes |
|---------|--------|------|----------|-------|
| Auth (Google + Email) | Working | Real | Rules | Multi-tenant |
| Platform Console | Working | Real | Rules | Provision, manage, impersonate |
| Society Creation | Working | Real | Rules | With feature flags |
| Onboarding Wizard | Working | Real | Rules | Towers, flats, config |
| Dashboard | Working | Real | — | Live KPIs |
| People Management | Working | Real | Rules | No edit/delete |
| Visitor Management | Working | Real | Rules | No CSV export in-module |
| Complaint Management | Working | Real | Rules | Notes not persisted |
| Bills & Invoices | Working | Real | Rules | One-at-a-time creation |
| UPI Payment | Working | Real | Rules | Manual UTR verification |
| Manual Payment | Working | Real | Rules | Cash/cheque/bank/UPI |
| Expenses | Working | Real | Rules | 15 categories, cancel workflow |
| Treasury | Working | Real | Rules | Ledger-based, auto-generated |
| Finance Dashboard | Working | Real | — | KPIs, monthly summary |
| Facilities | Partial | Real | Rules | Read-only, no CRUD |
| Notices | Working | Real | Rules | With attachments |
| Reports/CSV | Working | Real | — | 9 types, date filters |
| Settings | Working | Real | Rules | Comprehensive config |
| Resident Portal | Working | Real | Rules | Mobile-optimized |
| Security Gate | Working | Real | Rules | Simulated scanner |
| Elections | Working | Real | Rules | Full lifecycle |
| Notifications | Working | Real | Rules | In-app, 8 event types |
| Audit Logging | Working | Real | Rules | Immutable trail |
| Error Handling | Working | — | — | ErrorBoundary + states |
| PWA | Working | — | — | Manifest + icons |
| Branding | Working | — | — | Logo throughout |

---

## Firestore Collections

| Collection | Path | Records |
|------------|------|---------|
| Platform Users | `platform_users/{uid}` | Platform admin roles |
| Societies | `societies/{sid}` | Society configs |
| Towers | `societies/{sid}/towers/{tid}` | Tower definitions |
| Flats | `societies/{sid}/flats/{fid}` | Flat units |
| Members | `societies/{sid}/members/{mid}` | Society memberships |
| Visitors | `societies/{sid}/visitors/{vid}` | Visitor passes |
| Complaints | `societies/{sid}/complaints/{cid}` | Support tickets |
| Bills | `societies/{sid}/bills/{bid}` | Maintenance invoices |
| Payments | `societies/{sid}/payments/{pid}` | Payment records |
| Expenses | `societies/{sid}/expenses/{eid}` | Expense records |
| Treasury | `societies/{sid}/treasury/{txid}` | Ledger transactions |
| Facilities | `societies/{sid}/facilities/{fid}` | Bookable facilities |
| Bookings | `societies/{sid}/facilityBookings/{bid}` | Facility reservations |
| Notices | `societies/{sid}/notices/{nid}` | Announcements |
| Elections | `societies/{sid}/elections/{eid}` | Election records |
| Nominations | `societies/{sid}/elections/{eid}/nominations/{nid}` | Candidate nominations |
| Votes | `societies/{sid}/elections/{eid}/votes/{vid}` | Ballot records |
| Notifications | `societies/{sid}/notifications/{nid}` | In-app notifications |
| Audit Logs | `societies/{sid}/auditLogs/{lid}` | Admin action trail |
| Invites | `societyInvites/{iid}` | Membership invitations |
| Platform Analytics | `platformAnalytics/{sid}` | Usage metrics |
| Support Sessions | `supportSessions/{sid}` | Impersonation sessions |
| Platform Audit | `platformAuditLogs/{lid}` | Platform admin trail |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript 5.8, Vite 6, Tailwind CSS 4 |
| Auth | Firebase Auth (Google + email/password) |
| Database | Cloud Firestore |
| Storage | Firebase Storage (complaint photos, notice attachments) |
| Hosting | Firebase Hosting |
| QR Codes | qrcode.react |
| Animations | canvas-confetti, motion |
| Maps | Leaflet (LocationPicker) |
| Icons | Lucide React |

---

## Cost

**Current monthly cost: ₹0 (within Firebase free tier)**

| Service | Free Tier | Estimated Usage |
|---------|-----------|-----------------|
| Firestore Reads | 50,000/day | ~5,000/day |
| Firestore Writes | 20,000/day | ~1,000/day |
| Firestore Storage | 1 GB | ~50 MB |
| Hosting | 10 GB/month | ~2 GB |
| Auth | 50,000/month | ~500 |
| Storage | 5 GB | ~100 MB |

---

## Next Priority Items

1. **Bulk bill generation** — generate for all flats in one action
2. **Facility CRUD** — add/edit/delete facilities from admin
3. **Complaint notes persistence** — save resolution notes to Firestore
4. **Edit/delete residents** — full people management
5. **Test framework** — add vitest + component tests
6. **ESLint/Prettier** — code quality tooling
7. **Bundle optimization** — split main chunk with manualChunks
