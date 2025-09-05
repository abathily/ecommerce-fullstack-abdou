import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function Sidebar({ filters, setFilters }) {
  const [visible, setVisible] = useState(false);
  const sidebarRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/products/categories/dynamic');
        setCategories(res.data);
      } catch (err) {
        console.error('Erreur chargement catégories :', err.message);
        setError('Impossible de charger les catégories.');
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      ...(key === 'category' && { subcategory: '' }) // reset si catégorie change
    }));
    setVisible(false);
  };

  const toggleBrand = (brand) => {
    const updated = filters.brands.includes(brand)
      ? filters.brands.filter(b => b !== brand)
      : [...filters.brands, brand];
    setFilters(prev => ({ ...prev, brands: updated }));
    setVisible(false);
  };

  const resetAll = () => {
    setFilters({
      search: '',
      category: '',
      subcategory: '',
      priceOrder: '',
      brands: [],
    });
    setVisible(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (visible && sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [visible]);

  const subcategories = categories.find(cat => cat.name === filters.category)?.subcategories || [];

  return (
    <>
      <button
        onClick={() => setVisible(true)}
        className="sm:hidden fixed top-6 left-4 z-50 bg-cyan-600 text-white px-4 py-2 rounded-md shadow-md"
      >
        🧰 Filtres
      </button>

      <aside
        ref={sidebarRef}
        className={`bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 px-6 py-8 border-r border-gray-200 dark:border-gray-700 shadow w-[18rem] overflow-y-auto transition-transform duration-300
          sm:sticky sm:top-10 sm:h-fit sm:max-h-[calc(100vh-6rem)] sm:block sm:w-[20rem] sm:translate-x-0
          ${visible ? 'fixed top-0 left-0 h-full translate-x-0 z-40' : 'fixed top-0 left-0 h-full -translate-x-full z-40'}
        `}
      >
        <div className="sm:hidden flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-cyan-700 dark:text-cyan-400">🔎 Filtres</h2>
          <button
            onClick={() => setVisible(false)}
            className="text-gray-500 dark:text-gray-300 hover:text-red-600 text-xl"
          >
            ✕
          </button>
        </div>

        <h2 className="hidden sm:block text-xl font-bold text-cyan-700 dark:text-cyan-400 mb-4">🔎 Filtres produits</h2>

        {/* Recherche */}
        <div className="mb-6">
          <label className="text-sm font-medium block mb-2">Nom du produit</label>
          <input
            type="text"
            placeholder="Rechercher..."
            value={filters.search}
            onChange={(e) => handleChange('search', e.target.value)}
            className="w-full p-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
          />
        </div>

        {/* Catégories */}
        <div className="mb-6">
          <label className="text-sm font-medium block mb-2">Catégorie</label>
          <select
            value={filters.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className="w-full p-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
          >
            <option value="">Toutes</option>
            {categories.map((cat) => (
              <option key={cat.name} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Sous-catégories */}
        <div className="mb-6">
          <label className="text-sm font-medium block mb-2">Sous-catégorie</label>
          <select
            value={filters.subcategory}
            onChange={(e) => handleChange('subcategory', e.target.value)}
            className="w-full p-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
          >
            <option value="">Toutes</option>
            {subcategories.map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>

        {/* Tri prix */}
        <div className="mb-6">
          <label className="text-sm font-medium block mb-2">Prix</label>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleChange('priceOrder', 'asc')}
              className={`px-4 py-2 rounded text-sm border ${
                filters.priceOrder === 'asc'
                  ? 'bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-300'
                  : 'bg-gray-100 dark:bg-gray-800 dark:text-gray-200'
              }`}
            >
              ⬆️ Croissant
            </button>
            <button
              onClick={() => handleChange('priceOrder', 'desc')}
              className={`px-4 py-2 rounded text-sm border ${
                filters.priceOrder === 'desc'
                  ? 'bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-300'
                  : 'bg-gray-100 dark:bg-gray-800 dark:text-gray-200'
              }`}
            >
              ⬇️ Décroissant
            </button>
          </div>
        </div>

        {/* Marques */}
        <div className="mb-6">
          <label className="text-sm font-medium block mb-2">Marques</label>
          <div className="space-y-2">
            {['Samsung', 'Apple', 'Sony', 'Kerastase', 'L’Oréal'].map((brand) => (
              <label key={brand} className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={filters.brands.includes(brand)}
                  onChange={() => toggleBrand(brand)}
                  className="mr-2 accent-cyan-600"
                />
                {brand}
              </label>
            ))}
          </div>
        </div>

        {/* Réinitialiser */}
        <button
          onClick={resetAll}
          className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 py-2 rounded-md font-medium text-sm mt-4 text-gray-700 dark:text-gray-200"
        >
          🔄 Réinitialiser les filtres
        </button>
      </aside>
    </>
  );
}
