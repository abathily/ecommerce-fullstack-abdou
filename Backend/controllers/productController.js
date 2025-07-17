const Product = require('../models/Product');

exports.getAll = async (req, res) => {
  const products = await Product.find();
  res.json(products);
};

exports.getOne = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Produit non trouvé' });
  res.json(product);
};

exports.create = async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
};

exports.update = async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(product);
};

exports.remove = async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: 'Produit supprimé' });
};

// exports.deleteAll = async (req, res) => {
//   await Product.deleteMany({});
//   res.json({ message: "Tous les produits ont été supprimés." });
// };

exports.deleteAllProducts = async (req, res) => {
  try {
    await Product.deleteMany({});
    res.json({ message: "Tous les produits ont été supprimés." });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression", error });
  }
};