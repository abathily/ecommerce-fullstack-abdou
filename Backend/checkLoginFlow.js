import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import User from './models/User.js';

const runLoginFlow = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connexion MongoDB OK');

    // 1️⃣ Suppression des entrées corrompues
    const deleted = await User.deleteMany({
      email: 'kov.admin@kov.com',
      password: { $in: [undefined, null, ''] }
    });
    console.log(`🧹 Documents corrompus supprimés : ${deleted.deletedCount}`);

    // 2️⃣ Nettoyage complet de l'email ciblé
    await User.deleteMany({ email: 'kov.admin@kov.com' });
    console.log('🧼 Tous les anciens utilisateurs supprimés');

    // 3️⃣ Création du nouvel admin
    const plainPassword = 'Kov123@';
    const hashed = await bcrypt.hash(plainPassword, 10);
    const user = new User({
      name: 'Admin Kov',
      email: 'kov.admin@kov.com',
      password: hashed,
      isAdmin: true,
      role: 'admin'
    });
    await user.save();
    console.log('✅ Nouvel admin enregistré');
    console.log('🔐 Hash enregistré :', hashed);

    // 4️⃣ Vérification de l'entrée en base
    const savedUser = await User.findOne({ email: 'kov.admin@kov.com' });
    console.log('🔍 Utilisateur sauvegardé :', savedUser);

    // 5️⃣ Test de login
    const testPassword = 'Kov123@';
    const match = await bcrypt.compare(testPassword, savedUser.password);
    console.log('🧪 bcrypt.compare():', match);

    if (match) {
      console.log('✅ Mot de passe reconnu ✔️');
    } else {
      console.log('❌ Mot de passe incorrect ❌');
    }

    process.exit(0);
  } catch (err) {
    console.error('💥 Erreur :', err.message);
    process.exit(1);
  }
};

runLoginFlow();
