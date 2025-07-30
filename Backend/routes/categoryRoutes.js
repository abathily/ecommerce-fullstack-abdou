import express from 'express';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController.js';

import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

/** 🟢 Route publique **/
router.get('/', getAllCategories);

/** 🔐 Routes sécurisées pour admin uniquement **/
router.post('/', protect, adminOnly, createCategory);
router.put('/:id', protect, adminOnly, updateCategory);
router.delete('/:id', protect, adminOnly, deleteCategory);

export default router;
