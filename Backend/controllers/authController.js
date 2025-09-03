import User from "../models/User.js";
import jwt from "jsonwebtoken";

//  Génère un token JWT sécurisé
function generateToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, isAdmin: user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: "48h" }
  );
}

//  Enregistrement d’un nouvel utilisateur
export async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return res.status(400).json({ message: "Tous les champs sont requis" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: password.trim() // le hash sera fait dans le modèle
    });

    const token = generateToken(user);
    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin || false
      }
    });
  } catch (err) {
    console.error("Erreur inscription :", err);
    return res.status(500).json({ message: "Erreur serveur lors de l’inscription" });
  }
}

//  Connexion d’un utilisateur existant
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    console.log("Tentative de login :", email);

    if (!email?.trim() || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");
    if (!user) {
      console.warn("Email non trouvé :", normalizedEmail);
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    const match = await user.validatePassword(password);
    if (!match) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    const token = generateToken(user);
    const { passwordHash, ...safeUser } = user.toObject();

    return res.json({ token, user: safeUser });
  } catch (err) {
    console.error("Erreur connexion :", err);
    return res.status(500).json({ message: "Erreur serveur lors de la connexion" });
  }
}

//  Liste des utilisateurs
export async function getAllUsers(req, res) {
  try {
    const users = await User.find().select("-passwordHash");
    return res.json(users);
  } catch (error) {
    console.error("Erreur getAllUsers :", error);
    return res.status(500).json({ message: "Erreur serveur lors du listing utilisateurs" });
  }
}

//  Route de debug : tester un mot de passe
export async function testLoginDebug(req, res) {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis pour test" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé pour debug" });
    }

    const match = await user.validatePassword(password);

    return res.json({
      debug: true,
      email: normalizedEmail,
      motDePasseRecu: password,
      hashEnBase: user.passwordHash,
      correspondance: match
    });
  } catch (error) {
    console.error("Erreur testLoginDebug :", error);
    return res.status(500).json({ message: "Erreur serveur debug" });
  }
}
