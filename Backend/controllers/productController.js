import Product from '../models/Product.js';
import Category from '../models/Category.js';

/**  Créer un produit */
export const create = async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    const savedProduct = await newProduct.save();

    const { category, subcategory } = savedProduct;

    //  Mettre à jour les catégories dynamiquement
    if (category) {
      const existing = await Category.findOne({ name: category });

      if (existing) {
        const subs = new Set(existing.subcategories);
        if (subcategory) subs.add(subcategory);
        await Category.updateOne(
          { name: category },
          { $set: { subcategories: Array.from(subs) } }
        );
      } else {
        await Category.create({
          name: category,
          subcategories: subcategory ? [subcategory] : []
        });
      }
    }

    res.status(201).json(savedProduct);
  } catch (error) {
    console.error(' Erreur création produit :', error);
    res.status(500).json({ message: 'Erreur serveur lors de la création.' });
  }
};

/**  Récupérer tous les produits avec filtres dynamiques */
export const getAll = async (req, res) => {
  try {
    const { search, category, subcategory, priceOrder, brands } = req.query;
    const filter = {};

    //  Recherche par nom
    if (search?.trim()) {
      filter.name = { $regex: search.trim(), $options: 'i' };
    }

    //  Catégorie
    if (category && category !== 'Toutes') {
      filter.category = new RegExp(`^${category}$`, 'i');
    }

    //  Sous-catégorie
    if (subcategory && subcategory !== 'Toutes') {
      filter.subcategory = new RegExp(`^${subcategory}$`, 'i');
    }

    //  Marques
    if (brands) {
      const brandArray = brands
        .split(',')
        .map(b => b.trim())
        .filter(Boolean);
      if (brandArray.length > 0) {
        filter.brand = { $in: brandArray };
      }
    }

    //  Tri par prix
    const sort = {};
    if (priceOrder === 'asc') sort.price = 1;
    if (priceOrder === 'desc') sort.price = -1;

    const products = await Product.find(filter).sort(sort);
    res.status(200).json(products);
  } catch (error) {
    console.error(' Erreur récupération produits :', error);
    res.status(500).json({ message: 'Erreur serveur lors du chargement.' });
  }
};

/**  Filtrage simplifié par catégories */
export const getFiltered = async (req, res) => {
  try {
    const { category, subcategory } = req.query;
    const filter = {};

    if (category && category !== 'Toutes') {
      filter.category = new RegExp(`^${category}$`, 'i');
    }

    if (subcategory && subcategory !== 'Toutes') {
      filter.subcategory = new RegExp(`^${subcategory}$`, 'i');
    }

    const products = await Product.find(filter);
    res.status(200).json(products);
  } catch (error) {
    console.error(' Erreur filtrage produits :', error);
    res.status(500).json({ message: 'Erreur serveur lors du filtrage.' });
  }
};

/**  Obtenir un produit par ID */
export const getOne = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produit introuvable' });
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur lors de la récupération.' });
  }
};

/**  Mettre à jour un produit */
export const update = async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Produit introuvable' });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur lors de la mise à jour.' });
  }
};

/**  Supprimer un produit */
export const remove = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Produit introuvable' });
    res.status(200).json({ message: 'Produit supprimé.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur lors de la suppression.' });
  }
};

/**  Supprimer tous les produits */
export const deleteAllProducts = async (req, res) => {
  try {
    await Product.deleteMany({});
    res.status(200).json({ message: 'Tous les produits ont été supprimés.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur globale.' });
  }
};

/**  Obtenir les catégories dynamiques */
export const getDynamicCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur lors du chargement des catégories.' });
  }
};

export const addProductImages = async (req, res) => {
  try {
    const { id } = req.params;
    const { links } = req.body;

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ error: 'Produit introuvable' });

    const fileUrls = req.files.map(file => `/uploads/${file.filename}`);

    let externalLinks = [];
    try {
      externalLinks = JSON.parse(links); // Attend JSON.stringify([url1,url2])
    } catch {
      externalLinks = typeof links === 'string' ? [links] : [];
    }

    product.images = [...(product.images || []), ...externalLinks, ...fileUrls];
    await product.save();

    res.status(200).json(product);
  } catch (err) {
    console.error(' Erreur ajout images :', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};