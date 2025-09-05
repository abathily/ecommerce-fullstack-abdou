import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function ReloadPage() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const target = location.state?.target;
    if (target) {
      navigate(target, { replace: true });
    }
  }, [navigate, location]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <p className="text-gray-600 dark:text-gray-300 text-lg">Chargement du produit...</p>
    </div>
  );
}
