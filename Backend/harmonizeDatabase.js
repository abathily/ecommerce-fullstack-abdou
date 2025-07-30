import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Product from "./models/Product.js";
import Category from "./models/Category.js";
import Order from "./models/Order.js";

const runCleanup = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    console.log("🔍 URI MongoDB détectée :", mongoUri);

    if (!mongoUri || typeof mongoUri !== "string") {
      throw new Error("URI MongoDB invalide ou non défini. Vérifiez le fichier .env.");
    }

    await mongoose.connect(mongoUri);
    console.log("✅ Connecté à MongoDB");

    const allProducts = await Product.find();
    const allOrders = await Order.find();
    const allCategories = await Category.find();

    const orderedProductIds = new Set();
    allOrders.forEach(order => {
      order.products.forEach(p => orderedProductIds.add(String(p.productId)));
    });

    let updated = 0;
    let deletedProducts = 0;

    for (const product of allProducts) {
      const idStr = String(product._id);
      if (orderedProductIds.has(idStr)) {
        product.stock += 10; // ↗ Augmente le stock
        await product.save();
        updated++;
      } else {
        await Product.findByIdAndDelete(product._id); // 🗑️ Supprime si non référencé
        deletedProducts++;
      }
    }

    const remainingProducts = await Product.find();
    const usedCategories = new Set(remainingProducts.map(p => p.category.trim()));
    const usedSubcategories = new Set(remainingProducts.map(p => p.subcategory.trim()));

    let updatedCategories = 0;
    let deletedCategories = 0;

    for (const category of allCategories) {
      const freshCategory = await Category.findById(category._id);
      if (!freshCategory) continue;

      const subcats = freshCategory.subcategories || [];
      const filteredSubcats = subcats.filter(sub =>
        usedSubcategories.has(sub.trim())
      );

      if (filteredSubcats.length !== subcats.length) {
        freshCategory.subcategories = [...new Set(filteredSubcats)];
        await freshCategory.save();
        updatedCategories++;
      }

      if (!usedCategories.has(freshCategory.name.trim())) {
        await Category.findByIdAndDelete(freshCategory._id);
        deletedCategories++;
      }
    }

    console.log(`✅ Produits mis à jour : ${updated}`);
    console.log(`🗑️ Produits supprimés : ${deletedProducts}`);
    console.log(`🧼 Catégories mises à jour : ${updatedCategories}`);
    console.log(`🗑️ Catégories supprimées : ${deletedCategories}`);
    console.log("🎯 Harmonisation terminée avec succès !");
    process.exit(0);
  } catch (err) {
    console.error("🚨 Erreur harmonisation :", err.stack || err.message);
    process.exit(1);
  }
};

runCleanup();
