import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PublicRoute() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return <div className="text-center py-8 text-gray-600 dark:text-gray-300">⏳ Chargement de la session...</div>;
  }

  if (token) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />; // 👈 Permet de gérer les enfants dans les routes imbriquées
}
