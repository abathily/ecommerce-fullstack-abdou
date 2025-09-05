import React from 'react';
import { Link } from 'react-router-dom';

function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 py-12">
      <h1 className="text-4xl font-bold text-red-600 mb-4">Accès refusé</h1>
      <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
        Vous n’avez pas les autorisations nécessaires pour accéder à cette page.
      </p>
      <Link to="/" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition">
        Retour à l’accueil
      </Link>
    </div>
  );
}

export default AccessDenied;
