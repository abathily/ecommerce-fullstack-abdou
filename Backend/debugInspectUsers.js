import mongoose from 'mongoose';
import 'dotenv/config';
import User from './models/User.js';

const inspectUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connexion MongoDB établie');

    const emailToInspect = 'kov.admin@kov.com';
    const users = await User.find({ email: emailToInspect });

    console.log(`🔎 Utilisateurs trouvés avec l'email ${emailToInspect} :`);
    users.forEach((user, index) => {
      console.log(`\n🧾 Utilisateur ${index + 1} :`);
      console.log(`🆔 _id : ${user._id}`);
      console.log(`👤 name : ${user.name}`);
      console.log(`🔐 password : ${user.password}`);
      console.log(`🛡️ isAdmin : ${user.isAdmin}`);
      console.log(`📃 role : ${user.role}`);
      console.log(`📆 createdAt : ${user.createdAt}`);
    });

    console.log(`\n📦 Total : ${users.length}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur inspectUsers :', err.message);
    process.exit(1);
  }
};

inspectUsers();
