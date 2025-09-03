// scripts/test-express-routes.mjs
import fs from "fs";
import path from "path";

const ROUTES_DIR = "routes"; // adapte selon ton architecture
const BAD_ROUTE_REGEX = /router\.(get|post|put|delete)\s*\(\s*['"]\/:\s*['"]/g;

function scanRoutes(dir) {
  const files = fs.readdirSync(dir);
  let foundError = false;

  for (const file of files) {
    const filePath = path.join(dir, file);
    if (!filePath.endsWith(".js") && !filePath.endsWith(".mjs")) continue;

    const content = fs.readFileSync(filePath, "utf8");
    const matches = content.match(BAD_ROUTE_REGEX);

    if (matches) {
      foundError = true;
      console.log(`❌ Route suspecte trouvée dans ${file}:`);
      matches.forEach(m => console.log(` → ${m}`));
    }
  }

  if (!foundError) {
    console.log("✅ Aucune route Express invalide détectée.");
  }
}

scanRoutes(ROUTES_DIR);
