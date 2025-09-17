// fix-api-url.js
import fs from 'fs';
import path from 'path';

const projectDir = './src'; // Dossier racine de ton frontend
const oldUrl = 'https://ecommerce-fullstack-abdou.onrender.com';
const newUrl = 'https://backend-9qig.onrender.com';
const envVar = "process.env.REACT_APP_API_URL || '" + newUrl + "'";

function scanAndReplace(dir) {
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanAndReplace(fullPath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let replaced = false;

      // Remplace l'ancienne URL directe
      if (content.includes(oldUrl)) {
        content = content.replaceAll(oldUrl, newUrl);
        replaced = true;
      }

      // Remplace les anciennes définitions de API_BASE
      const regexApiBase = /const\s+API_BASE\s*=\s*.*?;/;
      if (regexApiBase.test(content)) {
        content = content.replace(regexApiBase, `const API_BASE = ${envVar};`);
        replaced = true;
      }

      if (replaced) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ Corrigé : ${fullPath}`);
      }
    }
  });
}

scanAndReplace(projectDir);
console.log('🎉 Correction terminée.');
