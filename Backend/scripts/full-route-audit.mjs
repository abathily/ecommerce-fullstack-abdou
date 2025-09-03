import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import express from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const routesDir = path.join(__dirname, '../routes');

async function fullRouteAudit() {
  const files = fs.readdirSync(routesDir).filter(file =>
    file.endsWith('.js') || file.endsWith('.mjs')
  );

  for (const file of files) {
    const filePath = path.join(routesDir, file);
    const routeURL = pathToFileURL(filePath).href;

    console.log(`\n🔍 Audit du fichier : ${file}`);

    try {
      const mod = await import(routeURL);
      const router = mod.default;

      // Vérifie le type
      const isRouter =
        typeof router === 'function' &&
        'stack' in router &&
        Array.isArray(router.stack);

      if (!isRouter) {
        console.warn(`⚠️ Export invalide → Pas un router Express`);
        continue;
      }

      // Vérifie le nombre de routes
      const numRoutes = router.stack.length;
      if (numRoutes === 0) {
        console.warn(`🚨 Router Express valide, mais vide (0 route enregistrée)`);
      } else {
        console.log(`✅ Router Express valide avec ${numRoutes} route(s)`);
      }
    } catch (err) {
      console.error(`❌ Erreur d'import : ${err.message}`);
    }
  }
}

fullRouteAudit();
