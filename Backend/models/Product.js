import mongoose from "mongoose";
import Category from "./Category.js";

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Le nom du produit est requis"],
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  model: { type: String, default: "", trim: true },
  brand: { type: String, default: "", trim: true },
  images: { type: [String], default: [] },
  description: { type: String, default: "", trim: true },
  category: {
    type: String,
    required: [true, "La catégorie est requise"],
    trim: true
  },
  subcategory: {
    type: String,
    required: [true, "La sous-catégorie est requise"],
    trim: true
  },
  price: {
    type: Number,
    required: [true, "Le prix est requis"],
    min: 1
  },
  stock: { type: Number, required: true, default: 0, min: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 }
}, { timestamps: true });

productSchema.post("save", async function () {
  try {
    const categoryName = this.category.trim();
    const subcategoryName = this.subcategory.trim();

    let categoryDoc = await Category.findOne({ name: categoryName });

    if (!categoryDoc) {
      categoryDoc = new Category({ name: categoryName, subcategories: [subcategoryName] });
    } else {
      if (!categoryDoc.subcategories.includes(subcategoryName)) {
        categoryDoc.subcategories.push(subcategoryName);
      }

      categoryDoc.subcategories = [...new Set(
        categoryDoc.subcategories.map(sub => sub.trim()).filter(Boolean)
      )];
    }

    await categoryDoc.save();

    const categories = await Category.find();
    for (const cat of categories) {
      const productCount = await mongoose.model("Product").countDocuments({ category: cat.name });

      if (productCount === 0) {
        await Category.deleteOne({ _id: cat._id });
        continue;
      }

      const validSubcategories = await mongoose.model("Product").distinct("subcategory", { category: cat.name });
      cat.subcategories = cat.subcategories.filter(sub => validSubcategories.includes(sub));
      await cat.save();
    }

    console.log(`✅ Catégorie synchronisée : ${categoryName} → ${subcategoryName}`);
  } catch (err) {
    console.error("❌ Erreur de synchronisation :", err.message);
  }
});

const Product = mongoose.model("Product", productSchema);
export default Product;
