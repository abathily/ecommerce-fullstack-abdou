// seedUser.js
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';

dotenv.config();

async function seedAdminUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connexion à MongoDB réussie');

    const existingAdmin = await User.findOne({ email: 'admin@kov.com' });
    if (existingAdmin) {
      console.log('⚠️ L\'utilisateur admin existe déjà');
      return process.exit(0);
    }

    const admin = new User({
      name: 'Admin',
      email: 'admin@kov.com',
      isAdmin: true,
      role: 'admin',
      privileges: ['manage-users', 'view-orders'], // adapte selon ton modèle
    });

    await admin.setPassword('Kov123@2025'); // méthode custom sur ton modèle User
    await admin.save();

    console.log('🎉 Utilisateur admin créé avec succès');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur de seed :', err);
    process.exit(1);
  }
}

seedAdminUser();
