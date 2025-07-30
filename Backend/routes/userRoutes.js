import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

// 🔒 Middlewares
import { protect, adminOnly } from "../middleware/authMiddleware.js";

// 🔹 Contrôleurs utilisateur
import {
  registerUser,
  loginUser,
  getProfile,
  getAllUsers,
  deleteUser,
  getConnectionCount,
  updateUserProfile,
  updateUserAdminStatus,
  createUserByAdmin,
  updateUserPrivileges // ✅ Ajout pour modifier les privilèges
} from "../controllers/userController.js";

// 🔹 Contrôleurs auth avancés
import {
  register,
  login,
  getAllUsers as getAllAuthUsers,
  testLoginDebug
} from "../controllers/authController.js";

// 🔹 Statistiques admin
import { getAdminStats } from "../controllers/adminController.js";

const router = express.Router();

//
// 🌐 Authentification
//
router.post("/register", register);                 // 🔐 Inscription
router.post("/login", login);                       // 🔓 Connexion
router.post("/test-login", testLoginDebug);         // 🧪 Debug bcrypt

//
// 👤 Routes utilisateur connecté
//
router.get("/profile", protect, getProfile);                          // 👀 Voir profil
router.put("/:id", protect, updateUserProfile);                       // ✏️ Modifier son profil
router.get("/:id/connections", protect, getConnectionCount);          // 🔢 Connexions

//
// 👑 Routes admin
//
router.get("/", protect, adminOnly, getAllUsers);                     // 📋 Tous les utilisateurs
router.delete("/:id", protect, adminOnly, deleteUser);                // 🗑️ Supprimer utilisateur
router.put("/:id/admin", protect, adminOnly, updateUserAdminStatus); // 🔧 Mettre à jour rôle
router.put("/:id/privileges", protect, adminOnly, updateUserPrivileges); // 🛠️ Mettre à jour privilèges
router.post("/", protect, adminOnly, createUserByAdmin);             // ➕ Créer utilisateur
router.get("/stats", protect, adminOnly, getAdminStats);             // 📊 Statistiques

export default router;
