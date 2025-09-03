// scripts/probeRoutes.mjs
import fs from "fs";
import path from "path";
import { pathToFileURL, fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = process.cwd(); // lance depuis le dossier Backend
const ROUTES_DIR = path.resolve(ROOT, "routes");

// couleurs simples sans dépendances
const c = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  gray: (s) => `\x1b[90m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

// Détecte les chemins Express mal formés: "/:" sans nom de paramètre juste après
// (Autorise :id, :slug, :id? ou :id(\\d+) etc. — rejette seulement "/:" suivi de fin ou d’un séparateur non alphanumérique/_)
function hasInvalidParam(pathStr) {
  return /\/:(?:$|[^A-Za-z0-9_])/.test(pathStr);
}

// Extrait des chemins des lignes router.get/post/put/patch/delete/all("...")
function extractPathsByLine(fileText) {
  const lines = fileText.split(/\r?\n/);
  const findings = [];
  const methodRe =
    /\brouter\.(get|post|put|patch|delete|all|use)\s*\(\s*(['"`])([^'"`]*?)\2/g;

  lines.forEach((line, i) => {
    let m;
    while ((m = methodRe.exec(line)) !== null) {
      const method = m[1].toUpperCase();
      const rawPath = m[3];
      findings.push({ lineNo: i + 1, method, path: rawPath, line: line.trim() });
    }
  });
  return findings;
}

// Vérifie rapidement si l’export ressemble à un Router Express
function isExpressRouter(candidate) {
  return (
    candidate &&
    typeof candidate === "function" &&
    typeof candidate.use === "function" &&
    typeof candidate.handle === "function"
  );
}

async function main() {
  console.log(c.bold(`🔎 Probe des routes dans: ${ROUTES_DIR}\n`));

  if (!fs.existsSync(ROUTES_DIR)) {
    console.error(c.red(`Dossier introuvable: ${ROUTES_DIR}`));
    process.exit(1);
  }

  const files = fs
    .readdirSync(ROUTES_DIR)
    .filter((f) => f.endsWith(".js") || f.endsWith(".mjs"));

  if (files.length === 0) {
    console.log(c.yellow("Aucun fichier de routes *.js trouvé."));
    return;
  }

  // Import express ici pour éviter d’exploser si express manque
  let express;
  try {
    express = (await import("express")).default;
  } catch (e) {
    console.error(c.red(`Impossible d'importer express: ${e.message}`));
    process.exit(1);
  }

  let failures = 0;
  let success = 0;

  for (const file of files) {
    const filePath = path.join(ROUTES_DIR, file);
    const rel = path.relative(ROOT, filePath);
    console.log(c.cyan(`\n—> Fichier: ${rel}`));

    // 1) Scan statique du contenu pour repérer des patterns suspects
    const text = fs.readFileSync(filePath, "utf8");
    const declarations = extractPathsByLine(text);

    const invalids = declarations.filter((d) => hasInvalidParam(d.path));
    if (invalids.length) {
      console.log(c.red(`  ❌ Chemins suspects détectés:`));
      invalids.forEach((d) => {
        console.log(
          `     • ligne ${d.lineNo} (${d.method}) path="${d.path}"\n       ${c.gray(d.line)}`
        );
      });
    } else {
      console.log(c.green("  ✓ Aucun chemin suspect détecté (scan statique)"));
    }

    // 2) Import dynamique du module
    let mod;
    try {
      mod = await import(pathToFileURL(filePath).href);
      console.log(c.green("  ✓ Import réussi"));
    } catch (e) {
      console.log(c.red("  ❌ Erreur à l'import du module"));
      console.log("     ", e.message);
      failures++;
      // pas la peine d’essayer de monter si l’import foire
      continue;
    }

    // 3) Récupération d’un export plausible
    const candidate =
      mod.default && isExpressRouter(mod.default)
        ? mod.default
        : mod.router && isExpressRouter(mod.router)
        ? mod.router
        : mod.default || mod.router || null;

    if (!isExpressRouter(candidate)) {
      console.log(
        c.yellow(
          "  ⚠️ Aucun export qui ressemble à un Router Express (default/router)."
        )
      );
      // On continue quand même, mais on log le type trouvé
      if (candidate) {
        console.log(
          c.gray(
            `     Type exporté: ${typeof candidate} — clés: ${Object.keys(candidate || {}).join(", ")}`
          )
        );
      }
      failures++;
      continue;
    }

    // 4) Tentative de montage dans une app jetable
    const app = express();
    const base = "/_probe/" + path.basename(file, path.extname(file));
    try {
      app.use(base, candidate);
      console.log(c.green(`  ✓ Monté sur "${base}"`));
      success++;

      // 5) Inventaire des routes réellement enregistrées
      if (candidate.stack && Array.isArray(candidate.stack)) {
        const routes = [];
        for (const layer of candidate.stack) {
          if (layer.route && layer.route.path) {
            const methods = Object.keys(layer.route.methods)
              .filter(Boolean)
              .map((m) => m.toUpperCase())
              .join(",");
            routes.push({ path: layer.route.path, methods });
          }
        }
        if (routes.length) {
          console.log(c.gray("  Routes détectées:"));
          routes.forEach((r) =>
            console.log(c.gray(`     • [${r.methods}] ${r.path}`))
          );
        } else {
          console.log(c.gray("  (aucune route détectée dans ce router)"));
        }
      }
    } catch (e) {
      console.log(c.red(`  ❌ Erreur au montage sur "${base}"`));
      console.log("     ", e.message);
      if (e.stack) console.log(c.gray(String(e.stack).split("\n")[0]));
      failures++;
    }
  }

  console.log(
    `\n${c.bold("Résumé:")} ${c.green(`${success} ok`)} / ${c.red(
      `${failures} échec(s)`
    )}`
  );

  if (failures > 0) process.exitCode = 1;
}

await main();
