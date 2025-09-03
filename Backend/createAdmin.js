const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // adapte selon ton arborescence
require('dotenv').config(); // si tu utilises .env pour MONGO_URI

async function createAdmin() {
  try {
    //  Connexion à la base
    await mongoose.connect(process.env.MONGO_URI);
    console.log(" Connexion MongoDB réussie");

    const existing = await User.findOne({ email: 'admin@example.com' });
    if (existing) {
      console.log(" Un utilisateur admin existe déjà");
      return;
    }

    //  Hash du mot de passe
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // 👤 Création du compte admin
    const admin = new User({
      name: 'Super Admin',
      email: 'admin@example.com',
      password: hashedPassword,
      isAdmin: true
    });

    await admin.save();
    console.log(" Compte admin créé avec succès !");
  } catch (error) {
    console.error(" Erreur création admin :", error.message);
  } finally {
    mongoose.disconnect();
  }
}

createAdmin();
