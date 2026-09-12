# Greenwood Heights — Smart Society Management & Gate Security System

A modern, full-featured residential society management platform tailored for Indian housing societies (RWA / Co-operative Housing Societies). Built with **React 19**, **TypeScript**, **Tailwind CSS**, and **Firebase (Firestore & Authentication)**.

---

## 1. Firebase Project Details

Your app is pre-configured and connected to the following Firebase project:

| Parameter | Configuration Value |
| :--- | :--- |
| **Project ID** | `gen-lang-client-0898030963` |
| **Firestore Database ID** | `ai-studio-nestwellsocietya-3362f689-fc24-4131-9685-c6aa5e473e20` |
| **Auth Domain** | `gen-lang-client-0898030963.firebaseapp.com` |
| **Storage Bucket** | `gen-lang-client-0898030963.firebasestorage.app` |
| **Web App ID** | `1:190916723534:web:e75521d08ed7ddd175941f` |
| **OAuth Client ID** | `190916723534-selbf5chkklgvspffh8gtthg8e249s75.apps.googleusercontent.com` |
| **Firebase Console** | [console.firebase.google.com/project/gen-lang-client-0898030963](https://console.firebase.google.com/project/gen-lang-client-0898030963) |

The configuration is loaded automatically at runtime from `firebase-applet-config.json`.

---

## 2. Core Functional Modules

- **Resident Mobile App (390px Fluid Shell)**:
  - Visitor entry notifications with real-time Allow / Deny actions.
  - Indian Maintenance Payments (Instant UPI intent, dynamic NPCI QR codes, GST breakdown, download stamped PDF tax invoices).
  - Digital Committee Elections: Cast secret ballots for RWA executive posts (President, Secretary, Treasurer) and submit nominations.
  - Facility booking (Clubhouse, Badminton Court, Banquet Hall).
  - Helpdesk ticketing & complaint escalation.
  - Verified resident KYC profile (Owner vs. Tenant badge, vehicle RFID FastTag).

- **Security Guard Fast Console (Gate 1 & Gate 2)**:
  - Rapid visitor check-in, delivery driver pre-approval lookup, and digital pass generation.
  - Live visitor pass QR scanner & intercom simulation.
  - Active visitor exit logging.

- **Society Admin Web Dashboard (1440px Desktop Layout)**:
  - Executive dashboard with resident directory, visitor logs, and facility scheduler.
  - Committee Election & Digital Ballot Portal: Schedule cycles, verify nominee manifestos, and monitor voter turnout.
  - Society Finance & Dues tracker with Indian Payments Stack documentation (Van-ID Virtual Accounts & Razorpay/Cashfree reconciliation).

---

## 3. Local Setup & Running Locally

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **bun**

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```
The application will boot at `http://localhost:3000`.

### Step 3: Typecheck & Build
```bash
# Validate TypeScript
npm run lint

# Compile for production
npm run build
```

---

## 4. Firebase Authentication Setup

Firebase Authentication supports **Google Sign-In** and **Email & Password**:

1. Open the [Firebase Console](https://console.firebase.google.com/project/gen-lang-client-0898030963/authentication).
2. Under **Sign-in method**, ensure **Google** and **Email/Password** are enabled.
3. Under **Settings > Authorized domains**, add:
   - `localhost` (for local development)
   - Your Cloud Run preview domain (e.g., `*.run.app`)
   - Any custom domain you point to your application.

---

## 5. Security Rules (`firestore.rules`)

The Firestore rules enforce security across all core society collections:
- `/users/{userId}`: Verified society profile documents.
- `/visitors/{visitorId}`: Gate entry requests and security passes.
- `/complaints/{complaintId}`: Maintenance tickets.
- `/bills/{billId}`: Maintenance dues and payment receipts.
- `/facilities/{facilityId}` & `/facility_bookings/{bookingId}`: Amenity reservation slots.
- `/notices/{noticeId}`: Official society announcements.
- `/elections/{electionId}`: Digital voting cycles, secret ballots, and nominee portfolios.

### Deploying Security Rules

#### Option A: Using Firebase CLI
```bash
# Login to Firebase
npx firebase login

# Deploy rules to the project database
npx firebase deploy --only firestore:rules --project gen-lang-client-0898030963
```

#### Option B: AI Studio Agent
Ask the AI Studio assistant at any time to "deploy firestore rules", and the system deploys `firestore.rules` directly via the deployment API.

---

## 6. Production Deployment Options

### 1. Google Cloud Run (Recommended & Integrated)
- Inside Google AI Studio, click the **Deploy** button at the top-right.
- The build container will run `npm run build` and launch the production container on Cloud Run with automatic SSL and scalable HTTPS ingress.

### 2. Firebase Hosting
```bash
# Initialize Firebase Hosting
npx firebase init hosting

# Deploy dist output
npm run build
npx firebase deploy --only hosting --project gen-lang-client-0898030963
```

### 3. Vercel / Netlify
- Build command: `npm run build`
- Output directory: `dist`
- Single Page Application redirect rule: rewrite `/*` to `/index.html`.

---

## 7. Project Structure

```
├── firebase-applet-config.json    # Firebase client credentials
├── firebase-blueprint.json        # Firestore intermediate schema definition
├── firestore.rules                # Production Firestore security rules
├── index.html                     # HTML Entry Point
├── package.json                   # Dependencies and scripts
├── src/
│   ├── App.tsx                    # Root component with role switcher
│   ├── components/
│   │   ├── auth/                  # AuthModal & ProfileCompletionModal
│   │   ├── common/                # RoleSwitcher, Modal, UI primitives
│   │   └── payment/               # UPI QR generator & India payment guide
│   ├── context/
│   │   └── AppContext.tsx         # Unified state & real-time Firestore sync
│   ├── features/
│   │   ├── admin/                 # Society Admin web dashboard
│   │   ├── election/              # Digital ballot & election portal
│   │   ├── resident/              # Resident mobile experience
│   │   └── security/              # Security guard gate console
│   ├── lib/
│   │   ├── firebase.ts            # Firebase app, auth & firestore init
│   │   └── firestoreService.ts    # Typed Firestore CRUD & listeners
│   └── types/                     # TypeScript domain models
└── vite.config.ts                 # Vite bundler configuration
```
