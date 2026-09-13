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

### 2. Firebase Hosting (Pre-Configured with `firebase.json` & `.firebaserc`)

Because `firebase.json` and `.firebaserc` are already configured for project `gen-lang-client-0898030963`, deploying to Firebase Hosting is straightforward:

```bash
# 1. Install firebase-tools globally if not already installed
npm install -g firebase-tools

# 2. Login
firebase login

# 3. Build & Deploy
npm run build
npm run deploy:firebase
```

Your live site will be immediately available at:
`https://gen-lang-client-0898030963.web.app` or `https://gen-lang-client-0898030963.firebaseapp.com`

---

### 3. Automated GitHub Actions CI/CD (`.github/workflows/firebase-deploy.yml`)

The repository includes an automated GitHub Actions CI/CD workflow that:
1. Triggers on every `push` to `main`/`master`, `pull_request`, or manual `workflow_dispatch`.
2. Checks out code and provisions Node.js 20 environment.
3. Automatically hydrates or verifies `firebase-applet-config.json` and `.firebaserc`.
4. Installs dependencies and runs `npm run lint` + `npm run build`.
5. Deploys static build (`dist/`) and `firestore.rules` to Firebase.
6. Generates deployment reports (`deployment-urls.txt`, `deployment-urls.json`, `deployment-summary.md`) and uploads them as downloadable **GitHub Actions Artifacts** (`deployment-urls`).
7. Publishes a rich interactive Markdown report directly to the GitHub Actions `$GITHUB_STEP_SUMMARY`.

---

### 4. How to Set Up CI/CD Authentication Secrets in GitHub

To enable automated deployments from GitHub Actions, you need to provide **either** a **Firebase CI Token** (Method 1) or a **Google Cloud Service Account** (Method 2).

#### Method 1: Get a Firebase CI Token (`FIREBASE_TOKEN`) — Fastest & Easiest (2 minutes)

1. Open your local terminal or command prompt (where you have Node.js installed).
2. Run the Firebase CI login command:
   ```bash
   npx firebase login:ci
   ```
   *(Or `firebase login:ci` if `firebase-tools` is installed globally).*
3. A browser window will open asking you to sign in with your Google account.
   - Choose the Google account that has access to project `gen-lang-client-0898030963`.
   - Click **Allow** to grant permissions.
4. Return to your terminal. You will see an output message like:
   ```text
   ✔  Success! Use this token to deploy on a CI server:

   1//04ABC123xyz_LONG_SECRET_TOKEN_STRING_HERE...
   ```
5. Copy the entire token string.
6. In your GitHub repository:
   - Go to **Settings** > **Secrets and variables** > **Actions**.
   - Click the green **New repository secret** button.
   - Set **Name**: `FIREBASE_TOKEN`
   - Set **Value**: Paste the token string copied in Step 5.
   - Click **Add secret**.

---

#### Method 2: Google Cloud Service Account (`FIREBASE_SERVICE_ACCOUNT`) — Recommended for Production

Service accounts do not expire like tokens and offer granular IAM role security.

