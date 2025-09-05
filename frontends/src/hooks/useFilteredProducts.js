// /hooks/useFilteredProducts.js
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function useFilteredProducts({ category, subcategory }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/products/filter', {
          params: {
            category: category === 'Toutes' ? '' : category,
            subcategory: subcategory === 'Toutes' ? '' : subcategory
          }
        });
        setProducts(response.data);
        setError('');
      } catch (err) {
        console.error('Erreur récupération produits filtrés :', err.message);
        setError('Impossible de charger les produits filtrés');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category, subcategory]);

  return { products, loading, error };
}
