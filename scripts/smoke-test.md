# NestWell Smoke Test Checklist

Manual verification of all core features before release.

---

## 1. Authentication

- [ ] User can sign up with email
- [ ] User can sign in with email
- [ ] User can sign out
- [ ] Password reset flow works
- [ ] Unauthenticated user sees LoginScreen

## 2. Society Management

- [ ] Platform admin can create a society
- [ ] Society onboarding wizard shows towers, flats, facilities, review steps
- [ ] Society can be activated after onboarding
- [ ] Society picker shows user's societies
- [ ] User can join a society via invite code

## 3. Admin Console

- [ ] Dashboard loads with stats (residents, visitors, complaints, bills)
- [ ] People tab lists members
- [ ] Visitors tab shows visitor log
- [ ] Complaints tab shows tickets
- [ ] Finance tab shows bills and payments
- [ ] Facilities tab shows amenities
- [ ] Notices tab shows published notices
- [ ] Reports tab loads
- [ ] Settings tab loads
- [ ] Admin can switch to Resident View
- [ ] Admin can switch back from Resident View

## 4. Resident Portal

- [ ] Home screen loads with quick actions
- [ ] Activity feed shows recent events
- [ ] Notices list shows published notices
- [ ] More/Profile screen loads
- [ ] Resident can invite a visitor
- [ ] Resident can report a problem
- [ ] Resident can view maintenance dues
- [ ] Resident can book a facility

## 5. Visitor Management

- [ ] Resident can invite a visitor (creates record)
- [ ] Gate alert triggers when visitor is waiting
- [ ] Admin can approve visitor at gate
- [ ] Visitor status updates (expected → waiting → inside → exited)
- [ ] QR code / pass number generated

## 6. Complaints

- [ ] Resident can submit a complaint
- [ ] Complaint appears in admin complaints list
- [ ] Admin can assign complaint to staff
- [ ] Admin can update complaint status
- [ ] Complaint timeline tracks changes
- [ ] Notification sent on complaint update

## 7. Maintenance Billing

- [ ] Admin can generate bills
- [ ] Bills appear in resident's dues view
- [ ] Bill status shows Pending / Overdue / Paid
- [ ] Late fee calculation works
- [ ] Payment recording works (UPI/Cash/Cheque)
- [ ] Payment history tracked

## 8. Facility Booking

- [ ] Facility list loads in resident portal
- [ ] Resident can book a facility for a time slot
- [ ] Booking appears in admin bookings list
- [ ] Slot status updates to Booked
- [ ] Booking confirmation notification sent

## 9. Notices

- [ ] Admin can create a notice
- [ ] Notice appears in resident notices list
- [ ] Urgent notices are visually distinct
- [ ] Notice can be targeted (Entire Society / Building / Selected)

## 10. Elections

- [ ] Admin can create an election
- [ ] Election appears in elections section
- [ ] Nominations can be submitted
- [ ] Nominations can be approved/rejected
- [ ] Voting flow works (cast vote)
- [ ] Vote count updates

## 11. Notifications

- [ ] NotificationBell shows unread count
- [ ] Notifications appear in dropdown
- [ ] Clicking notification marks as read
- [ ] "Mark all as read" clears badge
- [ ] Notifications for relevant events (visitor, payment, complaint, notice)

## 12. Navigation & Layout

- [ ] AdminLayout sidebar navigation works
- [ ] Mobile bottom navigation works
- [ ] Responsive layout on mobile, tablet, desktop
- [ ] Active tab is visually highlighted
- [ ] Mobile hamburger menu opens/closes

## 13. Error Handling

- [ ] ErrorBoundary catches React errors and shows friendly page
- [ ] "Reload" button on error page reloads the app
- [ ] "Go Home" button on error page navigates home
- [ ] Network errors are handled gracefully
- [ ] Firestore permission errors are logged

## 14. Accessibility

- [ ] Icon-only buttons have aria-label
- [ ] Modal has role="dialog" and aria-modal="true"
- [ ] Form inputs have associated labels
- [ ] Focus trap works in modals
- [ ] Escape key closes modals

## 15. Performance & Build

- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` succeeds
- [ ] No console errors on page load
- [ ] Lazy-loaded components load on demand
- [ ] No memory leaks from subscriptions (useEffect cleanup)

---

## How to Run

```bash
# Type check
npx tsc --noEmit

# Production build
npm run build

# Dev server
npm run dev
```

## Seed Demo Data

```bash
npx tsx scripts/seed-demo.ts \
  --project <your-project> \
  --society demo-society \
  --confirm
```
