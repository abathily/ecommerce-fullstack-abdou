import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function BoutiqueDropdown() {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('https://backend-9qig.onrender.com/api/categories');
        const data = res.data;

        if (Array.isArray(data)) {
          setCategories(data);
        } else {
          throw new Error('Format de données inattendu');
        }
      } catch (err) {
        console.error('❌ Erreur de chargement des catégories :', err.message);
        setError('Erreur de chargement des catégories.');
      }
    };

    fetchCategories();

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubcategoryClick = (categoryName, subName) => {
    navigate(`/products?category=${encodeURIComponent(categoryName)}&subcategory=${encodeURIComponent(subName)}`);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer text-gray-300 hover:text-white dark:text-gray-400 dark:hover:text-white px-3 py-2 font-medium"
      >
        Boutique
      </button>

      {isOpen && (
        <div
          className="absolute left-0 top-full mt-2 w-72 bg-white dark:bg-gray-900 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 
          z-50 overflow-y-auto max-h-96 transition duration-300 animate-fadeIn"
        >
          {error ? (
            <p className="p-4 text-red-600 dark:text-red-400">{error}</p>
          ) : categories.length === 0 ? (
            <p className="p-4 text-gray-500 dark:text-gray-400">Aucune catégorie trouvée.</p>
          ) : (
            categories.map((cat) => (
              <div key={cat._id || cat.name} className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <p className="font-semibold text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                  {cat.name || 'Catégorie sans nom'}
                </p>

                <div className="ml-2 mt-1 space-y-1">
                  {Array.isArray(cat.subcategories) && cat.subcategories.length > 0 ? (
                    cat.subcategories.map((sub, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSubcategoryClick(cat.name, sub)}
                        className="block text-left w-full text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        {sub}
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 italic">Pas de sous-catégorie.</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
