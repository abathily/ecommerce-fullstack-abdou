const mongoose = require('mongoose');
const Product = require('./models/Product');
const Category = require('./models/Category');

// Connecte-toi à ta base MongoDB
mongoose.connect('mongodb://localhost:27017/tonNomDeBDD')
  .then(async () => {
    console.log('Connexion établie ✔');

    const products = await Product.find();
    const categoryMap = {};

    products.forEach(product => {
      const { category, subcategory } = product;
      if (!categoryMap[category]) categoryMap[category] = new Set();
      if (subcategory) categoryMap[category].add(subcategory);
    });

    const bulkOps = Object.entries(categoryMap).map(([name, subSet]) => ({
      updateOne: {
        filter: { name },
        update: { $set: { subcategories: Array.from(subSet) } },
        upsert: true
      }
    }));

    await Category.bulkWrite(bulkOps);
    console.log('Catégories générées ✅');
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Erreur de connexion ❌', err);
  });
