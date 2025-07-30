const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');

exports.getAdminStats = async (req, res) => {
  try {
    // 📊 Totaux globaux
    const [totalUsers, totalProducts, totalCategories, totalOrders] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Category.countDocuments(),
      Order.countDocuments()
    ]);

    // 💰 Revenu total
    const orders = await Order.find();
    const totalRevenue = orders.reduce((acc, o) => acc + (o.total || 0), 0);

    // 📅 Statistiques mensuelles
    const monthlyMap = {};
    for (let order of orders) {
      const date = new Date(order.createdAt);
      const month = date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
      monthlyMap[month] = (monthlyMap[month] || 0) + 1;
    }

    const monthlyOrders = Object.entries(monthlyMap).map(([month, count]) => ({ month, count }));

    // 📦 Répartition des statuts
    const statusCount = {};
    for (let order of orders) {
      const status = order.status || 'En attente';
      statusCount[status] = (statusCount[status] || 0) + 1;
    }

    // ✅ Réponse JSON pour le frontend
    res.json({
      totals: {
        users: totalUsers,
        products: totalProducts,
        categories: totalCategories,
        orders: totalOrders,
        revenue: totalRevenue
      },
      monthlyOrders,
      statusCount
    });

  } catch (error) {
    console.error('❌ Erreur getAdminStats :', error.message);
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
  }
};
