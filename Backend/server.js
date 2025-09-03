// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import reviewRoutes from "./routes/reviews.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";

import User from "./models/User.js";
import syncCategoriesFromProducts from "./syncCategoriesFromProducts.js";

dotenv.config();

// __dirname compatible ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.disable("x-powered-by");
mongoose.set("strictQuery", true);

const isProd = process.env.NODE_ENV === "production";

// Si déployé derrière un proxy (HTTPS terminé en amont), nécessaire pour cookies secure
if (isProd) {
  app.set("trust proxy", 1);
}

// ---------- Utils: montage sécurisé et introspection ----------
function safeMount(mountPath, router, name = "router") {
  if (typeof mountPath !== "string" || !mountPath.startsWith("/")) {
    throw new Error(`Mount path invalide pour ${name}: ${mountPath}`);
  }
  if (mountPath === "*" || /:/.test(mountPath) || mountPath.startsWith("/:")) {
    throw new Error(
      `Mount path dangereux pour ${name}: "${mountPath}". Utilise un chemin statique (ex: "/api/users").`
    );
  }
  app.use(mountPath, router);
  if (process.env.NODE_ENV !== "production") {
    console.log(`🔌 Mount: ${name} -> ${mountPath}`);
  }
}

function getMountFromLayer(layer) {
  const re = layer?.regexp;
  if (!re) return "";
  if (re.fast_slash) return "";
  if (re.fast_star) return "*";

  const src = re.source; // e.g. ^\/api\/?(?=\/|$)
  const m = src.match(/^\^\\\/(?<p>.+?)\\\/\?\(\?=\\\/\|\$\)$/);
  if (m?.groups?.p) {
    const p = m.groups.p.replace(/\\\//g, "/").replace(/\\\./g, ".");
    return ("/" + p).replace(/\/+/g, "/");
  }
  return "";
}

function listAllRoutes(appOrRouter) {
  const routes = [];
  function walk(stack, prefix = "") {
    for (const layer of stack) {
      if (layer.route && layer.route.path) {
        const fullPath = (prefix + layer.route.path).replace(/\/+/g, "/");
        const methods = Object.keys(layer.route.methods).map((m) => m.toUpperCase());
        for (const method of methods) {
          routes.push({ method, path: fullPath });
        }
      } else if (layer.name === "router" && layer.handle?.stack) {
        const mount = getMountFromLayer(layer);
        walk(layer.handle.stack, (prefix + mount).replace(/\/+/g, "/"));
      }
    }
  }
  const stack = appOrRouter._router?.stack || appOrRouter.stack || [];
  walk(stack, "");
  routes.sort((a, b) => (a.path === b.path ? a.method.localeCompare(b.method) : a.path.localeCompare(b.path)));
  return routes;
}

function listMounts(appOrRouter) {
  const mounts = [];
  const stack = appOrRouter._router?.stack || appOrRouter.stack || [];
  for (const layer of stack) {
    if (layer.name === "router" && layer.handle?.stack) {
      const mount = getMountFromLayer(layer);
      mounts.push({
        mount,
        suspicious: mount === "*" || /:/.test(mount) || mount.startsWith("/:"),
      });
    }
  }
  return mounts;
}

// ---------- CORS ----------
// Frontend envoie withCredentials: true -> autoriser credentials et origine exacte
// Ajoute par défaut 3000, 3001 (CRA), 5173 (Vite) pour dev
const defaultDevOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const envOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins = envOrigins.length ? envOrigins : defaultDevOrigins;

const corsOptions = {
  origin(origin, cb) {
    // Autorise les requêtes sans header Origin (ex: curl, healthchecks)
    if (!origin) return cb(null, true);

    // En dev, autorise localhost/127.0.0.1 sur n'importe quel port
    try {
      const u = new URL(origin);
      if (!isProd && (u.hostname === "localhost" || u.hostname === "127.0.0.1")) {
        return cb(null, true);
      }
    } catch {
      // ignore parsing error -> fallback allowlist
    }

    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With", "Origin"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions)); // preflight

// ---------- Parsers & middlewares ----------
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
if (!isProd) app.use(morgan("dev"));

// ---------- Static ----------
safeMount("/uploads", express.static(path.join(__dirname, "uploads")), "static:uploads");

// ---------- Healthcheck ----------
app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));

// ---------- Routes API (montage sécurisé) ----------
safeMount("/api/reviews", reviewRoutes, "reviews");
safeMount("/api/users", userRoutes, "users");
safeMount("/api/admin", adminRoutes, "admin");
safeMount("/api/products", productRoutes, "products");
safeMount("/api/orders", orderRoutes, "orders");
safeMount("/api/categories", categoryRoutes, "categories");
safeMount("/api/contact", contactRoutes, "contact");

// ---------- Introspection (dev only) ----------
if (!isProd) {
  app.get("/_int/routes", (_req, res) => {
    const routes = listAllRoutes(app);
    res.status(200).json({ count: routes.length, routes });
  });

  app.get("/_int/mounts", (_req, res) => {
    const mounts = listMounts(app);
    res.status(200).json({
      mounts,
      suspicious: mounts.filter((m) => m.suspicious),
    });
  });
}

// ---------- 404 API ----------
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ message: "Route API introuvable" });
  }
  next();
});

