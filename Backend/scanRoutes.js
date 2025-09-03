// scripts/scanRoutes.js
import fs from "fs";
import path from "path";
import readline from "readline";

// Dossier contenant tes fichiers de routes
const routesDir = path.resolve("./routes");

// Motif RegExp : détecte les /: mal formés (sans nom derrière)
const badParamPattern = /\/:[^a-zA-Z0-9]/;

console.log("🔎 Scan des fichiers dans", routesDir, "\n");

fs.readdirSync(routesDir).forEach((file) => {
  const filePath = path.join(routesDir, file);

  // Ignore les répertoires
  if (fs.statSync(filePath).isDirectory()) return;

  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  });

  let lineNum = 1;
  let foundIssues = [];

  rl.on("line", (line) => {
    if (badParamPattern.test(line)) {
      foundIssues.push({ line: line.trim(), lineNum });
    }
    lineNum++;
  });

  rl.on("close", () => {
    if (foundIssues.length) {
      console.log(`❌ Problème(s) trouvé(s) dans ${file} :`);
      foundIssues.forEach(({ line, lineNum }) =>
        console.log(`   → ligne ${lineNum}: ${line}`)
      );
      console.log(""); // espace entre les fichiers
    }
  });
});
