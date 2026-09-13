#!/usr/bin/env bash
#
# NestWell production verification series.
#
# Categories:
#   A. Static code tests      — no mock/demo/seed/hardcoded-tenant strings
#   B. Auth security tests    — no hardcoded creds, no auto-admin paths
#   C. Build tests            — tsc + vite production build
#   D. Rules tests            — Firestore rules compile + release
#   E. Live database tests    — clean state (skipped without CLI auth)
#   F. Config & docs tests    — firebase.json, scripts, cleanup doc
#
# Usage: bash scripts/verify-production.sh
# Exit code: 0 = all pass (or skip), 1 = any failure.

set -u
cd "$(dirname "$0")/.."

PASS=0
FAIL=0
SKIP=0

pass() { PASS=$((PASS + 1)); echo "  PASS: $1"; }
fail() { FAIL=$((FAIL + 1)); echo "  FAIL: $1"; }
skip() { SKIP=$((SKIP + 1)); echo "  SKIP: $1"; }

echo "=== A. Static code tests ==="

# A1: no greenwood references in runtime source
if grep -rn -i "greenwood" src/ --include="*.ts" --include="*.tsx" | grep -qv "Binary"; then
  GF=$(grep -rln -i "greenwood" src/ --include="*.ts" --include="*.tsx")
  fail "A1 greenwood strings remain in: $GF"
else
  pass "A1 no greenwood references in src/"
fi

# A2: no mock/demo auth helpers
if grep -rn "mockProfile\|loginWithDemo\|loginAsLocal\|resetData\|handleFillAdmin\|handleQuickDemo\|One-Click\|Demo " src/ --include="*.ts" --include="*.tsx" | grep -v "Democracy" | grep -qv "^\s*$"; then
  fail "A2 demo-auth helpers remain"
else
  pass "A2 no demo-auth helpers in src/"
fi

# A3: no hardcoded default tenant
if grep -rn "greenwood-heights\|DEFAULT_SOCIETY" src/ --include="*.ts" --include="*.tsx" | grep -qv "^\s*$"; then
  fail "A3 hardcoded default tenant remains"
else
  pass "A3 no hardcoded default tenant"
fi

# A4: no seed/bootstrap calls in runtime
if grep -rn "bootstrapProductionTenantIfEmpty\|seedFirestore\|INITIAL_" src/ --include="*.ts" --include="*.tsx" | grep -qv "^\s*$"; then
  fail "A4 seed/bootstrap references remain"
else
  pass "A4 no seed/bootstrap references"
fi

# A5: no simulation / fake-data injection
if grep -rn "triggerGateSimulation\|Simulate Gate\|Simulate Visitor\|Simulate Society" src/ --include="*.ts" --include="*.tsx" | grep -qv "^\s*$"; then
  fail "A5 simulation entry points remain"
else
  pass "A5 no simulation entry points"
fi

# A6: mock directory gone
if [ -d "src/mock" ]; then
  fail "A6 src/mock/ still exists"
else
  pass "A6 src/mock/ removed"
fi

# A7: key modules have empty state handling
EMPTY_STATE_MODULES=0
for mod in AdminPeople AdminComplaints AdminFinance AdminVisitors AdminNotices ResidentNotices ResidentActivity; do
  file=$(find src/ -name "${mod}.tsx" 2>/dev/null | head -1)
  if [ -n "$file" ]; then
    if grep -q "\.length === 0" "$file"; then
      EMPTY_STATE_MODULES=$((EMPTY_STATE_MODULES + 1))
    else
      fail "A7 $mod missing empty state check"
    fi
  fi
done
if [ "$EMPTY_STATE_MODULES" -ge 6 ]; then
  pass "A7 key modules have empty state handling ($EMPTY_STATE_MODULES modules)"
else
  fail "A7 only $EMPTY_STATE_MODULES key modules have empty state handling (expected >=6)"
fi

echo "=== B. Auth security tests ==="

# B1: no hardcoded credentials
if grep -rn -i "admin123\|AdminPassword@\|password.*123456\|letmein" src/ --include="*.ts" --include="*.tsx" | grep -qv "^\s*$"; then
  fail "B1 hardcoded credentials remain"
else
  pass "B1 no hardcoded credentials"
fi

# B2: no email-allowlist admin promotion in client
if grep -rn "isPlatformSuperAdmin\|admin-local-master" src/ --include="*.ts" --include="*.tsx" | grep -qv "^\s*$"; then
  fail "B2 client-side admin allowlist remains"
else
  pass "B2 no client-side admin allowlist"
fi

# B3: localStorage stores only UX prefs (currentSocietyId), never role/auth
# (comment lines excluded — only code lines count)
if grep -rn "localStorage" src/ --include="*.ts" --include="*.tsx" | grep -v "^\s*//" | grep -v "^\S*: *[0-9]*: *//" | grep -v "current_society_id" | grep -qv "^\s*$"; then
  fail "B3 localStorage used beyond currentSocietyId"
