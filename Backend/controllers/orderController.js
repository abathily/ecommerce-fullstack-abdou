const Order = require('../models/Order');

exports.placeOrder = async (req, res) => {
  const { products, total } = req.body;
  const order = await Order.create({
    user: req.user.id,
    products,
    total
  });
  res.status(201).json(order);
};

exports.getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).populate('products.productId');
  res.json(orders);
};
