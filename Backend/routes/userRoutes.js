// routes/userRoutes.js
import express from 'express';
import {
  // Auth publiques
  registerUser,
  loginUser,

  // Utilisateurs connectés
  getProfile,
  updateUserProfile,
  getConnectionCount,

  // Admin
  getAllUsers,
  deleteUser,
  updateUserAdminStatus,
  createUserByAdmin,
  updateUserPrivileges,
  resetUserPassword,

  // Debug
  debugRegisterPayload,
  debugPasswordCompare,
  testLoginDebug
} from '../controllers/userController.js';

import { getAdminStats } from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

//
// 🔓 Authentification publique
//
router.post('/register', registerUser);
router.post('/login', loginUser);

//
// 🧪 Debug API (désactivé en production)
//
if (process.env.NODE_ENV !== 'production') {
  router.post('/debug/register', debugRegisterPayload);
  router.post('/debug/password', debugPasswordCompare);
  router.post('/debug/login-test', testLoginDebug);
}

//
// 🔐 Routes utilisateur connecté
//
router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateUserProfile);
router.get('/connections/:id', getConnectionCount);

//
// 🔒 Routes administrateur
//
router.use(adminOnly);

// Routes statiques prioritaires
router.get('/stats', getAdminStats);

// CRUD utilisateurs admin
router.get('/', getAllUsers);
router.post('/', createUserByAdmin);
router.put('/:id/admin', updateUserAdminStatus);
router.put('/:id/privileges', updateUserPrivileges);
router.put('/:id/reset-password', resetUserPassword);
router.delete('/:id', deleteUser);

export default router;
