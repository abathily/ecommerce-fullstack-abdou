// Corrige les paramètres Express mal formés dans les routes
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📁 Dossier à scanner — adapte si tes routes sont ailleurs
const targetDir = path.join(__dirname, '../routes');

// 🔍 Regex pour détecter /:param' ou /:param" ou /:${...}
const badParamRegexes = [
  /\/:([a-zA-Z0-9_]+)(['"])/g,           // ex: /:id' ou /:userId"
  /\/:\$\{[^}]+\}/g                     // ex: /:${id}
];

// 🛠 Fonction de correction
function fixLine(line) {
  let modified = line;

  // Supprime les guillemets qui suivent les paramètres
  modified = modified.replace(/\/:([a-zA-Z0-9_]+)(['"])/g, "/:$1");

  // Remplace /:${variable} par /:variable (si possible)
  modified = modified.replace(/\/:\$\{([^}]+)\}/g, "/:$1");

  return modified;
}

// 🔁 Parcours des fichiers
fs.readdirSync(targetDir).forEach(file => {
  if (!file.endsWith('.js')) return;

  const filePath = path.join(targetDir, file);
  const original = fs.readFileSync(filePath, 'utf8');
  const lines = original.split(/\r?\n/);

  let updated = [];
  let changed = false;

  lines.forEach(line => {
    const fixed = fixLine(line);
    if (fixed !== line) changed = true;
    updated.push(fixed);
  });

  if (changed) {
    fs.writeFileSync(filePath, updated.join('\n'), 'utf8');
    console.log(`✅ Paramètres corrigés dans ${file}`);
  } else {
    console.log(`🔹 Aucun changement dans ${file}`);
  }
});
