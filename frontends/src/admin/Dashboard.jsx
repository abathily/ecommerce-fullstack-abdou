import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';
import Stats from './Stats';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { CSVLink } from 'react-csv';
import jsPDF from 'jspdf';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { token, user, isLoading } = useAuth(); // 🔄 ajout isLoading
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return; // ⏳ attend que le contexte charge

    if (!token || !user) {
      navigate('/login');
      return;
    }

    if (!user.isAdmin) {
      setError("Accès refusé : réservé aux administrateurs.");
      return;
    }

    axios.get("http://localhost:5000/api/admin/stats", {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true
    }).then(res => setStats(res.data))
      .catch(() => setError("Statistiques non disponibles."));
  }, [token, user, isLoading, navigate]);

  const avatarMap = {
    admin: '/assets/avatar-admin.png',
    artisan: '/assets/avatar-artisan.png',
    livreur: '/assets/avatar-livreur.png',
    client: '/assets/avatar-client.png',
  };

  const csvData = stats
    ? [
        ['Label', 'Valeur'],
        ['Utilisateurs', stats.totalUsers],
        ['Produits', stats.totalProducts],
        ['Catégories', stats.totalCategories],
        ['Commandes', stats.totalOrders],
        ['Revenu (€)', stats.totalRevenue],
      ]
    : [];

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Statistiques du tableau de bord', 10, 10);
    let y = 20;
    csvData.slice(1).forEach(([label, value]) => {
      doc.text(`${label}: ${value}`, 10, y);
      y += 10;
    });
    doc.save('stats-dashboard.pdf');
  };

  const revenueData = {
    labels: stats?.monthlyOrders?.map(item => item.month) || [],
    datasets: [
      {
        label: 'Revenu (€)',
        data: stats?.monthlyOrders?.map(item => item.count * 1000) || [],
        backgroundColor: 'rgba(6,182,212,0.8)',
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <AdminSidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : ''} md:ml-64 p-6 md:p-8`}>
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden mb-4 px-3 py-2 bg-cyan-600 dark:bg-cyan-700 text-white rounded"
        >
          ☰ Menu
        </button>

        <h1 className="text-3xl font-bold mb-4">📊 Tableau de bord</h1>

        {user && (
          <div className="mb-6 flex items-center justify-between p-4 bg-cyan-100 dark:bg-cyan-800 rounded shadow">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Connecté en tant que</p>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {user.name} — <span className="italic">{user.role || 'Admin'}</span>
              </h2>
            </div>
            <img
              src={avatarMap[user?.role] || '/assets/avatar-default.png'}
              alt={`Avatar ${user?.role}`}
              className="w-12 h-12 rounded-full border-2 border-white shadow-md"
            />
          </div>
        )}

        {error && (
          <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-6">{error}</p>
        )}

        {stats && (
          <>
            <div className="flex gap-4 mb-8">
              <CSVLink
                data={csvData}
                filename="stats-dashboard.csv"
                className="px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700"
              >
                Export CSV
              </CSVLink>
              <button
                onClick={generatePDF}
                className="px-4 py-2 bg-red-600 text-white rounded shadow hover:bg-red-700"
              >
                Export PDF
              </button>
            </div>

            <Stats stats={stats} />

            <div className="p-6 bg-white dark:bg-gray-800 rounded shadow">
              <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">📈 Revenu mensuel</h2>
              <Bar data={revenueData} options={chartOptions} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
