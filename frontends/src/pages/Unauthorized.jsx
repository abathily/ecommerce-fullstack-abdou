// src/pages/Unauthorized.jsx
import { useLocation, Link, useNavigate } from 'react-router-dom';

export default function Unauthorized() {
  const location = useLocation();
  const navigate = useNavigate();

  const from =
    location.state?.from?.pathname ||
    location.state?.from ||
    '/';

  return (
    <section className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md p-6 text-center space-y-5">
        <div className="text-5xl">🚫</div>
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">
          Accès interdit
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Vous n’avez pas les droits nécessaires pour accéder à cette page.
        </p>

        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Retour
          </button>
          <Link
            to={from}
            className="px-4 py-2 text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-700 dark:hover:bg-cyan-800"
          >
            Aller à l’accueil
          </Link>
        </div>
      </div>
    </section>
  );
}
