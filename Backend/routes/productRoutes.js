import express from 'express';
import multer from 'multer';
import {
  getAll,
  getOne,
  create,
  update,
  remove,
  deleteAllProducts,
  getDynamicCategories,
  addProductImages
} from '../controllers/productController.js';

const router = express.Router();

/** 🧰 Configuration multer pour upload local **/
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

/** 🟢 Routes publiques **/
router.get('/', getAll); // ← ❗ filtre actif ici
router.get('/categories/dynamic', getDynamicCategories);
router.get('/:id', getOne);

/** 🔐 Routes admin **/
router.post('/', create); // ← ajoute ton auth si besoin
router.put('/:id', update);
router.delete('/:id', remove);
router.delete('/delete-all', deleteAllProducts);

/** 🖼️ Ajout d’images via liens et fichiers **/
router.post('/:id/images', upload.array('images'), addProductImages);

export default router;
