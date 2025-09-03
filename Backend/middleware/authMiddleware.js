// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

// 🔐 Middleware de protection des routes
export const protect = async (req, res, next) => {
  try {
    let token;

    // 1️⃣ Autorisation par header Authorization
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1]?.trim();
    }

    // 2️⃣ Fallback: token httpOnly dans cookie
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'Token absent ou non transmis' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(403).json({ message: 'Token invalide ou expiré' });
    }

    const userId = decoded.sub || decoded.id;
    if (!userId) {
      return res.status(403).json({ message: 'Token corrompu: identifiant manquant' });
    }

    const user = await User.findById(userId).select('-password -passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    // Injecte les infos dans req.user
    req.user = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role || (user.isAdmin ? 'admin' : 'user'),
      isAdmin: user.isAdmin === true,
      privileges: Array.isArray(user.privileges) ? user.privileges : [],
    };

    next();
  } catch (err) {
    console.error('protect →', err?.message || err);
    return res.status(500).json({ message: 'Erreur lors de la vérification du token' });
  }
};

//  Middleware d’accès réservé à l’admin
export const adminOnly = (req, res, next) => {
  if (req.user?.isAdmin === true || req.user?.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Accès réservé à l’administrateur' });
};

//  Vérification de privilège spécifique
export const hasPrivilege = (requiredPrivilege) => {
  return (req, res, next) => {
    const privileges = Array.isArray(req.user?.privileges) ? req.user.privileges : [];
    if (privileges.includes(requiredPrivilege)) {
      return next();
    }
    return res.status(403).json({ message: `Privilège "${requiredPrivilege}" requis` });
  };
};
