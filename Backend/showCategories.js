const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const categories = await Product.aggregate([
      {
        $group: {
          _id: { category: "$category", subcategory: "$subcategory" },
          count: { $sum: 1 }
        }
      }
    ]);
    console.log("Catégories et sous-catégories existantes :");
    console.table(categories);
    mongoose.disconnect();
  })
  .catch(err => console.error("Erreur de connexion MongoDB :", err));
