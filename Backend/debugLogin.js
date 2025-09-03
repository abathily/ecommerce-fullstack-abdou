import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import 'dotenv/config'; // Pour charger les variables .env
import User from './models/User.js';

// 🧪 Testeur de connexion
const testLogin = async () => {
  try {
    const email = 'kov.admin@kov.com';
    const password = 'Kov123@2025'; // Mot de passe que tu veux tester

    // 🔌 Connexion à la base
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connexion MongoDB établie');

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      process.exit(1);
    }

    console.log('🔍 Mot de passe en base (hash) :', user.password);
    const match = await bcrypt.compare(password, user.password);
    console.log('🔐 Comparaison bcrypt :', match);

    if (match) {
      console.log('✅ Le mot de passe correspond');
    } else {
      console.log('❌ Mot de passe incorrect');
    }

    process.exit(0);
  } catch (error) {
    console.error('🚨 Erreur :', error.message);
    process.exit(1);
  }
};

testLogin();
