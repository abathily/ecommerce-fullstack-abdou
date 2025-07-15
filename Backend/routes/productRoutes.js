const express = require('express');
const {
  getAll,
  getOne,
  create,
  update,
  remove
} = require('../controllers/productController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();
router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', protect, create);
router.put('/:id', protect, update);
router.delete('/:id', protect, remove);

module.exports = router;
