// src/components/PrivateRoute.js

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ adminOnly = false }) {
  const { token, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-600 dark:text-gray-300">
         Vérification de la session...
      </div>
    );
  }

  //  Vérifie si l'utilisateur est bien connecté
  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  //  Vérifie s’il faut un accès admin
  if (adminOnly && !user.isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  //  Accès autorisé : rend les sous-routes via Outlet
  return <Outlet />;
}
