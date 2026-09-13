# NestWell Release Gate

Pre-release checklist covering auth, multi-tenancy, features, quality, and cost.

---

## 1. Authentication & Identity

- [ ] Firebase Auth configured with correct project
- [ ] Email/password sign-up and sign-in working
- [ ] Google OAuth sign-in working (if enabled)
- [ ] `platform_admin` bootstrap script tested
- [ ] Platform admin cannot be created from client code
- [ ] Auth state persists across page reloads
- [ ] Sign-out clears all session state
- [ ] `syncPlatformUser` creates correct initial document

## 2. Multi-Tenancy (Societies)

- [ ] Society creation works via platform admin
- [ ] Society invitation flow works end-to-end
- [ ] Society join request flow works
- [ ] Society status lifecycle: `pending_admin` → `onboarding` → `active` → `suspended`
- [ ] Suspended societies block all access except platform admin
- [ ] Society data is isolated per tenant (Firestore security rules)
- [ ] Member role-based access: `resident`, `committee`, `society_admin`
- [ ] Platform admin can view all societies
- [ ] Society deletion cascades correctly (Admin SDK path)

## 3. Data Integrity

- [ ] Firestore security rules enforce tenant isolation
- [ ] Admin-only writes on bills, elections, notices
- [ ] Resident cannot modify other residents' data
- [ ] `sanitizeFirestoreData` prevents undefined values in writes
- [ ] Audit logs are created for key actions
- [ ] No secrets or API keys in client code

## 4. Feature Completeness

- [ ] **Dashboard**: Stats load (residents, visitors, complaints, bills)
- [ ] **People**: Member list, invite, role changes
- [ ] **Visitors**: Invite, approve, status tracking, gate alerts
- [ ] **Complaints**: Submit, assign, status updates, timeline
- [ ] **Finance**: Bill generation, payment recording, UPI QR
- [ ] **Facilities**: Create, book, slot management
- [ ] **Notices**: Create, publish, audience targeting
- [ ] **Elections**: Create, nominate, vote, results
- [ ] **Resident Portal**: Home, activity, notices, profile
- [ ] **Security App**: Gate management, visitor log
- [ ] **Notifications**: Bell, badge, mark read, event-driven
- [ ] **CSV Import**: Bulk flat creation via paste
- [ ] **Error Boundary**: Catches crashes, shows recovery UI

## 5. Quality & Testing

- [ ] `npx tsc --noEmit` — zero type errors
- [ ] `npm run build` — production build succeeds
- [ ] Manual smoke test passed (see `scripts/smoke-test.md`)
- [ ] No console errors on any screen
- [ ] Responsive on mobile (390px), tablet (768px), desktop (1280px+)
- [ ] Loading states for async operations
- [ ] Empty states for all list views
- [ ] Error states for failed operations

## 6. Accessibility

- [ ] All icon-only buttons have `aria-label`
- [ ] Modals have `role="dialog"` and `aria-modal="true"`
- [ ] Form inputs have associated `<label>` elements
- [ ] Keyboard navigation works (Tab, Escape)
- [ ] Focus management in modals
- [ ] Color contrast meets WCAG AA (4.5:1 for text)

## 7. Performance

- [ ] Lazy loading for heavy components (Elections, Platform, Payments)
- [ ] Firebase subscriptions cleanup on unmount
- [ ] No unnecessary re-renders (React DevTools check)
- [ ] Images optimized (alt text, lazy loading)
- [ ] CSS is minimal (Tailwind only, no unused styles)

## 8. Cost & Quotas

- [ ] Firestore read/write counts are reasonable
- [ ] No unbounded `onSnapshot` queries
- [ ] Storage uploads have size limits
- [ ] Batched writes for bulk operations
- [ ] Billing plan reviewed (Blaze pay-as-you-go)

## 9. Deployment

- [ ] Firebase Hosting config (`firebase.json`) correct
- [ ] Firestore rules deployed (`firestore.rules`)
- [ ] Environment variables not committed to repo
- [ ] Build output (`dist/`) is clean
- [ ] Custom domain configured (if applicable)

## 10. Monitoring

- [ ] Firebase Console monitoring enabled
- [ ] Error logging captured (console.error + Firestore audit)
- [ ] Performance monitoring (optional, recommended)

---

## Sign-off

| Area | Owner | Date | Status |
|------|-------|------|--------|
| Auth | | | |
| Multi-Tenancy | | | |
| Features | | | |
| Quality | | | |
| Accessibility | | | |
| Cost | | | |
| Deployment | | | |
