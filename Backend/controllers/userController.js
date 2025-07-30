import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// 🔐 Générer un token JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, isAdmin: user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );
};

// 📝 Inscription utilisateur
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Tous les champs sont requis." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(400).json({ message: "Email déjà utilisé." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword
    });

    const token = generateToken(user);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error("Erreur inscription :", error.message);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// 🔐 Connexion utilisateur
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: "Utilisateur introuvable." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Mot de passe incorrect." });
    }

    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error("Erreur connexion :", error.message);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// 👤 Récupérer profil utilisateur connecté
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Profil non trouvé." });
    }
    res.json(user);
  } catch (error) {
    console.error("Erreur récupération profil :", error.message);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// 🔄 Mettre à jour profil utilisateur
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    if (req.body.password) {
      user.password = await bcrypt.hash(req.body.password, 10);
    }

    const updated = await user.save();
    res.status(200).json({
      message: "Profil mis à jour.",
      user: {
        id: updated._id,
        name: updated.name,
        email: updated.email,
        isAdmin: updated.isAdmin
      }
    });
  } catch (error) {
    console.error("Erreur mise à jour profil :", error.message);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// 🔢 Compteur de connexions
export const getConnectionCount = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    res.status(200).json({ count: user.loginCount || 0 });
  } catch (error) {
    console.error("Erreur récupération connexions :", error.message);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// 👑 Récupérer tous les utilisateurs
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    console.error("Erreur récupération utilisateurs :", error.message);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// 🗑️ Supprimer un utilisateur
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }
    res.json({ message: "Utilisateur supprimé." });
  } catch (error) {
    console.error("Erreur suppression utilisateur :", error.message);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// 🔧 Mise à jour du rôle admin
export const updateUserAdminStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    user.isAdmin = req.body.isAdmin;
    await user.save();

    res.json({ message: "Rôle mis à jour avec succès." });
  } catch (error) {
    console.error("Erreur updateAdminStatus :", error.message);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ➕ Création utilisateur par admin
export const createUserByAdmin = async (req, res) => {
  try {
    const { name, email, password, isAdmin, privileges } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Champs requis manquants." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(400).json({ message: "⛔ Email déjà utilisé." });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashed,
      isAdmin: !!isAdmin,
      privileges: Array.isArray(privileges) ? privileges : []
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      privileges: user.privileges
    });
  } catch (error) {
    console.error("Erreur création admin :", error.message);
    res.status(500).json({ message: "❌ Erreur lors de la création utilisateur." });
  }
};

// 🔁 Réinitialisation mot de passe
export const resetUserPassword = async (req, res) => {
  try {
    const { email, nouveauMotDePasse } = req.body;

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "❌ Utilisateur non trouvé." });
    }

    user.password = await bcrypt.hash(nouveauMotDePasse, 10);
    await user.save();

    res.status(200).json({ message: "🔐 Mot de passe réinitialisé avec succès." });
  } catch (error) {
    console.error("Erreur resetUserPassword :", error.message);
    res.status(500).json({ message: "Erreur serveur lors de la réinitialisation." });
  }
};

/// 🛠️ Mise à jour des privilèges d'un utilisateur (admin)
export const updateUserPrivileges = async (req, res) => {
  try {
    const { privileges } = req.body;

    if (!Array.isArray(privileges)) {
      return res.status(400).json({ message: "Les privilèges doivent être un tableau." });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    user.privileges = privileges;
    await user.save();

    res.status(200).json({
      message: "✅ Privilèges mis à jour avec succès.",
      privileges: user.privileges
    });
  } catch (error) {
    console.error("Erreur updateUserPrivileges :", error.message);
    res.status(500).json({ message: "Erreur serveur lors de la mise à jour des privilèges." });
  }
};
