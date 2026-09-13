import fs from 'fs';
import path from 'path';

const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebasercPath = path.resolve(process.cwd(), '.firebaserc');

if (!fs.existsSync(configPath)) {
  if (process.env.FIREBASE_APPLET_CONFIG) {
    fs.writeFileSync(configPath, process.env.FIREBASE_APPLET_CONFIG.trim());
    console.log('Restored firebase-applet-config.json from environment variable.');
  } else {
    const defaultConfig = {
      projectId: 'gen-lang-client-0898030963',
      appId: '1:190916723534:web:e75521d08ed7ddd175941f',
      apiKey: 'AIzaSyBrYfdbcT36eUFWj-5yC5aL_vpmjDivfYw',
      authDomain: 'gen-lang-client-0898030963.firebaseapp.com',
      firestoreDatabaseId:
        'ai-studio-nestwellsocietya-3362f689-fc24-4131-9685-c6aa5e473e20',
      storageBucket: 'gen-lang-client-0898030963.firebasestorage.app',
      messagingSenderId: '190916723534',
      oAuthClientId:
        '190916723534-selbf5chkklgvspffh8gtthg8e249s75.apps.googleusercontent.com',
    };
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    console.log('Created default firebase-applet-config.json.');
  }
} else {
  console.log('firebase-applet-config.json is present.');
}

if (!fs.existsSync(firebasercPath)) {
  const rc = {
    projects: {
      default: 'gen-lang-client-0898030963',
    },
  };
  fs.writeFileSync(firebasercPath, JSON.stringify(rc, null, 2));
  console.log('Created .firebaserc.');
} else {
  console.log('.firebaserc is present.');
}
