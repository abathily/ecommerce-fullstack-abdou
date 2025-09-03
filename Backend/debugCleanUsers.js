import mongoose from 'mongoose';
import 'dotenv/config';
import User from './models/User.js';

const cleanCorruptedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connexion MongoDB OK');

    const res = await User.deleteMany({
      email: 'kov.admin@kov.com',
      password: { $in: [undefined, null, ''] }
    });

    console.log(`🧹 Documents supprimés : ${res.deletedCount}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur cleanCorruptedUsers :', err.message);
    process.exit(1);
  }
};

cleanCorruptedUsers();
