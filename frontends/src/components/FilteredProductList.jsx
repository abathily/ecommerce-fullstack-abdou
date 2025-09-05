// /components/FilteredProductList.jsx
import useFilteredProducts from '../hooks/useFilteredProducts';

export default function FilteredProductList({ selectedCategory, selectedSub }) {
  const { products, loading, error } = useFilteredProducts({
    category: selectedCategory,
    subcategory: selectedSub
  });

  if (loading) return <p>Chargement en cours...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!products || products.length === 0) return <p>Aucun produit trouvé.</p>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((prod) => (
        <div key={prod._id} className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <img src={prod.image} alt={prod.name} className="w-full h-40 object-cover rounded" />
          <h3 className="mt-2 font-semibold text-lg">{prod.name}</h3>
          <p className="text-gray-600">{prod.price} FCFA</p>
        </div>
      ))}
    </div>
  );
}
