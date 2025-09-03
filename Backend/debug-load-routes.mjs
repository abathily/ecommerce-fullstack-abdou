// debug-load-routes.mjs
import express from "express";

async function tryLoad(label, mountPath, importer) {
  const app = express();
  try {
    const mod = await importer();
    app.use(mountPath, mod.default || mod);
    console.log(`✅ OK: ${label}`);
  } catch (e) {
    console.error(`❌ Échec: ${label} (${mountPath})`);
    console.error(e?.message || e);
  }
}

await tryLoad("reviews", "/api/reviews", () => import("./routes/reviews.js"));
await tryLoad("users", "/api/users", () => import("./routes/userRoutes.js"));
await tryLoad("admin", "/api/admin", () => import("./routes/adminRoutes.js"));
await tryLoad("products", "/api/products", () => import("./routes/productRoutes.js"));
await tryLoad("orders", "/api/orders", () => import("./routes/orderRoutes.js"));
await tryLoad("categories", "/api/categories", () => import("./routes/categoryRoutes.js"));
await tryLoad("contact", "/api/contact", () => import("./routes/contactRoutes.js"));

console.log("Terminé.");