// ---------- Error handler JSON ----------
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const message = err?.message || "Erreur serveur";
  // Log propre en dev, minimal en prod
  if (!isProd) {
    console.error("Erreur:", err?.stack || err);
  } else {
    console.error("Erreur:", message);
  }
  res.status(status).json({ message });
});

// ---------- Seed admin (optionnel, évite double-hash) ----------
async function seedAdminIfNeeded() {
  if (process.env.SEED_ADMIN !== "true") return;

  try {
    const email = (process.env.SEED_ADMIN_EMAIL || "admin@example.com").toLowerCase().trim();
    const password = process.env.SEED_ADMIN_PASSWORD || "Admin@2025";
    const name = process.env.SEED_ADMIN_NAME || "Admin";

    const existing = await User.findOne({ email });
    if (existing) {
      console.log("👤 Admin seed déjà existant");
      return;
    }

    const admin = new User({
      name,
      email,
      isAdmin: true,
      role: "admin",
      privileges: [],
    });

    // Utilise la même méthode que tes contrôleurs
    if (typeof admin.setPassword === "function") {
      await admin.setPassword(password);
    } else {
      // Fallback si le modèle hash via pre-save (si défini)
      admin.password = password;
    }

    await admin.save();
    console.log("✅ Admin seed créé avec succès");
  } catch (error) {
    console.error("❌ Erreur seed admin :", error?.message || error);
  }
}

// ---------- Démarrage ----------
const PORT = Number(process.env.PORT) || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI manquant dans .env");
  process.exit(1);
}

let server;

async function start() {
  try {
    // Connexion MongoDB
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log("✅ MongoDB connecté");

    // Tâches au boot
    try {
      await syncCategoriesFromProducts();
    } catch (e) {
      console.warn("⚠️ syncCategoriesFromProducts a échoué:", e?.message || e);
    }
    await seedAdminIfNeeded();

    // Vérification des montages (dev)
    if (!isProd) {
      const mounts = listMounts(app);
      const suspicious = mounts.filter((m) => m.suspicious);
      if (suspicious.length) {
        console.error("🧨 Mounts suspects détectés:", suspicious);
        process.exit(1);
      }
    }

    // Lancement du serveur
    server = app.listen(PORT, () => {
      console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
      if (envOrigins.length) {
        console.log("🌐 CORS origins (env):", allowedOrigins.join(", "));
      } else {
        console.log("🌐 CORS origins (defaults):", allowedOrigins.join(", "));
      }
    });
  } catch (err) {
    console.error("❌ Échec au démarrage:", err?.message || err);
    process.exit(1);
  }
}

// Gestion propre des signaux et erreurs process
process.on("unhandledRejection", (reason) => {
  console.error("🧨 Rejet non géré:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("🧨 Exception non gérée:", err);
  shutdown(1);
});

process.on("SIGINT", () => {
  console.log("🛑 Arrêt demandé (SIGINT)...");
  shutdown(0);
});

process.on("SIGTERM", () => {
  console.log("🛑 Arrêt demandé (SIGTERM)...");
  shutdown(0);
});

async function shutdown(code) {
  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (mongoose.connection.readyState) {
      await mongoose.connection.close();
    }
  } catch (e) {
    console.error("Erreur lors de l'arrêt:", e?.message || e);
  } finally {
    process.exit(code);
  }
}

start();

export default app;
