// controllers/userController.js
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// =========================
// JWT et cookies
// =========================
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '48h';
const COOKIE_SECURE = process.env.NODE_ENV === 'production';

// =========================
/* Helpers */
// =========================
const normalizeEmail = (v) => (v || '').toString().trim().toLowerCase();
const isDupKey = (err) =>
  err && (err.code === 11000 || (err.name === 'MongoServerError' && err.code === 11000));

const ALLOWED_ROLES = new Set(['user', 'admin']);

const sanitizePrivileges = (val) => {
  if (!Array.isArray(val)) return [];
  const out = [];
  for (const item of val) {
    if (typeof item !== 'string') continue;
    const s = item.trim();
    if (!s) continue;
    if (!out.includes(s)) out.push(s);
  }
  return out.slice(0, 100);
};

const toSafe = (user) =>
  user.toSafeJSON
    ? user.toSafeJSON()
    : {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: !!user.isAdmin,
        privileges: Array.isArray(user.privileges) ? user.privileges : [],
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        loginCount: typeof user.loginCount === 'number' ? user.loginCount : 0,
      };

const generateToken = (user, expiresOverride) =>
  jwt.sign(
    { id: user._id, email: user.email, isAdmin: user.isAdmin, role: user.role },
    JWT_SECRET,
    { expiresIn: expiresOverride || JWT_EXPIRES_IN }
  );

// =========================
// Auth publiques
// =========================
export const registerUser = async (req, res) => {
  try {
    const { name, email, password: plainPassword } = req.body;

    const nameOk = (name || '').trim();
    const emailFormatted = normalizeEmail(email);
    const passwordOk = plainPassword ?? '';

    if (!nameOk || !emailFormatted || !passwordOk) {
      return res.status(400).json({ message: 'Nom, email et mot de passe sont requis' });
    }

    const exists = await User.findOne({ email: emailFormatted }).lean();
    if (exists) return res.status(409).json({ message: 'Email déjà utilisé' });

    const user = new User({
      name: nameOk,
      email: emailFormatted,
      role: 'user',
      isAdmin: false,
      privileges: [],
    });

    await user.setPassword(passwordOk);

    try {
      await user.save();
    } catch (e) {
      if (isDupKey(e)) return res.status(409).json({ message: 'Email déjà utilisé' });
      throw e;
    }

    const token = generateToken(user);

    res
      .cookie('token', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: COOKIE_SECURE,
      })
      .status(201)
      .json({
        message: 'Inscription réussie',
        token,
        user: toSafe(user),
      });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Erreur inscription:', error);
    res.status(500).json({ message: "Erreur lors de l'inscription." });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password: plainPassword, remember } = req.body;

    const emailFormatted = normalizeEmail(email);
    const passwordOk = plainPassword ?? '';

    if (!emailFormatted || !passwordOk) {
      return res.status(400).json({ message: 'Identifiants requis' });
    }

    const user = await User.findOne({ email: emailFormatted }).select('+passwordHash');
    if (!user) return res.status(401).json({ message: 'Email ou mot de passe incorrect' });

    const ok = await user.validatePassword(passwordOk);
    if (!ok) return res.status(401).json({ message: 'Email ou mot de passe incorrect' });

    if (typeof user.loginCount === 'number') {
      user.loginCount += 1;
      try {
        await user.save();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Impossible de mettre à jour loginCount:', e?.message || e);
      }
    }

    const cookieOptions = {
      httpOnly: true,
      sameSite: 'lax',
      secure: COOKIE_SECURE,
    };

    const token = remember === true ? generateToken(user, '30d') : generateToken(user);
    if (remember === true) {
      cookieOptions.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 jours
    }

    res.cookie('token', token, cookieOptions).json({
      message: 'Connexion réussie',
      token,
      user: toSafe(user),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Erreur connexion:', error);
    res.status(500).json({ message: 'Erreur lors de la connexion.' });
  }
};

// =========================
// Utilisateur connecté
// =========================
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -passwordHash -__v');
    if (!user) return res.status(404).json({ message: 'Profil introuvable' });
    res.json(toSafe(user));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Erreur profil:', error);
    res.status(500).json({ message: 'Erreur récupération profil' });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+passwordHash');
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    if (typeof req.body.name === 'string' && req.body.name.trim()) {
      user.name = req.body.name.trim();
    }
    if (typeof req.body.email === 'string' && req.body.email.trim()) {
      user.email = normalizeEmail(req.body.email);
    }
    if (typeof req.body.password === 'string' && req.body.password.length > 0) {
      await user.setPassword(req.body.password);
    }

    try {
      const updatedUser = await user.save();
      res.json({ message: 'Profil mis à jour', user: toSafe(updatedUser) });
    } catch (e) {
      if (isDupKey(e)) {
        return res.status(409).json({ message: 'Email déjà utilisé' });
      }
      throw e;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Erreur mise à jour profil:', error);
    res.status(500).json({ message: 'Erreur mise à jour profil' });
  }
};

