// models/Category.js
import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  // Nom de la catégorie principale
  name: {
    type: String,
    required: [true, "Le nom de la catégorie est requis"],
    unique: true,
    trim: true,
    minlength: 2
  },

  // Sous-catégories associées
  subcategories: {
    type: [String],
    default: [],
    validate: {
      validator: function (arr) {
        return Array.isArray(arr);
      },
      message: "Les sous-catégories doivent être un tableau de chaînes"
    },
    set: (arr) =>
      [...new Set(arr.map(sub => sub.trim()).filter(Boolean))]
  }
}, {
  timestamps: true
});

const Category = mongoose.model("Category", categorySchema);

// Export par défaut (obligatoire pour pouvoir faire `import Category from ...`)
export default Category;
