import { useState } from 'react';
import ProductCard from './ProductCard';

export default function CategoryCarousel({ title, products }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = products.slice(startIndex, startIndex + itemsPerPage);

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  if (products.length === 0) return null;

  return (
    <div className="my-10">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {currentItems.map((product, index) => (
          <ProductCard key={index} product={product} />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center mt-4 gap-2">
        <button
          onClick={handlePrev}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50"
        >
          Précédent
        </button>
        <span className="text-sm text-gray-700">
          Page {currentPage} sur {totalPages}
        </span>
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50"
        >
          Suivant
        </button>
      </div>
    </div>
  );
}
