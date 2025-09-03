// scripts/scan-routes.mjs
// Usage:
//   node scripts/scan-routes.mjs [dir1] [dir2] ...
// Par défaut, scanne ./routes et le fichier server.js à la racine.
// Signale les chemins comme "/:" (paramètre sans nom) dans les définitions de routes Express.

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cwd = process.cwd();

const defaultTargets = [
  path.join(cwd, "routes"),
  path.join(cwd, "server.js"),
];

const userArgs = process.argv.slice(2);
const targets = userArgs.length
  ? userArgs.map((p) => path.resolve(cwd, p))
  : defaultTargets;

const JS_FILE = /\.(m?js|cjs)$/i;

// Méthodes Express à inspecter
const METHOD_RE = /\b(?:router|app)\s*\.\s*(get|post|put|patch|delete|use|all)\s*\(\s*(['"`])([^'"`]*?)\2/gi;

// Heuristique: repérer "/:" non suivi d'un nom valide (lettres/chiffres/underscore)
// -> cas problématiques: "/:", "/: ", "/:)", "/:?", "/:!", "/:/" etc.
const MISSING_NAME_RE = /\/:($|[^A-Za-z0-9_])/;

// Utilitaire: parcours récursif
async function walk(dir, out = []) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (e) {
    // Pas un dossier ? Ignorer silencieusement (ex: server.js passé comme "dir")
    return out;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) await walk(full, out);
    else if (JS_FILE.test(ent.name)) out.push(full);
  }
  return out;
}

// Lit un fichier et retourne les occurrences suspectes
async function scanFile(file) {
  let text;
  try {
    text = await fs.readFile(file, "utf8");
  } catch {
    return [];
  }

  const results = [];
  for (const m of text.matchAll(METHOD_RE)) {
    const method = m[1];
    const rawPath = m[3]; // contenu du littéral string
    const idx = m.index ?? 0;

    if (!rawPath) continue;

    // Ignore les patterns dynamiques (template strings avec ${}) — on ne sait pas analyser statiquement
    if (rawPath.includes("${")) continue;

    // Détection du "/:" sans nom
    const bad = rawPath.match(MISSING_NAME_RE);
    if (bad) {
      const { line, col } = indexToLineCol(text, idx);
      results.push({
        method,
        path: rawPath,
        line,
        col,
        hint:
          "Paramètre sans nom juste après ':'. Exemple: remplace '/:' par '/:id'.",
      });
      continue;
    }

    // (Optionnel) autres vérifs simples liées aux segments dynamiques
    // - Espace immédiatement après ":" => "/: id"
    if (/\/:\s/.test(rawPath)) {
      const { line, col } = indexToLineCol(text, idx);
      results.push({
        method,
        path: rawPath,
        line,
        col,
        hint:
          "Espace après ':'. Exemple: '/: id' -> '/:id'.",
      });
    }
  }

  return results;
}

function indexToLineCol(text, index) {
  // Approximation suffisante: compter les \n avant l'index
  const upTo = text.slice(0, index);
  const lines = upTo.split("\n");
  const line = lines.length;
  const col = lines[lines.length - 1].length + 1;
  return { line, col };
}

async function main() {
  // Construire la liste de fichiers à scanner
  const files = new Set();

  for (const target of targets) {
    let stat;
    try {
      stat = await fs.stat(target);
    } catch {
      continue;
    }

    if (stat.isDirectory()) {
      const jsFiles = await walk(target);
      jsFiles.forEach((f) => files.add(f));
    } else if (stat.isFile() && JS_FILE.test(target)) {
      files.add(target);
    }
  }

  if (files.size === 0) {
    console.log("Aucun fichier .js trouvé dans les cibles:", targets);
    process.exit(0);
  }

  let totalIssues = 0;
  for (const file of files) {
    const issues = await scanFile(file);
    if (issues.length) {
      console.log(`\n${file}`);
      for (const issue of issues) {
        totalIssues++;
        console.log(
          `  [${issue.method.toUpperCase()}] ${issue.path}  (ligne ${issue.line}, col ${issue.col})`
        );
        console.log(`    -> ${issue.hint}`);
      }
    }
  }

  if (!totalIssues) {
    console.log("✅ Aucun chemin suspect détecté (/: sans nom).");
  } else {
    console.log(`\n🚨 ${totalIssues} occurrence(s) suspecte(s) détectée(s).`);
    process.exitCode = 1; // code de sortie non-zero pour CI/alertes
  }
}

main().catch((e) => {
  console.error("Erreur du scanner:", e);
  process.exit(2);
});
