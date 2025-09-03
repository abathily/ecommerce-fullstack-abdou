import Category from '../models/Category.js';

/**  Lire toutes les catégories **/
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();

    if (!Array.isArray(categories) || categories.length === 0) {
      return res.status(404).json({ message: 'Aucune catégorie disponible.' });
    }

    const cleanedCategories = categories.map(cat => ({
      _id: cat._id,
      name: cat.name,
      subcategories: Array.isArray(cat.subcategories)
        ? [...new Set(cat.subcategories.map(sub => sub.trim()).filter(Boolean))]
        : []
    }));

    res.json(cleanedCategories);
  } catch (error) {
    console.error(' Erreur récupération catégories :', error);
    res.status(500).json({ message: 'Erreur serveur lors du chargement des catégories.' });
  }
};

/**  Créer une nouvelle catégorie **/
export const createCategory = async (req, res) => {
  try {
    const { name, subcategories } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ message: 'Le nom de la catégorie est requis.' });
    }

    const exists = await Category.findOne({ name: name.trim() });
    if (exists) {
      return res.status(409).json({ message: 'Cette catégorie existe déjà.' });
    }

    const cleanedSubs = Array.isArray(subcategories)
      ? [...new Set(subcategories.map(sub => sub.trim()).filter(Boolean))]
      : [];

    const category = await Category.create({
      name: name.trim(),
      subcategories: cleanedSubs
    });

    res.status(201).json(category);
  } catch (error) {
    console.error(' Erreur création catégorie :', error);
    res.status(500).json({ message: 'Erreur serveur lors de la création.' });
  }
};

/**  Modifier une catégorie **/
export const updateCategory = async (req, res) => {
  try {
    const { name, subcategories } = req.body;

    const updatedFields = {};
    if (name) updatedFields.name = name.trim();
    if (Array.isArray(subcategories)) {
      updatedFields.subcategories = [...new Set(subcategories.map(sub => sub.trim()).filter(Boolean))];
    }

    const category = await Category.findByIdAndUpdate(req.params.id, updatedFields, { new: true });

    if (!category) {
      return res.status(404).json({ message: 'Catégorie non trouvée.' });
    }

    res.json(category);
  } catch (error) {
    console.error(' Erreur mise à jour catégorie :', error);
    res.status(500).json({ message: 'Erreur serveur lors de la mise à jour.' });
  }
};

/**  Supprimer une catégorie **/
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Catégorie non trouvée.' });
    }

    res.json({ message: ` Catégorie '${category.name}' supprimée.` });
  } catch (error) {
    console.error(' Erreur suppression catégorie :', error);
    res.status(500).json({ message: 'Erreur serveur lors de la suppression.' });
  }
};
