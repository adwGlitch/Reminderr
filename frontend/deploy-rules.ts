import { initializeApp, cert } from 'firebase-admin/app';
import { getSecurityRules } from 'firebase-admin/security-rules';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf8');
  env.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)="?(.*?)"?$/);
    if (match) {
      process.env[match[1]] = match[2].replace(/\\n/g, '\n');
    }
  });
}

const app = initializeApp({
  credential: cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    privateKey: process.env.FIREBASE_PRIVATE_KEY!,
  })
});

const rulesSource = fs.readFileSync(path.resolve(process.cwd(), '../backend/firestore.rules'), 'utf8');

console.log("Creating ruleset...");
getSecurityRules(app).createRuleset({
  source: {
    files: [{
      name: 'firestore.rules',
      content: rulesSource
    }]
  }
}).then((ruleset: any) => {
  console.log('Ruleset created:', ruleset.name);
  return getSecurityRules(app).updateRelease('cloud.firestore', {
    rulesetName: ruleset.name,
    name: 'cloud.firestore'
  });
}).then(() => {
  console.log('Successfully deployed firestore rules!');
  process.exit(0);
}).catch((err: any) => {
  console.error('Error deploying rules:', err);
  process.exit(1);
});
