const express = require('express');
const { placeOrder, getMyOrders } = require('../controllers/orderController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();
router.post('/', protect, placeOrder);
router.get('/my-orders', protect, getMyOrders);


module.exports = router;
