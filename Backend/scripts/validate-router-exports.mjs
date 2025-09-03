import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { default as express } from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const routesDir = path.join(__dirname, '../routes');

async function validateRouterExports() {
  const files = fs.readdirSync(routesDir).filter(file =>
    file.endsWith('.js') || file.endsWith('.mjs')
  );

  for (const file of files) {
    const filePath = path.join(routesDir, file);
    const routeURL = pathToFileURL(filePath).href;

    try {
      const mod = await import(routeURL);
      const exportVal = mod.default;

      const isRouter =
        typeof exportVal === 'function' &&
        Object.prototype.toString.call(exportVal) === '[object Function]' &&
        'stack' in exportVal &&
        Array.isArray(exportVal.stack);

      if (isRouter) {
        console.log(`✅ Export valide dans ${file} → Express router détecté`);
      } else {
        console.warn(`⚠️ Export douteux dans ${file} → Pas un router Express`);
      }
    } catch (err) {
      console.error(`❌ Erreur d'import dans ${file}`);
      console.error(`🪲 ${err.message}`);
    }
  }
}

validateRouterExports();
