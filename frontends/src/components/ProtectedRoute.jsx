import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute() {
  const { token, user, isLoading } = useAuth();
  const location = useLocation();

  // 🕐 Phase de chargement ou d’hydratation : on bloque la redirection
  if (isLoading || (token && !user)) {
    return (
      <section className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center py-8 text-gray-600 dark:text-gray-300">
          ⏳ Vérification de l’accès...
        </div>
      </section>
    );
  }

  //  Pas de token OU pas de profil → redirection vers login
  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  //  Accès autorisé
  return <Outlet />;
}

export default ProtectedRoute;
