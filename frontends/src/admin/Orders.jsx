import { useEffect, useState } from 'react';
import axios from 'axios';
import AdminSidebar from './components/AdminSidebar';

const pageSize = 6;

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const token = localStorage.getItem('token');

  const fetchOrders = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Erreur récupération des commandes', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.put(
        `http://localhost:5000/api/orders/${id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchOrders();
    } catch (err) {
      console.error('Erreur mise à jour du statut', err);
    }
  };

  const exportToCSV = () => {
    const filtered = filter === 'All' ? orders : orders.filter((o) => o.status === filter);
    const rows = filtered.map((order) => ({
      Commande: order._id,
      Date: new Date(order.createdAt).toLocaleString(),
      Utilisateur: order.user?.email || 'Inconnu',
      Total: `${order.total} CFA`,
      Statut: order.status,
      Produits: order.products.map((p) => `${p.productId?.name} x${p.quantity}`).join(' | ')
    }));

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Commande,Date,Utilisateur,Total,Statut,Produits']
        .concat(rows.map((r) => Object.values(r).join(',')))
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'commandes.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusColors = {
    Pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-100',
    Confirmed: 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100',
    Shipped: 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-100',
    Cancelled: 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-100',
  };

  const filtered = filter === 'All' ? orders : orders.filter(o => o.status === filter);
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
      <AdminSidebar />

      <div className="ml-64 p-6 text-gray-800 dark:text-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <h1 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400">📦 Commandes Client</h1>

          <div className="flex items-center gap-3">
            <select
              value={filter}
              onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
              className="text-sm border rounded px-2 py-1 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
            >
              <option value="All">🧮 Toutes</option>
              <option value="Pending">⏳ En attente</option>
              <option value="Confirmed">✅ Confirmée</option>
              <option value="Shipped">🚚 Expédiée</option>
              <option value="Cancelled">❌ Annulée</option>
            </select>

            <button
              onClick={exportToCSV}
              className="text-sm px-3 py-1 bg-cyan-700 dark:bg-cyan-600 text-white rounded hover:bg-cyan-600"
            >
              ⬇️ Export CSV
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm">Chargement...</p>
        ) : paginated.length === 0 ? (
          <p className="text-sm">Aucune commande trouvée.</p>
        ) : (
          <>
            <div className="space-y-6">
              {paginated.map((order, idx) => (
                <div key={order._id || idx} className="border rounded p-4 bg-white dark:bg-gray-900 shadow-sm dark:border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-lg">Commande : {order._id}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(order.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 dark:text-gray-300">Utilisateur : {order.user?.email || 'Inconnu'}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Total : {order.total.toLocaleString()} CFA</p>

                  <ul className="mt-2 list-disc ml-5 text-sm text-gray-600 dark:text-gray-400">
                    {order.products.map((item, index) => (
                      <li key={item.productId?._id || index}>
                        {item.productId?.name} — x{item.quantity}
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        className="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                      >
                        <option value="Pending">⏳ En attente</option>
                        <option value="Confirmed">✅ Confirmée</option>
                        <option value="Shipped">🚚 Expédiée</option>
                        <option value="Cancelled">❌ Annulée</option>
                      </select>

                      <span className={`px-2 py-1 text-xs rounded ${statusColors[order.status]}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center gap-2 mt-8">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 rounded text-sm border ${
                    currentPage === i + 1
                      ? 'bg-cyan-700 text-white dark:bg-cyan-500'
                      : 'bg-white dark:bg-gray-800 dark:text-gray-100'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
