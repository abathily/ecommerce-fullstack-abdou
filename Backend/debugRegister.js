import mongoose from 'mongoose';
import 'dotenv/config';
import User from './models/User.js';

const createAdminUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connexion MongoDB OK');

    const email = 'kov.admin@kov.com';
    const password = 'Kov123@2025';

    await User.deleteMany({ email });
    console.log('🧹 Ancien(s) utilisateur(s) supprimé(s)');

    const user = new User({
      name: 'Admin Kov',
      email,
      password, // Ne hash pas ici, laisse le hook gérer
      isAdmin: true,
      role: 'admin'
    });

    await user.save();
    console.log('✅ Admin enregistré :', user._id);
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur :', err.message);
    process.exit(1);
  }
};

createAdminUser();
