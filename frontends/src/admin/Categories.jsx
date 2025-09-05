import { useEffect, useState } from 'react';
import { useAuth} from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminSidebar from './components/AdminSidebar';

const pageSize = 5;

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [subcategories, setSubcategories] = useState(['']);
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const token = localStorage.getItem('token');
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && (!token || !user)) {
      navigate('/login');
    }
  }, [isLoading, token, user]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const filtered = categories.filter(cat =>
      cat.name.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredCategories(filtered);
    setCurrentPage(1);
  }, [search, categories]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/categories');
      setCategories(res.data);
      setFilteredCategories(res.data);
    } catch (err) {
      console.error('Erreur récupération catégories', err);
    }
  };

  const handleAddSubcategory = () => {
    setSubcategories([...subcategories, '']);
  };

  const handleSubcategoryChange = (i, value) => {
    const updated = [...subcategories];
    updated[i] = value;
    setSubcategories(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return alert("⛔ Nom requis");

    const payload = { name, subcategories };
    const endpoint = editingId
      ? `http://localhost:5000/api/categories/${editingId}`
      : 'http://localhost:5000/api/categories';
    const method = editingId ? axios.put : axios.post;

    try {
      await method(endpoint, payload, { headers: { Authorization: `Bearer ${token}` } });
      resetForm();
      fetchCategories();
    } catch (err) {
      console.error('Erreur sauvegarde catégorie', err);
    }
  };

  const handleEdit = (cat) => {
    setName(cat.name);
    setSubcategories(cat.subcategories.length ? cat.subcategories : ['']);
    setEditingId(cat._id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('⚠️ Supprimer cette catégorie ?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCategories();
    } catch (err) {
      console.error('Erreur suppression catégorie', err);
    }
  };

  const resetForm = () => {
    setName('');
    setSubcategories(['']);
    setEditingId(null);
  };

  const getBadge = (count) => {
    if (count >= 6) return '🔥 Complexe';
    if (count >= 3) return '⚡ Intermédiaire';
    return '🎯 Basique';
  };

  const totalPages = Math.ceil(filteredCategories.length / pageSize);
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-800 dark:text-gray-100">
      <AdminSidebar />
      <div className="ml-64 p-6 overflow-auto transition-all">
        <h1 className="text-3xl font-bold mb-6 text-cyan-700 dark:text-cyan-400">📂 Gérer les Catégories</h1>

        <form onSubmit={handleSubmit}
          className="space-y-4 mb-8 bg-white dark:bg-gray-800 p-6 rounded shadow border dark:border-gray-700">
          <input
            type="text"
            placeholder="Nom de la catégorie"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />

          <h2 className="font-semibold text-slate-700 dark:text-gray-300">Sous-catégories</h2>
          {subcategories.map((sub, i) => (
            <input
              key={i}
              type="text"
              placeholder={`Sous-catégorie ${i + 1}`}
              value={sub}
              onChange={(e) => handleSubcategoryChange(i, e.target.value)}
              className="w-full p-2 border rounded mb-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          ))}

          <button type="button"
            onClick={handleAddSubcategory}
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
            ➕ Ajouter une sous-catégorie
          </button>

          <div className="flex gap-4 mt-4">
            <button type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow">
              {editingId ? 'Mettre à jour' : 'Créer'}
            </button>
            {editingId && (
              <button type="button"
                onClick={resetForm}
                className="text-gray-600 dark:text-gray-300 hover:underline">
                Annuler
              </button>
            )}
          </div>
        </form>

        <input type="text"
          placeholder="🔎 Rechercher une catégorie..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-2 mb-4 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />

        <ul className="space-y-4">
          {paginatedCategories.map((cat) => (
            <li key={cat._id}
              className="bg-gray-100 dark:bg-gray-800 p-4 rounded shadow border dark:border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-gray-100">
                    {cat.name}
                    <span className="ml-2 text-xs px-2 py-1 bg-cyan-200 dark:bg-cyan-700 rounded-full">
                      {getBadge(cat.subcategories.length)}
                    </span>
                  </h3>
                  <ul className="list-disc ml-5 mt-2 text-sm text-slate-600 dark:text-gray-300">
                    {cat.subcategories.map((sub, i) => (
                      <li key={i}>{sub}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col gap-2">
                  <button onClick={() => handleEdit(cat)}
                    className="bg-yellow-500 px-3 py-1 rounded text-white hover:bg-yellow-600">
                    Modifier
                  </button>
                  <button onClick={() => handleDelete(cat._id)}
                    className="bg-red-600 px-3 py-1 rounded text-white hover:bg-red-700">
                    Supprimer
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex justify-center gap-2 mt-6">
          {[...Array(totalPages)].map((_, i) => (
            <button key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded text-sm border ${
                currentPage === i + 1
                  ? 'bg-cyan-700 text-white dark:bg-cyan-500'
                  : 'bg-white dark:bg-gray-800 dark:text-gray-100'
              }`}>
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
