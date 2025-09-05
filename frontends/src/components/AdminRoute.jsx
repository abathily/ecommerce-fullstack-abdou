import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AccessDenied from './AccessDenied';

export default function AdminRoute() {
  const { user, token, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <section className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-300">⏳ Vérification des droits admin...</p>
      </section>
    );
  }

  // Non connecté → redirection vers /admin/login (avec retour possible)
  if (!user || !token) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  // Connecté mais rôle non admin → accès refusé
  if (user.role !== 'admin') {
    return <AccessDenied />;
  }

  // Accès autorisé
  return <Outlet />;
}