##### Step 1: Open Service Accounts in Google Cloud Console
1. Navigate to:  
   [Google Cloud IAM Service Accounts (gen-lang-client-0898030963)](https://console.cloud.google.com/iam-admin/serviceaccounts?project=gen-lang-client-0898030963)
2. Ensure project **`gen-lang-client-0898030963`** is selected in the top project dropdown.

##### Step 2: Create the Service Account
1. Click **+ Create Service Account** at the top.
2. Fill in the details:
   - **Service account name**: `github-actions-firebase-deploy`
   - **Service account ID**: `github-actions-deploy`
   - **Description**: `Deploys Vite bundle and Firestore rules from GitHub Actions`
3. Click **Create and Continue**.

##### Step 3: Assign the Required IAM Roles
In the **Grant this service account access to project** step (or via **IAM > Edit Principal** on an existing service account), add the following roles:
1. **Firebase Hosting Admin** (`roles/firebasehosting.admin`): Required to upload web assets to Firebase Hosting.
2. **Service Usage Consumer** (`roles/serviceusage.serviceUsageConsumer`): **CRITICAL** — Required by the Firebase CLI to inspect enabled Google APIs (`firestore.googleapis.com`, `firebasehosting.googleapis.com`). Without this, Google returns `403 Permission denied to get service`.
3. **Firebase Rules Admin** (`roles/firebaserules.admin`): Required to deploy Firestore security rules.
*(Tip: Or simply assign the single role **Firebase Admin** `roles/firebase.admin`, which includes all of the above).*

> **Already created the service account?** You do not need to generate a new key!  
> 1. Go to [Google Cloud IAM](https://console.cloud.google.com/iam-admin/iam?project=gen-lang-client-0898030963).  
> 2. Find your service account in the member list and click the **Pencil (Edit)** icon.  
> 3. Click **+ Add Another Role** and select **Service Usage Consumer** (`roles/serviceusage.serviceUsageConsumer`).  
> 4. Click **Save**.

Click **Continue**, then click **Done**.

##### Step 4: Generate and Download the JSON Key
1. Find your newly created service account in the list (e.g. `github-actions-deploy@gen-lang-client-0898030963.iam.gserviceaccount.com`).
2. Click on the service account name or click the **Actions** (three dots) menu and select **Manage keys**.
3. Click **Add Key** > **Create new key**.
4. Choose **JSON** and click **Create**.
5. A `.json` key file will immediately download to your computer.

##### Step 5: Add the Secret to GitHub
1. Open the downloaded `.json` key file in any text editor (e.g. VS Code, Notepad) and copy the **entire JSON content**.
2. In your GitHub repository:
   - Go to **Settings** > **Secrets and variables** > **Actions**.
   - Click **New repository secret**.
   - Set **Name**: `FIREBASE_SERVICE_ACCOUNT`  
     *(or `FIREBASE_SERVICE_ACCOUNT_GEN_LANG_CLIENT_0898030963`)*
   - Set **Value**: Paste the entire JSON file contents.
   - Click **Add secret**.

---

### 5. Viewing Deployment URLs and Artifacts

Every time a workflow completes on GitHub Actions:
1. **Step Summary**: Open the GitHub Actions run to view the formatted Markdown summary displaying clickable URLs:
   - Primary Hosting: `https://gen-lang-client-0898030963.web.app`
   - Firebase Domain: `https://gen-lang-client-0898030963.firebaseapp.com`
   - Preview App: `https://ais-pre-zzgr2xzlldzk3vxwc2zpg5-436884437383.asia-southeast1.run.app`
   - Dev App: `https://ais-dev-zzgr2xzlldzk3vxwc2zpg5-436884437383.asia-southeast1.run.app`
2. **Downloadable Artifacts**: Scroll to the bottom of the workflow run to download `deployment-urls.zip`:
   - `artifacts/deployment-urls.txt` (plaintext)
   - `artifacts/deployment-urls.json` (machine-readable)
   - `artifacts/deployment-summary.md` (formatted report)

---

## 7. Administrative Credentials & Society Admin Superpowers

The application is structured as a true production product:

### 1. Default Production Gate
- Unauthenticated visitors are greeted by the official **Greenwood Heights Society Login Screen**.
- No private society data, dues, or gate camera feeds are rendered without logging in.

### 2. Local Super Admin Credentials
For immediate full-access administrative onboarding without needing a pre-existing Firebase Auth account:
- **Admin Email**: `admin@greenwood.in`
- **Admin Password**: `AdminPassword@123`
- **1-Click Quick Access**: Click the **"Local Super Admin (admin@greenwood.in)"** card at the bottom of the Login Screen.

### 3. Promoting Any User to Society Admin
As a Local Admin or Society Admin, you can empower any user or resident with full administrative authority:
1. Go to the **Admin Portal** -> **Residents & Members** directory (`AdminPeople`).
2. Under the **Society Flats & Residents** tab, click **"Make Admin"** on any flat owner or tenant, or open their resident drawer and select **"Promote to Society Admin"**.
3. Under the **App Accounts & Admin Rights** tab, you will see all real users who have registered through Firebase Authentication (e.g. Google Sign-In or Email). Click **"Make Society Admin"** next to their account.
4. Society Admins have complete administrative access across the entire app:
   - Creating election cycles and verifying candidate portfolios.
   - Managing maintenance dues, fee structures, and generating stamped GST tax receipts.
   - Overriding gate security access and managing guard logs.
   - Approving community hall and amenity bookings.
2. Click **Add custom domain** (e.g. `society.yourdomain.com`).
3. Follow the DNS verification steps provided by Firebase.

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
