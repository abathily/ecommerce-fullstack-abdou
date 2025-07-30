const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config(); // charge .env pour MONGO_URI

const Product = require('../models/Product');

// Correction des mauvaises catégories
const corrections = {
  "Portable": { category: "Électroménager", subcategory: "Portable" },
  "Montre": { category: "Électroménager", subcategory: "Montre" },
  "Cuisinière": { category: "Électroménager", subcategory: "Cuisinière" },
  "Climatiseur": { category: "Électroménager", subcategory: "Climatiseur" },

  "Femme": { category: "Vêtements", subcategory: "Femme" },
  "Homme": { category: "Vêtements", subcategory: "Homme" },
  "Enfant": { category: "Vêtements", subcategory: "Enfant" },
  "Bébé": { category: "Vêtements", subcategory: "Bébé" },
  "Sport": { category: "Vêtements", subcategory: "Sport" },

  "Chaussure Femme": { category: "Chaussures", subcategory: "Femme" },
  "Chaussure Homme": { category: "Chaussures", subcategory: "Homme" },
  "Chaussure Bébé": { category: "Chaussures", subcategory: "Bébé" },
};

async function fixCategories() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connecté à MongoDB");

    const products = await Product.find();

    let updated = 0;

    for (const product of products) {
      const fix = corrections[product.category];
      if (fix) {
        product.category = fix.category;
        product.subcategory = fix.subcategory;
        await product.save();
        console.log(`🛠 Produit corrigé : ${product.name}`);
        updated++;
      }
    }

    console.log(`✅ ${updated} produits mis à jour.`);
    process.exit();
  } catch (err) {
    console.error("❌ Erreur de mise à jour :", err);
    process.exit(1);
  }
}

fixCategories();
