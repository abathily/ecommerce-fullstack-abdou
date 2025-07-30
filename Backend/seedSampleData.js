const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// 🧩 Import des modèles
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order'); // uniquement si tu l’as
const Category = require('./models/Category'); // optionnel

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connecté à MongoDB");

    // 🔐 Création utilisateur admin
    const hashed = await bcrypt.hash('admin123', 10);
    await User.create({
      name: 'Admin Test',
      email: 'admin@example.com',
      password: hashed,
      isAdmin: true,
    });

    // 🛍️ Ajout de quelques produits
    await Product.insertMany([
      {
        name: 'Samsung Galaxy A14',
        brand: 'Samsung',
        category: 'Smartphones',
        subcategory: 'Android',
        price: 199,
        stock: 10,
        image: '',
        description: 'Smartphone économique avec bonnes performances',
      },
      {
        name: 'Shampoing Kerastase',
        brand: 'Kerastase',
        category: 'Produits capillaires',
        subcategory: 'Shampoing',
        price: 25,
        stock: 50,
        image: '',
        description: 'Shampoing nourrissant pour cheveux secs',
      },
    ]);

    // 📦 Ajout d’une commande (si tu veux)
    // await Order.create({ ... });

    console.log("🎉 Données seedées avec succès !");
  } catch (err) {
    console.error("❌ Erreur lors du seed :", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

seedDatabase();
