import mongoose from 'mongoose';
import Product from './models/Product.js';
;
import Category from './models/Category.js';

const syncCategoriesFromProducts = async () => {
  try {
    console.log('🔄 Synchronisation des catégories en cours...');

    // 🔎 Récupère tous les produits
    const products = await Product.find({});

    // 🧠 Reconstructeur : { catégorie : Set(sousCat1, sousCat2, ...) }
    const map = new Map();

    for (const product of products) {
      const cat = product.category?.trim();
      const sub = product.subcategory?.trim();
      if (!cat || !sub) continue;

      if (!map.has(cat)) {
        map.set(cat, new Set());
      }
      map.get(cat).add(sub);
    }

    // 🧨 Supprime toutes les catégories existantes
    await Category.deleteMany({});

    // ➕ Reconstruit avec les vrais liens produits
    const insertOps = [];
    for (const [catName, subSet] of map.entries()) {
      insertOps.push({
        name: catName,
        subcategories: Array.from(subSet)
      });
    }

    if (insertOps.length) {
      await Category.insertMany(insertOps);
    }

    console.log(`✅ Catégories synchronisées depuis ${products.length} produits`);
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation des catégories :', error.message);
  }
};

export default syncCategoriesFromProducts;
