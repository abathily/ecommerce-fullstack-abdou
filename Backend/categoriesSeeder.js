// categoriesSeeder.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('./models/Category');

dotenv.config();

const categories = [
  {
    name: 'Électroménager',
    subcategories: ['Portable', 'Montre', 'Cuisinière', 'Climatiseur', 'Téléviseur', 'Congélateur']
  },
  {
    name: 'Vêtements',
    subcategories: ['Femme', 'Homme', 'Enfant', 'Bébé', 'Sport']
  },
  {
    name: 'Chaussures',
    subcategories: ['Femme', 'Homme', 'Enfant', 'Bébé', 'Sport']
  }
];

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(async () => {
    console.log('🟢 Connexion MongoDB établie.');
    await Category.deleteMany();
    await Category.insertMany(categories);
    console.log('✅ Catégories insérées avec succès.');
    process.exit();
  })
  .catch(err => {
    console.error('❌ Échec de connexion MongoDB :', err);
    process.exit(1);
  });
