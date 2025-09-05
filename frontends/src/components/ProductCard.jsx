import { Link } from 'react-router-dom';

export default function ProductCard({ product }) {
  const hasPrice = typeof product?.price === 'number';
  const displayPrice = hasPrice ? `${product.price.toLocaleString()} FCFA` : 'Prix indisponible';
  const hasDescription = product?.description;

  return (
    <div className="flex flex-col bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 animate-fadeIn">
      
      {/* Image produit */}
      <div className="h-56 w-full overflow-hidden">
        <img
          src={product.image || '/placeholder.jpg'}
          alt={product.name || 'Produit'}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Détails */}
      <div className="flex flex-col flex-grow justify-between p-4">
        <div>
          <h3 className="text-lg text-cyan-600 dark:text-cyan-400 font-semibold mb-1">
            {product.name || 'Produit inconnu'}
          </h3>

          <p className="text-base font-bold text-cyan-600 dark:text-cyan-300 mb-2">
            {displayPrice}
          </p>

          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {hasDescription ? product.description : 'Pas de description disponible.'}
          </p>
        </div>

        {/* Bouton */}
        {product._id ? (
          <Link
            to={`/product/${product._id}`}
            className="mt-4 w-full bg-cyan-600 hover:bg-cyan-700 text-white text-center py-2 rounded-md transition"
          >
            Voir détails
          </Link>
        ) : (
          <div className="mt-4 text-center text-sm text-gray-400 italic">
            Aucun détail disponible
          </div>
        )}
      </div>
    </div>
  );
}
