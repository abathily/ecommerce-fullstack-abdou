import express from 'express';
import Review from '../models/Review.js';

const router = express.Router();

/**
 * 📝 Ajouter un avis
 * Requiert : productId, name, rating, comment
 */
router.post('/', async (req, res) => {
  try {
    const { productId, name, rating, comment } = req.body;

    // Validation minimale des champs
    if (!productId || !name || !rating || !comment) {
      return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }

    const review = new Review({ productId, name, rating, comment });
    const saved = await review.save();

    res.status(201).json(saved);
  } catch (err) {
    console.error('❌ Erreur création avis :', err.message);
    res.status(500).json({ message: 'Erreur serveur lors de l’ajout de l’avis.' });
  }
});

/**
 * 📦 Récupérer les avis pour un produit
 * Paramètre : productId
 */
router.get('/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId }).sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (err) {
    console.error('❌ Erreur chargement avis :', err.message);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des avis.' });
  }
});

export default router;
