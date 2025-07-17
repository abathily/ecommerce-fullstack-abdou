const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  model:String,
  brand:String,
  image: String,
  description: String,
  category: String,
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
