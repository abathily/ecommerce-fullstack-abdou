// createAdmin.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js'; // adapte le chemin si nécessaire

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌ MONGO_URI manquant dans .env');
  process.exit(1);
}

async function createAdmin() {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log('✅ Connexion MongoDB réussie');

    const email = 'Admin@gmail.com';
    const password = 'Admin123@2025';
    const name = 'Admin';

    const existing = await User.findOne({ email });
    if (existing) {
      console.log('⚠️ Utilisateur déjà existant');
      return;
    }

    const admin = new User({
      name,
      email,
      password,
      isAdmin: true,
      role: 'admin',
      privileges: ['manage_users', 'manage_products'],
    });

    if (typeof admin.setPassword === 'function') {
      await admin.setPassword(password); // si tu utilises une méthode custom
    } else {
      admin.password = password; // sinon brut (à hasher plus tard)
    }

    await admin.save();
    console.log('✅ Utilisateur admin créé avec succès');
  } catch (err) {
    console.error('❌ Erreur création admin :', err?.message || err);
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();
