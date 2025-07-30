import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// 🔐 Génère un token JWT sécurisé
function generateToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, isAdmin: user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: "48h" }
  );
}

// ✅ Enregistrement d’un nouvel utilisateur
export async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Tous les champs sont requis" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword
    });

    const token = generateToken(user);
    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (err) {
    console.error("❌ Erreur inscription :", err.message);
    return res.status(500).json({ message: "Erreur serveur lors de l’inscription" });
  }
}

// ✅ Connexion d’un utilisateur existant
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    console.log("🔐 Tentative de login pour :", email);

    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.warn("🚫 Email non trouvé :", normalizedEmail);
      return res.status(400).json({ message: "Utilisateur non trouvé" });
    }

    const match = await bcrypt.compare(password.trim(), user.password);
    console.log("🔍 bcrypt.compare →", match);

    if (!match) {
      return res.status(401).json({ message: "Mot de passe incorrect" });
    }

    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    const token = generateToken(user);
    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (err) {
    console.error("❌ Erreur connexion :", err.message);
    return res.status(500).json({ message: "Erreur serveur lors de la connexion" });
  }
}

// ✅ Liste des utilisateurs (admin uniquement)
export async function getAllUsers(req, res) {
  try {
    const users = await User.find().select("-password");
    return res.json(users);
  } catch (error) {
    console.error("❌ Erreur getAllUsers :", error.message);
    return res.status(500).json({ message: "Erreur serveur lors du listing utilisateurs" });
  }
}

// ✅ Route de debug dynamique pour bcrypt (tester mot de passe envoyé)
export async function testLoginDebug(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis pour test" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const match = await bcrypt.compare(password.trim(), user.password);
    return res.json({
      email: user.email,
      motDePasseRecu: password,
      motDePasseTrim: password.trim(),
      hash: user.password,
      correspondance: match
    });
  } catch (error) {
    console.error("❌ Erreur testLoginDebug :", error.message);
    return res.status(500).json({ message: "Erreur serveur debug" });
  }
}