export const getConnectionCount = async (req, res) => {
  try {
    const { id } = req.params;

    // Autoriser l'utilisateur à voir son propre compteur, sinon admin requis
    if (id !== String(req.user.id) && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const user = await User.findById(id).select('loginCount');
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    res.json({ id: user._id, loginCount: typeof user.loginCount === 'number' ? user.loginCount : 0 });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Erreur compteur connexions:', error);
    res.status(500).json({ message: 'Erreur récupération compteur de connexions' });
  }
};

// =========================
/* Admin */
// =========================
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password -passwordHash -__v').sort({ createdAt: -1 });
    res.json(users.map((u) => toSafe(u)));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Erreur liste utilisateurs:', error);
    res.status(500).json({ message: 'Erreur chargement utilisateurs' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Erreur suppression:', error);
    res.status(500).json({ message: 'Erreur suppression utilisateur' });
  }
};

export const updateUserAdminStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('+passwordHash');
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    if (typeof req.body.role === 'string' && req.body.role.trim()) {
      const nextRole = req.body.role.trim();
      if (!ALLOWED_ROLES.has(nextRole)) {
        return res.status(400).json({ message: 'Rôle invalide' });
      }
      user.role = nextRole;
    }
    if (typeof req.body.isAdmin === 'boolean') {
      user.isAdmin = req.body.isAdmin;
    }

    const updated = await user.save();
    res.json({ message: 'Statut administrateur mis à jour', user: toSafe(updated) });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Erreur MAJ admin:', error);
    res.status(500).json({ message: 'Erreur mise à jour admin' });
  }
};

export const createUserByAdmin = async (req, res) => {
  try {
    const { name, email, password: plainPassword, role, privileges } = req.body;

    const nameOk = (name || '').trim();
    const emailFormatted = normalizeEmail(email);
    const roleOkRaw = (role || 'user').trim();
    const roleOk = ALLOWED_ROLES.has(roleOkRaw) ? roleOkRaw : 'user';
    const privOk = sanitizePrivileges(privileges);

    if (!nameOk || !emailFormatted || !plainPassword) {
      return res.status(400).json({ message: 'Nom, email et mot de passe sont requis' });
    }

    const exists = await User.findOne({ email: emailFormatted }).lean();
    if (exists) return res.status(409).json({ message: 'Email déjà utilisé' });

    const user = new User({
      name: nameOk,
      email: emailFormatted,
      role: roleOk,
      isAdmin: roleOk === 'admin',
      privileges: privOk,
    });

    await user.setPassword(plainPassword);

    try {
      await user.save();
    } catch (e) {
      if (isDupKey(e)) {
        return res.status(409).json({ message: 'Email déjà utilisé' });
      }
      throw e;
    }

    res.status(201).json({
      message: 'Utilisateur créé par admin',
      user: toSafe(user),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Erreur création par admin:', error);
    res.status(500).json({ message: 'Erreur création utilisateur' });
  }
};

export const updateUserPrivileges = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('+passwordHash');
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    if (typeof req.body.role === 'string' && req.body.role.trim()) {
      const nextRole = req.body.role.trim();
      if (!ALLOWED_ROLES.has(nextRole)) {
        return res.status(400).json({ message: 'Rôle invalide' });
      }
      user.role = nextRole;
    }
    if (typeof req.body.isAdmin === 'boolean') {
      user.isAdmin = req.body.isAdmin;
    }
    if (req.body.privileges !== undefined) {
      user.privileges = sanitizePrivileges(req.body.privileges);
    }

    const updated = await user.save();
    res.json({ message: 'Privilèges mis à jour', user: toSafe(updated) });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Erreur MAJ privilèges:', error);
    res.status(500).json({ message: 'Erreur mise à jour privilèges' });
  }
};

export const resetUserPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const emailFormatted = normalizeEmail(email);
    if (!emailFormatted || !newPassword) {
      return res.status(400).json({ message: 'Email et nouveau mot de passe requis' });
    }

    const user = await User.findOne({ email: emailFormatted }).select('+passwordHash');
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    await user.setPassword(newPassword);
    await user.save();

    res.json({ message: 'Mot de passe réinitialisé' });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Erreur reset password:', error);
    res.status(500).json({ message: 'Erreur réinitialisation mot de passe' });
  }
};

// =========================
/* Debug (activer via routes hors production) */
// =========================
export const debugRegisterPayload = async (req, res) => {
  res.status(200).json({ debugPayload: req.body });
};

export const debugPasswordCompare = async (req, res) => {
  try {
    const { email, password } = req.body;
    const emailFormatted = normalizeEmail(email);

    const user = await User.findOne({ email: emailFormatted }).select('+passwordHash');
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    const correspondance = await user.validatePassword(password ?? '');
    const isProd = process.env.NODE_ENV === 'production';
    res.json({
      motDePasseRecu: password,
      hashEnBase: isProd ? undefined : user.passwordHash, // ne pas exposer en prod
      correspondance,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Erreur debug compare:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const testLoginDebug = async (req, res) => {
  try {
    const { email, password } = req.body;
    const emailFormatted = normalizeEmail(email);

    const user = await User.findOne({ email: emailFormatted }).select('+passwordHash');
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    const correspondance = await user.validatePassword(password ?? '');
    const isProd = process.env.NODE_ENV === 'production';
    res.status(200).json({
      debug: {
        emailRecu: email,
        motDePasseRecu: password,
        hashStocke: isProd ? undefined : user.passwordHash, // ne pas exposer en prod
        correspondance,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Erreur debug login:', error);
    res.status(500).json({ message: 'Erreur debug login.' });
  }
};
