import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // Assure-toi d’avoir ce hook

export default function ProductReviews({ productId }) {
  const { user } = useAuth(); // récupère l'utilisateur connecté
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [filterRating, setFilterRating] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`https://backend-9qig.onrender.com/api/reviews/${productId}`)
      .then((res) => {
        setReviews(res.data);
        setLoading(false);
      })
      .catch((err) => console.error('❌ Erreur chargement avis :', err));
  }, [productId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    axios
      .post('https://backend-9qig.onrender.com/api/reviews', {
        productId,
        comment,
        rating,
        user: user?.name || 'Anonyme',
      })
      .then(() => {
        setComment('');
        setRating(0);
        return axios.get(`https://backend-9qig.onrender.com/api/reviews/${productId}`);
      })
      .then((res) => setReviews(res.data))
      .catch((err) => console.error('❌ Erreur envoi avis :', err));
  };

  const filteredReviews =
    filterRating > 0 ? reviews.filter((r) => r.rating >= filterRating) : reviews;

  return (
    <div className="mt-12 space-y-8">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Avis utilisateurs</h2>

      {/* 🔢 Nombre total */}
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {reviews.length} avis au total
      </p>

      {/* ⭐ Filtre par note */}
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-sm text-gray-700 dark:text-gray-300">Filtrer par note :</span>
        {[0, 4, 5].map((num) => (
          <button
            key={num}
            onClick={() => setFilterRating(num)}
            className={`px-3 py-1 rounded-md text-sm border ${
              filterRating === num
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-white'
            }`}
          >
            {num === 0 ? 'Tous' : `⭐ ${num}+`}
          </button>
        ))}
      </div>

      {/* 📝 Formulaire d'avis */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Votre avis sur ce produit..."
          rows="4"
          required
          className="w-full p-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
        />

        {/* ⭐ Sélecteur d'étoiles */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700 dark:text-gray-300">Note :</span>
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              type="button"
              key={num}
              onClick={() => setRating(num)}
              className={`w-7 h-7 rounded-full flex items-center justify-center ${
                rating >= num ? 'bg-yellow-400' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              ⭐
            </button>
          ))}
        </div>

        <button
          type="submit"
          className="bg-cyan-600 hover:bg-cyan-800 text-white px-6 py-2 rounded-md font-medium"
        >
          Envoyer
        </button>
      </form>

      {/* 💬 Liste des avis */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-gray-600 dark:text-gray-300">Chargement des avis...</p>
        ) : filteredReviews.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">Aucun avis disponible.</p>
        ) : (
          filteredReviews.map((rev, idx) => (
            <div
              key={idx}
              className="border-t pt-4 dark:border-gray-700 space-y-1 animate-fadeInSlow"
            >
              <p className="text-sm text-gray-800 dark:text-gray-100">{rev.comment}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ⭐ {rev.rating} / 5 — {rev.user}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
