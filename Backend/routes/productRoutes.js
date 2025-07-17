const express = require('express');
const {
  getAll,
  getOne,
  create,
  update,
  remove,
  deleteAllProducts
} = require('../controllers/productController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();
router.delete('/delete-all', deleteAllProducts);
router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', protect, create);
router.put('/:id', protect, update);
router.delete('/:id', protect, remove);


module.exports = router;
