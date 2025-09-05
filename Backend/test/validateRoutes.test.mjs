// test/validateRoutes.test.mjs
import fs from "fs";
import path from "path";
import { describe, it, expect } from "vitest";

const ROUTE_FOLDER = "routes"; // à adapter si tes routes sont ailleurs
const routePattern = /router\.(get|post|put|delete)\(['"]\/:\s*['"]/g;

function scanRouteFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  return routePattern.test(content);
}

describe("✅ Validation des routes Express", () => {
  const routeFiles = fs
    .readdirSync(ROUTE_FOLDER)
    .filter(f => f.endsWith(".js") || f.endsWith(".mjs"));

  for (const file of routeFiles) {
    const fullPath = path.join(ROUTE_FOLDER, file);

    it(`Vérifie ${file}`, () => {
      const hasInvalidRoute = scanRouteFile(fullPath);
      expect(hasInvalidRoute).toBe(false); // ❌ si route invalide détectée
    });
  }
});
