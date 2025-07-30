import express from 'express';
import {
  registerUser,
  loginUser,
  getProfile,
  getAllUsers,
  deleteUser,
  updateUserAdminStatus,
  createUserByAdmin, // ✅ à ajouter dans userController.js
  resetUserPassword, // ✅ à créer dans userController.js
} from '../controllers/userController.js';

import { getAdminStats } from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

//
// 🔓 Routes publiques (authentification)
//
router.post('/register', registerUser);      // 🔐 Créer un compte
router.post('/login', loginUser);            // 🔓 Connexion

//
// 👤 Routes utilisateur connecté
//
router.get('/profile', protect, getProfile); // 👀 Voir son profil

//
// 👑 Routes admin uniquement
//
router.get('/stats', protect, adminOnly, getAdminStats);              // 📊 Dashboard admin
router.get('/users', protect, adminOnly, getAllUsers);                // 📋 Liste utilisateurs
router.post('/users', protect, adminOnly, createUserByAdmin);         // ➕ Création admin→utilisateur
router.put('/users/:id', protect, adminOnly, updateUserAdminStatus);  // 🔧 Mise à jour rôle
router.delete('/users/:id', protect, adminOnly, deleteUser);          // 🗑️ Suppression utilisateur
router.post('/reset-password', protect, adminOnly, resetUserPassword); // 🔐 Réinitialisation mot de passe

export default router;
