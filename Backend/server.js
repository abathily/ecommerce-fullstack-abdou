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

import debugRoutes from './routes/debugRoutes.js';
app.use('/api/debug', debugRoutes);


dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.disable("x-powered-by");
mongoose.set("strictQuery", true);

const isProd = process.env.NODE_ENV === "production";
if (isProd) {
  app.set("trust proxy", 1);
}

// ---------- CORS ----------
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
    if (!origin || allowedOrigins.includes(origin)) {
      return cb(null, true);
    }
    console.warn(`❌ CORS refusé pour : ${origin}`);
    return cb(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With", "Origin"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

// ---------- Middlewares ----------
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
if (!isProd) app.use(morgan("dev"));

// ---------- Static ----------
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---------- Healthcheck ----------
app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));

// ---------- Routes API ----------
app.use("/api/reviews", reviewRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/contact", contactRoutes);

// ---------- 404 API ----------
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ message: "Route API introuvable" });
  }
  next();
});

// ---------- Error handler ----------
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const message = err?.message || "Erreur serveur";
  if (!isProd) {
    console.error("Erreur:", err?.stack || err);
  } else {
    console.error("Erreur:", message);
  }
  res.status(status).json({ message });
});

// ---------- Seed admin ----------
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
    const admin = new User({ name, email, isAdmin: true, role: "admin", privileges: [] });
    if (typeof admin.setPassword === "function") {
      await admin.setPassword(password);
    } else {
      admin.password = password;
    }
    await admin.save();
    console.log("✅ Admin seed créé avec succès");
  } catch (error) {
    console.error("❌ Erreur seed admin :", error?.message || error);
  }
}

// ---------- Start ----------
const PORT = Number(process.env.PORT) || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI manquant dans .env");
  process.exit(1);
}

let server;

async function start() {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log("✅ MongoDB connecté");
    console.log(`🛠️ Environnement : ${process.env.NODE_ENV}`);

    try {
      await syncCategoriesFromProducts();
    } catch (e) {
      console.warn("⚠️ syncCategoriesFromProducts a échoué:", e?.message || e);
    }
    await seedAdminIfNeeded();

    server = app.listen(PORT, () => {
      console.log(`🚀 Serveur lancé sur port ${PORT}`);
      console.log("🌐 CORS origins:", allowedOrigins.join(", "));
    });
  } catch (err) {
    console.error("❌ Échec au démarrage:", err?.message || err);
    process.exit(1);
  }
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

async function shutdown(code) {
  try {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState) await mongoose.connection.close();
  } catch (e) {
    console.error("Erreur lors de l'arrêt:", e?.message || e);
  } finally {
    process.exit(code);
  }
}

start();

export default app;
