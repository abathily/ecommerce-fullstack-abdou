import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// GET /api/debug/users — liste tous les utilisateurs
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password'); // ne pas exposer les mots de passe
    res.status(200).json(users);
  } catch (err) {
    console.error('❌ Erreur debug users :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;
