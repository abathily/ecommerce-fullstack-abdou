import { useEffect, useState } from 'react';
import axios from 'axios';
import AdminSidebar from './components/AdminSidebar';
import { useAuth } from '../context/AuthContext';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js';
import { CSVLink } from 'react-csv';
import jsPDF from 'jspdf';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

ChartJS.register(BarElement, CategoryScale, LinearScale);

export default function Stats() {
  const { token, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [status, setStatus] = useState('');
  const [statusOptions, setStatusOptions] = useState([]);

  const fetchStats = () => {
    if (!token || !user?.isAdmin) {
      setError("⛔ Accès refusé : Administrateur requis.");
      setLoading(false);
      return;
    }

    setLoading(true);
    const params = {};
    if (startDate) params.startDate = startDate.toISOString().split('T')[0];
    if (endDate) params.endDate = endDate.toISOString().split('T')[0];
    if (status) params.status = status;

    axios
      .get('https://backend-9qig.onrender.com/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      })
      .then((res) => {
        setStats(res.data);
        const keys = res.data.statusCount ? Object.keys(res.data.statusCount) : [];
        setStatusOptions(keys);
        setLoading(false);
      })
      .catch(() => {
        setError("❌ Impossible de charger les statistiques.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStats();
  }, [token, user]);

  const chartData = {
    labels: stats?.monthlyOrders?.map((m) => m.month) || [],
    datasets: [
      {
        label: 'Commandes par mois',
        data: stats?.monthlyOrders?.map((m) => m.count) || [],
        backgroundColor: '#06b6d4',
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
  };

  const csvData = stats
    ? [
        ['Label', 'Valeur'],
        ['Produits', stats.totals.products],
        ['Utilisateurs', stats.totals.users],
        ['Commandes', stats.totals.orders],
        ['Catégories', stats.totals.categories],
        ['Revenu actuel', stats.revenueNow],
        ['Revenu précédent', stats.revenuePrev],
        ['Croissance', `${stats.growthRate}%`],
        ['Panier moyen', `${stats.avgOrderValue} CFA`],
        ['Catégorie top', stats.topCategory],
      ]
    : [];

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Statistiques E-commerce', 10, 10);
    let y = 20;
    csvData.slice(1).forEach(([label, value]) => {
      doc.text(`${label}: ${value}`, 10, y);
      y += 10;
    });
    doc.save('stats-ecommerce.pdf');
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white">
      <AdminSidebar />
      <div className="flex-1 p-6">
        <h1 className="text-3xl font-bold text-cyan-700 dark:text-cyan-400 mb-6">
          📊 Statistiques E-commerce
        </h1>

        {/* 🎛️ Filtres */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Date début</label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              dateFormat="yyyy-MM-dd"
              className="px-3 py-2 border rounded w-full"
              placeholderText="Début"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date fin</label>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              dateFormat="yyyy-MM-dd"
              className="px-3 py-2 border rounded w-full"
              placeholderText="Fin"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Statut</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 border rounded w-full"
            >
              <option value="">-- Tous --</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-cyan-600 text-white rounded shadow hover:bg-cyan-700"
          >
            Filtrer
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-slate-600 dark:text-gray-400 animate-pulse">⏳ Chargement en cours...</p>
        ) : error ? (
          <p className="text-red-600 dark:text-red-400 font-semibold">{error}</p>
        ) : (
          <>
            {/* 📁 Export */}
            <div className="flex gap-4 mb-8">
              <CSVLink
                data={csvData}
                filename="stats-ecommerce.csv"
                className="px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700"
              >
                Export CSV
              </CSVLink>
              <button
                onClick={exportPDF}
                className="px-4 py-2 bg-red-600 text-white rounded shadow hover:bg-red-700"
              >
                Export PDF
              </button>
            </div>

            {/* 🔢 Statistiques principales */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
              <StatCard title="Produits" value={stats.totals.products} color="blue" />
              <StatCard title="Utilisateurs" value={stats.totals.users} color="green" />
              <StatCard title="Commandes" value={stats.totals.orders} color="yellow" />
              <StatCard title="Catégories" value={stats.totals.categories} color="purple" />
              <StatCard title="Revenu actuel" value={`${stats.revenueNow?.toLocaleString()} CFA`} color="red" />
            </div>

            {/* 📊 KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard title="📈 Croissance" value={`${stats.growthRate}%`} color="green" />
              <StatCard title="💳 Panier moyen" value={`${stats.avgOrderValue} CFA`} color="blue" />
              <StatCard title="🏆 Catégorie top" value={stats.topCategory} color="purple" />
            </div>

            {/* 📅 Graphique mensuel */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-8">
              <h2 className="text-xl font-semibold text-slate-700 dark:text-gray-100 mb-4">📆 Commandes mensuelles</h2>
              <Bar data={chartData} options={chartOptions} />
            </div>

            {/* 📦 Statuts */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
              <h2 className="text-xl font-semibold text-slate-700 dark:text-gray-100 mb-4">🕒 Statuts des commandes</h2>
              <ul className="text-sm space-y-2 text-slate-700 dark:text-gray-300">
                {stats?.statusCount &&
                  Object.entries(stats.statusCount).map(([status, count]) => (
                    <li key={status}>
                      ✅ <strong>{count}</strong> {status}
                    </li>

                  ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// 🧮 Carte statistique avec badge dynamique
function StatCard({ title, value, color }) {
  const styles = {
    blue: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    green: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    yellow: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    red: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    purple: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
  };

  const badge =
    typeof value === 'number'
      ? value >= 100000
        ? '💎 Premium'
        : value >= 1000
        ? '🔥 Elite'
        : value >= 100
        ? '⭐ Pro'
        : '🎯 Actif'
      : null;

  return (
    <div className={`p-4 rounded shadow font-semibold ${styles[color]}`}>
      <h3 className="text-sm uppercase tracking-wide flex justify-between items-center">
        {title}
        {badge && (
          <span className="text-xs bg-white dark:bg-gray-700 px-2 py-1 rounded-full">
            {badge}
          </span>
        )}
      </h3>
      <p className="text-2xl mt-2">{value}</p>
    </div>
  );
}
