import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import express from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const routesDir = path.join(__dirname, '../routes');

async function checkRouterStack() {
  const files = fs.readdirSync(routesDir).filter(file =>
    file.endsWith('.js') || file.endsWith('.mjs')
  );

  for (const file of files) {
    const filePath = path.join(routesDir, file);
    const routeURL = pathToFileURL(filePath).href;

    try {
      const mod = await import(routeURL);
      const router = mod.default;

      const isRouter =
        typeof router === 'function' &&
        'stack' in router &&
        Array.isArray(router.stack);

      if (!isRouter) {
        console.warn(`⚠️ ${file} : Export n'est pas un router Express`);
        continue;
      }

      const numRoutes = router.stack.length;
      if (numRoutes === 0) {
        console.warn(`🚨 ${file} : Router sans aucune route enregistrée`);
      } else {
        console.log(`✅ ${file} : ${numRoutes} route(s) détectée(s)`);
      }
    } catch (err) {
      console.error(`❌ Erreur dans ${file} → ${err.message}`);
    }
  }
}

checkRouterStack();
