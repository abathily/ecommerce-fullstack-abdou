// scripts/scanRoutes.js
// Usage:
//   node scripts/scanRoutes.js
//   node scripts/scanRoutes.js --dir ../routes,../src/routes
//
// Sortie avec code 1 si des problèmes sont trouvés (pratique pour CI)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- Helpers
const root = path.resolve(__dirname, "..");

function parseCliDirs() {
  const idx = process.argv.indexOf("--dir");
  if (idx !== -1 && process.argv[idx + 1]) {
    return process.argv[idx + 1]
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => path.resolve(__dirname, p));
  }
  return null;
}

function existingDirs(pathsArr) {
  return pathsArr.filter((p) => {
    try {
      return fs.statSync(p).isDirectory();
    } catch {
      return false;
    }
  });
}

function walk(dir, out = []) {
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }

  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      // ignore common folders that are not source
      if (["node_modules", ".git", "dist", "build", "coverage"].includes(e.name))
        continue;
      walk(full, out);
    } else if (e.isFile()) {
      if (/\.(mjs|cjs|js|ts)$/.test(e.name)) out.push(full);
    }
  }
  return out;
}

function indexToLineCol(text, index) {
  const lines = text.slice(0, index).split(/\r?\n/);
  const line = lines.length; // 1-based
  const col = lines[lines.length - 1].length + 1; // 1-based
  return { line, col };
}

function snippet(lineText, col, max = 120) {
  const caretPos = Math.max(1, Math.min(col, lineText.length));
  const pad = " ".repeat(Math.max(0, caretPos - 1));
  const trimmed =
    lineText.length > max ? lineText.slice(0, max - 3) + "..." : lineText;
  return `${trimmed}\n${pad}^`;
}

// ---- Patterns à risque (path-to-regexp)
const patterns = [
  {
    id: "UNNAMED_PARAM",
    desc: "Paramètre de route sans nom (ex: '/:')",
    // quote '/' ':' then quote/paren/comma/end
    regex: /(['"`])\/:\s*(?=['"`),}])/g,
  },
  {
    id: "UNNAMED_PARAM_ANYWHERE",
    desc: "Occurrence '/:' suivie d’un séparateur (paramètre sans nom)",
    // '/:' then non-word (not a letter/number/_), typical missing name
    regex: /\/:\s*(?=[$'"),}\/`]|$)/g,
  },
  {
    id: "TEMPLATE_EMPTY_PARAM",
    desc: "Template literal avec '/:${...}' (param dynamique potentiellement vide)",
    regex: /\/:\$\{[^}]*\}/g,
  },
  {
    id: "MISSING_SLASH_BEFORE_COLON",
    desc: "Chemin commençant par ':param' sans slash (ex: ':id')",
    regex: /(['"`])\s*:\w+/g,
  },
  // Optionnel: parenthèses non nommées (souvent source d’erreurs avec certaines versions)
  // {
  //   id: "UNNAMED_GROUP",
  //   desc: "Groupe non nommé '(... )' dans le path",
  //   regex: /['"`]\/\([^)]*\)/g,
  // },
];

// Méthodes express pour couvrir router.get/post/etc.
const methodNames = [
  "use",
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "all",
  "options",
  "head",
];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  const findings = [];

  // Ligne par ligne pour avoir des positions précises
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Ne scanner que les lignes susceptibles d’être des déclarations de routes
    if (!methodNames.some((m) => line.includes(`.${m}(`))) {
      // On scanne quand même les patterns bruts au cas où
    }

    for (const p of patterns) {
      let match;
      const regex = new RegExp(p.regex); // fresh instance
      while ((match = regex.exec(line)) !== null) {
        findings.push({
          id: p.id,
          desc: p.desc,
          line: i + 1,
          col: match.index + 1,
          text: line,
        });
        // éviter boucle infinie si regex zéro-longueur
        if (match.index === regex.lastIndex) regex.lastIndex++;
      }
    }
  }

  return findings;
}

function printFinding(filePath, f) {
  const rel = path.relative(root, filePath);
  console.log(`\n❌ ${f.desc}`);
  console.log(`   ↳ Fichier: ${rel}:${f.line}:${f.col}`);
  console.log("   ──>");
  console.log(
    "   " + snippet(f.text, f.col).split("\n").join("\n   ")
  );
}

function main() {
  const cliDirs = parseCliDirs();
  const defaultCandidates = [
    path.join(root, "routes"),
    path.join(root, "src", "routes"),
    path.join(root, "api", "routes"),
  ];
  const targets = existingDirs(cliDirs || defaultCandidates);

  if (!targets.length) {
    console.error(
      "Aucun dossier de routes trouvé. Utilise --dir pour préciser le chemin (ex: --dir ../routes)."
    );
    process.exit(2);
  }

  console.log("🔎 Dossiers scannés:");
  targets.forEach((d) => console.log("  - " + path.relative(root, d)));

  const files = targets.flatMap((d) => walk(d));
  if (!files.length) {
    console.log("Aucun fichier .js/.mjs/.cjs/.ts trouvé dans les dossiers ciblés.");
    process.exit(0);
  }

  let totalFindings = 0;
  for (const f of files) {
    const findings = scanFile(f);
    totalFindings += findings.length;
    findings.forEach((fi) => printFinding(f, fi));
  }

  console.log("\n---");
  if (totalFindings > 0) {
    console.log(`🚨 Problèmes détectés: ${totalFindings}`);
    console.log(
      "Conseil: remplace '/:' par '/:paramName' (ex: '/:id'), et évite '/:${variable}' si variable peut être vide."
    );
    process.exit(1);
  } else {
    console.log("✅ Aucun pattern de route mal formé détecté.");
    process.exit(0);
  }
}

main();
