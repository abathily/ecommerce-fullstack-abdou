require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function createAdminUser() {
  await mongoose.connect(process.env.MONGO_URI);
  const hashed = await bcrypt.hash('123456', 10);

  const user = await User.create({
    name: 'kov',
    email: 'kov@yopmail.com',
    password: hashed,
    isAdmin: true
  });

  console.log('✅ Utilisateur admin créé :', user);
  mongoose.disconnect();
}

createAdminUser();