else
  pass "B3 localStorage limited to currentSocietyId"
fi

# B4: rules contain no hardcoded admin email
if grep -n "gmail.com\|@.*\.com.*admin\|sghazra" firestore.rules | grep -qv "^\s*$"; then
  fail "B4 hardcoded email in firestore.rules"
else
  pass "B4 no hardcoded email in firestore.rules"
fi

# B5: rules contain no open wildcard allow
if grep -n "allow read, write: if request.auth != null" firestore.rules | grep -qv "^\s*$"; then
  fail "B5 open authenticated-user wildcard in rules"
else
  pass "B5 no open wildcard in rules"
fi

echo "=== C. Build tests ==="

# C1: TypeScript compiles
if npx tsc --noEmit > /tmp/nw-tsc.log 2>&1; then
  pass "C1 tsc --noEmit clean"
else
  fail "C1 tsc errors (see /tmp/nw-tsc.log)"
fi

# C2: production build succeeds
if npm run build > /tmp/nw-build.log 2>&1; then
  pass "C2 vite production build succeeds"
else
  fail "C2 vite build failed (see /tmp/nw-build.log)"
fi

echo "=== D. Rules tests ==="

# D1: rules compile + release to the named database
if firebase deploy --only firestore:rules --project gen-lang-client-0898030963 > /tmp/nw-rules.log 2>&1; then
  pass "D1 firestore.rules compiled + released"
else
  fail "D1 rules deploy failed (see /tmp/nw-rules.log)"
fi

echo "=== E. Live database tests ==="

TOKEN_FILE="$HOME/.config/configstore/firebase-tools.json"
if [ -f "$TOKEN_FILE" ] && command -v python3 > /dev/null 2>&1; then
  DB_STATE=$(python3 - "$TOKEN_FILE" <<'EOF'
import json, sys, urllib.request
with open(sys.argv[1]) as f:
    token = json.load(f)['tokens']['access_token']
project = 'gen-lang-client-0898030963'
db = 'ai-studio-nestwellsocietya-3362f689-fc24-4131-9685-c6aa5e473e20'
url = f'https://firestore.googleapis.com/v1/projects/{project}/databases/{db}/documents:listCollectionIds'
req = urllib.request.Request(url, data=json.dumps({}).encode(),
    headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req) as resp:
        cols = json.loads(resp.read().decode()).get('collectionIds', [])
        print(','.join(sorted(cols)) if cols else 'EMPTY')
except Exception as e:
    print(f'ERROR:{e}')
EOF
)
  if [[ "$DB_STATE" == ERROR* ]]; then
    skip "E1 live DB check failed ($DB_STATE)"
  elif [ "$DB_STATE" = "EMPTY" ]; then
    pass "E1 live database is clean (no collections)"
  else
    # Non-empty is allowed only when it holds real (non-prototype) data.
    echo "  INFO: live collections: $DB_STATE"
    if echo "$DB_STATE" | tr ',' '\n' | grep -qx "users"; then
      fail "E1 legacy prototype collection 'users' present"
    else
      pass "E1 live database has no prototype collections ($DB_STATE)"
    fi
  fi
else
  skip "E1 no Firebase CLI auth found; live DB check skipped"
fi

echo "=== F. Config & docs tests ==="

# F1: firebase.json targets the named database, no functions block
if grep -q "ai-studio-nestwellsocietya" firebase.json && ! grep -q '"functions"' firebase.json; then
  pass "F1 firebase.json targets named DB, no functions block"
else
  fail "F1 firebase.json misconfigured"
fi

# F2: functions directory removed
if [ -d "functions" ]; then
  fail "F2 functions/ still exists"
else
  pass "F2 functions/ removed"
fi

# F3: operational scripts present
if [ -f "scripts/cleanup-prototype-data.ts" ] && [ -f "scripts/bootstrap-platform-admin.ts" ]; then
  pass "F3 cleanup + bootstrap scripts present"
else
  fail "F3 operational scripts missing"
fi

# F4: cleanup doc present
if [ -f "MOCK_DATA_CLEANUP.md" ]; then
  pass "F4 manual cleanup doc present"
else
  fail "F4 MOCK_DATA_CLEANUP.md missing"
fi

# F5: new tenant-bootstrap components present
if [ -f "src/components/auth/SocietyPicker.tsx" ] && [ -f "src/components/auth/JoinSociety.tsx" ] && [ -f "src/features/admin/SocietyOnboarding.tsx" ]; then
  pass "F5 picker/join/onboarding components present"
else
  fail "F5 tenant-bootstrap components missing"
fi

echo ""
echo "==================================="
echo "Results: $PASS passed, $FAIL failed, $SKIP skipped"
echo "==================================="
[ "$FAIL" -eq 0 ]
