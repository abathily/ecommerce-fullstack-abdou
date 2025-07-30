const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('./models/Category'); // vérifie le chemin exact

dotenv.config();
mongoose.connect(process.env.MONGO_URI);

const seed = async () => {
  await Category.deleteMany();

  await Category.insertMany([
    { name: 'Téléphones', subcategories: ['Apple', 'Samsung', 'Xiaomi'] },
    { name: 'Cheveux', subcategories: ['Shampooing', 'Coloration'] },
    { name: 'Médicaments', subcategories: ['Douleur', 'Fièvre'] },
    { name: 'Accessoires', subcategories: ['Montres', 'Lunettes'] },
  ]);

  console.log('✅ Catégories insérées avec succès');
  process.exit();
};

seed();
