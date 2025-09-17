import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import ProductReviews from '../components/ProductReviews';
import { motion, AnimatePresence } from 'framer-motion';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const { addToCart } = useCart();
  const [selectedImage, setSelectedImage] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  useEffect(() => {
    setProduct(null);
    setSimilarProducts([]);
    window.scrollTo(0, 0);

    axios.get(`https://backend-9qig.onrender.com/api/products/${id}`)
      .then((res) => {
        const images = res.data.images?.length ? res.data.images : [res.data.image];
        setProduct(res.data);
        setSelectedImage(images[0]);

        axios.get(`https://backend-9qig.onrender.com/api/products?category=${res.data.category}`)
          .then((res2) => {
            const filtered = res2.data.filter((p) => p._id !== res.data._id);
            setSimilarProducts(filtered.slice(0, 4));
          })
          .catch((err) => console.error('❌ Produits similaires :', err));
      })
      .catch((err) => console.error('❌ Produit :', err));
  }, [id]);

  const showFeedback = (message, isError = false) => {
    setFeedbackMessage({ text: message, isError });
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const handleAddToCart = () => {
    try {
      addToCart(product);
      showFeedback('✅ Produit ajouté au panier avec succès !');
    } catch (err) {
      console.error(err);
      showFeedback('❌ Une erreur est survenue lors de l’ajout.', true);
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <p className="text-gray-600 dark:text-gray-300 text-lg">Chargement du produit...</p>
      </div>
    );
  }

  const imageList = product.images?.length ? product.images : [product.image];

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-950 px-6 py-12">
      <div className="max-w-6xl mx-auto space-y-12">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-600 dark:text-gray-300 hover:underline"
        >
          &larr; Retour
        </button>

        <AnimatePresence>
          {feedbackMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`rounded-md p-4 text-sm font-medium max-w-xl mx-auto ${
                feedbackMessage.isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              }`}
            >
              {feedbackMessage.text}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col lg:flex-row gap-10 bg-white dark:bg-gray-900 p-8 rounded-md shadow-md">
          <div className="w-full lg:w-1/2 space-y-4">
            <div className="w-full h-100 overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
              <img
                src={selectedImage}
                alt="Image sélectionnée"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto">
              {imageList.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`thumb-${idx}`}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-20 object-cover rounded-md cursor-pointer border-2 ${
                    selectedImage === img ? 'border-cyan-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <h1 className="text-3xl font-bold text-cyan-700 dark:text-cyan-400">{product.name}</h1>
            <p className="text-gray-700 dark:text-gray-300 text-sm">{product.description}</p>
            <p className="text-2xl font-semibold text-cyan-700 dark:text-cyan-300">
              {product.price.toLocaleString()} CFA
            </p>

            <div className="flex items-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-5 h-5 ${
                    i < product.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.95a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.388 2.46a1 1 0 00-.364 1.118l1.286 3.951c.3.921-.755 1.688-1.54 1.118l-3.389-2.461a1 1 0 00-1.175 0l-3.389 2.46c-.784.57-1.838-.197-1.539-1.118l1.286-3.95a1 1 0 00-.364-1.119L2.049 9.377c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69l1.286-3.95z" />
                </svg>
              ))}
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                {typeof product.rating === 'number' ? product.rating.toFixed(1) + ' / 5' : 'Pas encore noté'}
              </span>
            </div>

            <button
              onClick={handleAddToCart}
              className="bg-cyan-600 hover:bg-cyan-800 text-white px-6 py-2 rounded-md font-medium"
            >
              Ajouter au panier
            </button>
          </div>
        </div>

        {similarProducts.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Produits similaires
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {similarProducts.map((item) => (
                <div
                  key={item._id}
                  onClick={() => navigate(`/products/${item._id}`)}
                  className="cursor-pointer bg-white dark:bg-gray-900 p-4 rounded-md shadow hover:shadow-lg transition"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-40 object-cover rounded-md mb-2"
                  />
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {item.name}
                  </h3>
                  <p className="text-xs text-cyan-700 dark:text-cyan-400">
                    {item.price.toLocaleString()} CFA
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <ProductReviews productId={product._id} />
      </div>
    </div>
  );
}
