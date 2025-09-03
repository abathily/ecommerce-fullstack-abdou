import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const routesDir = path.join(__dirname, '../routes');

async function testRoutes() {
  const files = fs.readdirSync(routesDir).filter(file =>
    file.endsWith('.js') || file.endsWith('.mjs')
  );

  for (const file of files) {
    const filePath = path.join(routesDir, file);
    const routeURL = pathToFileURL(filePath).href;

    try {
      console.log(`✅ Import réussi : ${file}`);
      await import(routeURL);
    } catch (err) {
      console.error(`❌ Erreur d'import dans ${file}`);
      console.error(`⛔ Type : ${err.name}`);
      console.error(`🪲 Message : ${err.message}`);
      console.error(`📍 Stack : ${err.stack.split('\n')[1]?.trim()}`);
    }
  }
}

testRoutes();
