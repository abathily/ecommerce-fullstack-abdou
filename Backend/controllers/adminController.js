import User from "../models/User.js";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Order from "../models/Order.js";

export const getAdminStats = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;

    // 🗓️ Date actuelle et précédente
    const now = new Date();
    const prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0);

    // 🔍 Filtres personnalisés
    const filterCurrent = {};
    if (startDate) filterCurrent.createdAt = { $gte: new Date(startDate) };
    if (endDate) {
      filterCurrent.createdAt = {
        ...filterCurrent.createdAt,
        $lte: new Date(endDate)
      };
    }
    if (status) filterCurrent.status = status;

    // 🔙 Filtres période précédente
    const filterPrev = {
      createdAt: {
        $gte: prevStartDate,
        $lte: prevEndDate
      }
    };

    // 📦 Récupération commandes
    const [currentOrders, previousOrders] = await Promise.all([
      Order.find(filterCurrent),
      Order.find(filterPrev)
    ]);

    // 📊 KPI généraux
    const [totalUsers, totalProducts, totalCategories, totalOrders] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Category.countDocuments(),
      Order.countDocuments()
    ]);

    const revenueNow = currentOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const revenuePrev = previousOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const growthRate = revenuePrev > 0 ? (((revenueNow - revenuePrev) / revenuePrev) * 100).toFixed(2) : null;
    const avgOrderValue = currentOrders.length ? (revenueNow / currentOrders.length).toFixed(2) : 0;

    // 📅 Stats mensuelles
    const monthlyMap = {};
    currentOrders.forEach(order => {
      const key = new Date(order.createdAt).toLocaleString("fr-FR", {
        month: "long",
        year: "numeric"
      });
      monthlyMap[key] = (monthlyMap[key] || 0) + 1;
    });
    const monthlyOrders = Object.entries(monthlyMap).map(([month, count]) => ({ month, count }));

    // 📦 Statuts
    const statusCount = {};
    currentOrders.forEach(o => {
      const state = o.status || "En attente";
      statusCount[state] = (statusCount[state] || 0) + 1;
    });

    // 🏆 Catégorie la plus vendue
    const categoryCount = {};
    for (const order of currentOrders) {
      for (const item of order.items || []) {
        const catId = item.category?.toString();
        if (catId) categoryCount[catId] = (categoryCount[catId] || 0) + item.quantity;
      }
    }

    // ⚙️ Récupération des noms de catégories
    const topCategoryId = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topCategory = topCategoryId ? await Category.findById(topCategoryId) : null;

    // ✅ Réponse finale
    res.status(200).json({
      totals: {
        users: totalUsers,
        products: totalProducts,
        categories: totalCategories,
        orders: totalOrders
      },
      filteredOrders: currentOrders.length,
      revenueNow,
      revenuePrev,
      growthRate,
      avgOrderValue,
      monthlyOrders,
      statusCount,
      topCategory: topCategory?.name || "Non déterminé",
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        status: status || null
      }
    });

  } catch (error) {
    console.error("❌ Erreur getAdminStats :", error.message);
    res.status(500).json({ message: "Erreur récupération statistiques avancées" });
  }
};
