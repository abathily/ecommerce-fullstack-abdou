// src/pages/Login.jsx
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // ne pas trim
  const [remember, setRemember] = useState(() => {
    try {
      return !!localStorage.getItem('remember_me');
    } catch {
      return false;
    }
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const abortRef = useRef(null);

  const { login, token, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Base URL compatible CRA / Vite
  const RAW_API_BASE =
    process.env.REACT_APP_API_URL ||
    process.env.VITE_API_URL ||
    'https://ecommerce-fullstack-abdou.onrender.com';
  const API_BASE = RAW_API_BASE.replace(/\/+$/, '');
  const LOGIN_URL = `${API_BASE}/api/users/login`;

  // Redirection si déjà connecté
  useEffect(() => {
    if (!isLoading && token && user) {
      const from = location.state?.from;
      const target = from
        ? `${from.pathname}${from.search || ''}${from.hash || ''}`
        : '/';
      navigate(target, { replace: true });
    }
  }, [isLoading, token, user, navigate, location.state]);

  // Réinitialiser l'erreur quand l'utilisateur retape
  useEffect(() => {
    if (error) setError('');
  }, [email, password]); // volontairement sans "error"

  // Nettoyage des requêtes en cours à l’unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const emailNormalized = email.trim().toLowerCase();
    if (!emailNormalized || !password) return;

    setError('');
    setLoading(true);

    // Annule la requête précédente si existante
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const payload = {
        email: emailNormalized,
        password, // envoyer tel quel (pas de trim)
        remember, // pour maxAge côté serveur si implémenté
      };

      const { data } = await axios.post(LOGIN_URL, payload, {
        withCredentials: true, // cookie httpOnly
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: 15000,
        signal: controller.signal,
      });

      if (!data?.token || !data?.user) {
        throw new Error('Réponse invalide du serveur');
      }

      // Persistance "remember me" (indication pour l’AuthContext)
      try {
        if (remember) localStorage.setItem('remember_me', '1');
        else localStorage.removeItem('remember_me');
      } catch {
        // stockage non disponible -> ignorer
      }

      await login(data.token, data.user, { remember });

      // Laisse l’effet "déjà connecté" gérer la redirection, évite un double navigate.
      // Si tu préfères rediriger ici immédiatement, réactive la navigation ci-dessous.
      // const from = location.state?.from;
      // const target = from
      //   ? `${from.pathname}${from.search || ''}${from.hash || ''}`
      //   : '/';
      // navigate(target, { replace: true });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Erreur de connexion :', err);

      // Requête annulée: ne rien afficher
      const canceled =
        err?.name === 'CanceledError' ||
        err?.code === 'ERR_CANCELED';
      if (canceled) return;

      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.message;
      const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;

      let message = 'Email ou mot de passe incorrect';
      if (err?.code === 'ECONNABORTED') {
        message = 'Délai de connexion dépassé. Réessayez.';
      } else if ((status === 400 || status === 401 || status === 403) && serverMsg) {
        message = serverMsg;
      } else if (status === 429) {
        message = 'Trop de tentatives. Réessayez dans quelques minutes.';
      } else if (status >= 500) {
        message = 'Erreur serveur. Réessayez plus tard.';
      } else if (!err?.response) {
        message = isOffline ? 'Vous êtes hors ligne.' : 'Impossible de contacter le serveur.';
      }

      setError(message);
    } finally {
      setLoading(false);
      abortRef.current = null;
      // Optionnel: nettoyage du mot de passe après tentative
      // setPassword('');
    }
  };

  const emailNormalized = email.trim().toLowerCase();
  const canSubmit = !loading && !!emailNormalized && !!password;

  if (isLoading) {
    return (
      <section className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center py-8 text-gray-600 dark:text-gray-300">
          ⏳ Vérification de la session...
        </div>
      </section>
    );
  }

  return (
    <section className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg w-full max-w-md p-6 space-y-6"
        noValidate
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">Connexion</h2>
        </div>

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="text-sm text-red-600 dark:text-red-400 font-semibold bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-600 rounded px-4 py-2"
          >
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-60"
            placeholder="Adresse email"
            required
            disabled={loading}
            aria-invalid={!!error}
          />
        </div>

        <div>
          <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Mot de passe
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)} // pas de trim
              className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 pr-10 text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-60"
              placeholder="Mot de passe"
              required
              disabled={loading}
              aria-invalid={!!error}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              aria-pressed={showPassword}
              tabIndex={-1}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label htmlFor="remember" className="inline-flex items-center">
            <input
              id="remember"
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 text-cyan-600 dark:text-cyan-400 border-gray-300 dark:border-gray-600 rounded focus:ring-cyan-500 disabled:opacity-60"
              disabled={loading}
            />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Se souvenir de moi</span>
          </label>

          <Link to="/forgot-password" className="text-sm text-cyan-600 dark:text-cyan-400 hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className={`w-full py-2 px-4 text-sm font-medium text-white rounded-md shadow-md transition ${
            !canSubmit
              ? 'bg-cyan-400 cursor-not-allowed'
              : 'bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-700 dark:hover:bg-cyan-800'
          }`}
        >
          {loading ? 'Connexion en cours...' : 'Se connecter'}
        </button>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Vous n’avez pas de compte ?{' '}
          <Link to="/register" className="text-cyan-600 dark:text-cyan-400 font-medium underline">
            S’enregistrer
          </Link>
        </p>
      </form>
    </section>
  );
}
