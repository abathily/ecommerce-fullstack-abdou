const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config(); // charge le fichier .env

const Product = require('../models/Product'); // adapte si le chemin change

// Correspondance manuelle des produits vers sous-catégories
const updateLogic = (product) => {
  if (product.category === "Électroménager") {
    if (/iphone|samsung|tecno|infinix|itel|xiaomi/i.test(product.name)) return "Portable";
    if (/montre|watch/i.test(product.name)) return "Montre";
    if (/cuisini[eè]re|four/i.test(product.name)) return "Cuisinière";
    if (/climatiseur|split/i.test(product.name)) return "Climatiseur";
  }

  if (product.category === "Vêtements") {
    if (/femme/i.test(product.name)) return "Femme";
    if (/homme/i.test(product.name)) return "Homme";
    if (/enfant/i.test(product.name)) return "Enfant";
    if (/bébé|bebe/i.test(product.name)) return "Bébé";
    if (/sport/i.test(product.name)) return "Sport";
  }

  if (product.category === "Chaussures") {
    if (/femme/i.test(product.name)) return "Femme";
    if (/homme/i.test(product.name)) return "Homme";
    if (/enfant/i.test(product.name)) return "Enfant";
    if (/bébé|bebe/i.test(product.name)) return "Bébé";
    if (/sport/i.test(product.name)) return "Sport";
  }

  return null;
};

const updateProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connexion à MongoDB réussie");

    const products = await Product.find();
    let updatedCount = 0;

    for (const product of products) {
      const newSub = updateLogic(product);
      if (newSub && product.subcategory !== newSub) {
        product.subcategory = newSub;
        await product.save();
        console.log(`🔁 Mis à jour : ${product.name} → ${newSub}`);
        updatedCount++;
      }
    }

    console.log(`✅ ${updatedCount} produits mis à jour.`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Erreur :", err);
    process.exit(1);
  }
};

updateProducts();
