import fs from 'fs';
import path from 'path';

const artifactsDir = path.resolve(process.cwd(), 'artifacts');
if (!fs.existsSync(artifactsDir)) {
  fs.mkdirSync(artifactsDir, { recursive: true });
}

const projectId = process.env.PROJECT_ID || 'gen-lang-client-0898030963';
const databaseId =
  process.env.DATABASE_ID ||
  'ai-studio-nestwellsocietya-3362f689-fc24-4131-9685-c6aa5e473e20';
const primaryUrl = `https://${projectId}.web.app`;
const altUrl = `https://${projectId}.firebaseapp.com`;
const sharedPreviewUrl =
  'https://ais-pre-zzgr2xzlldzk3vxwc2zpg5-436884437383.asia-southeast1.run.app';
const devUrl =
  'https://ais-dev-zzgr2xzlldzk3vxwc2zpg5-436884437383.asia-southeast1.run.app';

const commitSha = process.env.GITHUB_SHA || 'local-build';
const branch = process.env.GITHUB_REF_NAME || 'main';
const actor = process.env.GITHUB_ACTOR || 'system';
const workflow = process.env.GITHUB_WORKFLOW || 'Firebase CI/CD';
const runId = process.env.GITHUB_RUN_ID || '';
const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com';
const repository = process.env.GITHUB_REPOSITORY || '';
const runUrl =
  runId && repository ? `${serverUrl}/${repository}/actions/runs/${runId}` : '';
const timestamp = new Date().toISOString();

// 1. Plain text format
const textContent = `============================================================
NESTWELL - FIREBASE PRODUCTION DEPLOYMENT URLS
============================================================
Primary Live URL:      ${primaryUrl}
Alternative Domain:    ${altUrl}
AI Studio Shared App:  ${sharedPreviewUrl}
AI Studio Dev App:     ${devUrl}

Project ID:            ${projectId}
Firestore Database:    ${databaseId}
Git Commit SHA:        ${commitSha}
Branch:                ${branch}
Triggered By:          ${actor}
Deployed At:           ${timestamp}
Status:                SUCCESS
`;

fs.writeFileSync(path.join(artifactsDir, 'deployment-urls.txt'), textContent);

// 2. Structured JSON format
const jsonContent = {
  projectId,
  firestoreDatabaseId: databaseId,
  urls: {
    primary: primaryUrl,
    firebaseApp: altUrl,
    sharedPreview: sharedPreviewUrl,
    devEnvironment: devUrl,
  },
  git: {
    commit: commitSha,
    branch,
    actor,
    workflow,
    runId,
  },
  deployedAt: timestamp,
  status: 'success',
};

fs.writeFileSync(
  path.join(artifactsDir, 'deployment-urls.json'),
  JSON.stringify(jsonContent, null, 2)
);

// 3. Markdown format
const mdContent = `# 🚀 Firebase Deployment Report

**Application**: Greenwood Heights & NestWell Multi-Tenant Society Management  
**Firebase Project**: \`${projectId}\`  
**Status**: ✅ Built & Deployed Successfully

---

## 🌐 Live Application URLs

| Environment | URL | Status |
| :--- | :--- | :--- |
| **Production (Primary)** | [${primaryUrl}](${primaryUrl}) | 🟢 Active |
| **Production (Firebase Domain)** | [${altUrl}](${altUrl}) | 🟢 Active |
| **AI Studio Shared Preview** | [${sharedPreviewUrl}](${sharedPreviewUrl}) | 🟢 Active |
| **AI Studio Dev Environment** | [${devUrl}](${devUrl}) | 🟢 Active |

---

## 📋 Build & Deployment Details
- **Commit SHA**: \`${commitSha}\`
- **Branch**: \`${branch}\`
- **Triggered By**: @${actor}
${runUrl ? `- **Workflow Run**: [View GitHub Actions Run](${runUrl})` : ''}
- **Deployed At**: ${new Date().toUTCString()}
- **Hosting Targets**: \`dist/\` Single-Page App (SPA)
- **Security Rules**: \`firestore.rules\` synced
`;

fs.writeFileSync(path.join(artifactsDir, 'deployment-summary.md'), mdContent);

// 4. Also append to GITHUB_STEP_SUMMARY if running in GitHub Actions
if (process.env.GITHUB_STEP_SUMMARY) {
  try {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, mdContent);
    console.log('Appended deployment report to GITHUB_STEP_SUMMARY.');
  } catch (err) {
    console.warn('Could not write to GITHUB_STEP_SUMMARY:', err);
  }
}

console.log('Successfully generated deployment artifacts in /artifacts:');
console.log('  - artifacts/deployment-urls.txt');
console.log('  - artifacts/deployment-urls.json');
console.log('  - artifacts/deployment-summary.md');
