const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ✅ Middleware pour sécuriser les routes (utilisateur connecté)
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '⛔ Token manquant ou mal formé' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id) {
      return res.status(403).json({ message: '⛔ Token invalide ou corrompu' });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: '👤 Utilisateur introuvable' });
    }

    // 🧠 Attache les infos utilisateur à la requête
    req.user = user;

    // ✅ Optionnel : logique d’expiration personnalisée
    // if (Date.now() - new Date(user.lastActivity).getTime() > 1000 * 60 * 60 * 24) {
    //   return res.status(403).json({ message: '⏳ Session expirée' });
    // }

    next();
  } catch (err) {
    console.error('❌ Erreur protectMiddleware :', err.message);
    res.status(403).json({ message: 'Token invalide ou expiré' });
  }
};

// ✅ Middleware d’accès restreint aux administrateurs
const adminOnly = (req, res, next) => {
  if (req.user?.isAdmin) {
    return next();
  }
  res.status(403).json({ message: '⛔ Accès réservé à l’administrateur' });
};

// 🔐 Middleware de vérification des privilèges
const hasPrivilege = (requiredPrivilege) => {
  return (req, res, next) => {
    if (req.user?.privileges?.includes(requiredPrivilege)) {
      return next();
    }
    res.status(403).json({ message: `⛔ Privilège "${requiredPrivilege}" requis` });
  };
};

module.exports = {
  protect,
  adminOnly,
  hasPrivilege
};
