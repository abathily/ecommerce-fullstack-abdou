import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import ProductCard from '../components/ProductCard';

export default function ProductList() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    search: '',
    category: '',
    subcategory: '',
    priceOrder: '',
    brands: [],
  });

  // 🧭 Synchronisation URL → filtres
  useEffect(() => {
    const cat = decodeURIComponent(searchParams.get('category') || '');
    const sub = decodeURIComponent(searchParams.get('subcategory') || '');
    setFilters(prev => ({ ...prev, category: cat, subcategory: sub }));
  }, [searchParams]);

  // 🚀 Requête filtrée backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const params = {
          ...(filters.search && { search: filters.search }),
          ...(filters.category && { category: filters.category }),
          ...(filters.subcategory && { subcategory: filters.subcategory }),
          ...(filters.priceOrder && { priceOrder: filters.priceOrder }),
          ...(filters.brands.length && { brands: filters.brands.join(',') }),
        };

        const { data } = await axios.get('http://localhost:5000/api/products', { params });
        setProducts(data);
      } catch (error) {
        console.error('❌ Erreur chargement produits :', error.message);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [filters]);

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 min-h-screen">
      <div className="flex">
        {/* 🧭 Sidebar */}
        <aside className="w-[20rem] flex-shrink-0 sm:sticky sm:top-24 h-fit max-h-[calc(100vh-6rem)] overflow-hidden bg-gray-100 dark:bg-gray-800">
          <Sidebar filters={filters} setFilters={setFilters} />
        </aside>

        {/* 🎨 Produits */}
        <main className="flex-1 px-6 py-10 space-y-8">
          <h1 className="text-3xl font-bold text-cyan-700 dark:text-cyan-400">🛍️ Produits en boutique</h1>

          {loading ? (
            <p className="text-gray-600 dark:text-gray-300">Chargement...</p>
          ) : products.length === 0 ? (
            <p className="text-red-600 dark:text-red-400">Aucun produit trouvé avec ces filtres.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
