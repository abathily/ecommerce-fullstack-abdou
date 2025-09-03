import express from 'express';

import {
  registerUser,
  loginUser,
  getProfile,
  getAllUsers,
  deleteUser,
  updateUserAdminStatus,
  createUserByAdmin,    //  Admin crée un utilisateur
  resetUserPassword     //  Admin réinitialise mot de passe
} from '../controllers/userController.js';

import { getAdminStats } from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

//
//  Routes publiques
//
router.post('/register', registerUser);     //  Inscription
router.post('/login', loginUser);           //  Connexion

//
//  Routes utilisateurs connectés
//
router.get('/profile', protect, getProfile); //  Voir son profil

//
//  Routes réservées à l’administrateur
//
router.get('/stats', protect, adminOnly, getAdminStats);                //  Statistiques admin
router.get('/users', protect, adminOnly, getAllUsers);                  //  Liste utilisateurs
router.post('/users', protect, adminOnly, createUserByAdmin);           //  Création utilisateur
router.put('/users/:id', protect, adminOnly, updateUserAdminStatus);    //  Modifier rôle
router.delete('/users/:id', protect, adminOnly, deleteUser);            //  Supprimer utilisateur
router.post('/reset-password', protect, adminOnly, resetUserPassword); //  Réinitialiser mot de passe

export default router;
