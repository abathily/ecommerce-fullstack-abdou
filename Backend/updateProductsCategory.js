// updateProductsCategory.js
const mongoose = require('mongoose');
const Product = require('./models/Product'); // Assure-toi que le chemin est correct
require('dotenv').config(); // charge ton fichier .env

async function updateCategory() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    const result = await Product.updateMany(
      { category: 'Smartphone premium' },
      {
        $set: {
          category: 'Électroménager',
          subcategory: 'Portable'
        }
      }
    );

    console.log(`✅ ${result.modifiedCount} produits mis à jour`);
    process.exit();
  } catch (err) {
    console.error('❌ Erreur lors de la mise à jour', err);
    process.exit(1);
  }
}

updateCategory();
