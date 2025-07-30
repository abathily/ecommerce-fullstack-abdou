import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcrypt";
import path from "path";
import { fileURLToPath } from "url";

// 📦 Imports internes
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
const app = express();

/** 🧭 Résolution __dirname avec ES modules */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** 🔐 Middleware */
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

/** 📁 Servir les fichiers uploadés */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/** 🔌 Connexion MongoDB */
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB connecté");
    await syncCategoriesFromProducts();
    await testCreateUser();
  })
  .catch((err) => {
    console.error("❌ Erreur MongoDB :", err.message);
  });

/** 🧪 Création d'un admin test */
async function testCreateUser() {
  try {
    const emailTest = "kov@gmail.com";
    const existing = await User.findOne({ email: emailTest });
    if (!existing) {
      const hashed = await bcrypt.hash("motdepasse", 10);
      await User.create({
        name: "kov",
        email: emailTest,
        password: hashed,
        isAdmin: true,
        privileges: ["produits", "utilisateurs"]
      });
      console.log("👑 Admin de test créé");
    }
  } catch (err) {
    console.error("❌ Erreur création admin :", err.message);
  }
}

/** 🛣️ Brancher les routes */
app.use("/api/users", userRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/contact", contactRoutes);

/** 🚀 Lancer serveur */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🌍 Serveur lancé sur http://localhost:${PORT}`);
});
