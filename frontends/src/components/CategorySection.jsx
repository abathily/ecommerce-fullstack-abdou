import { useState } from 'react';
import ProductCard from './ProductCard';

export default function CategorySection({ title, products, maxVisible = 6 }) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? products : products.slice(0, maxVisible);

  return (
    <section className="mb-10">
      <h3 className="text-xl font-bold text-cyan-600 dark:text-cyan-400 mb-4">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayed.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
      {products.length > maxVisible && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-4 text-sm text-cyan-600 hover:underline"
        >
          👀 Voir tout
        </button>
      )}
    </section>
  );
}
