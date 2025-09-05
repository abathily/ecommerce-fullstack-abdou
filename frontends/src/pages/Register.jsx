// src/pages/Register.jsx
import { useState, useMemo, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Base URL (CRA ou Vite)
  const RAW_API_BASE =
    process.env.REACT_APP_API_URL ||
    process.env.VITE_API_URL ||
    'http://localhost:5000';
  const API_BASE = RAW_API_BASE.replace(/\/+$/, '');
  const REGISTER_URL = `${API_BASE}/api/users/register`;

  // State contrôlé
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // UI state
  const [remember, setRemember] = useState(() => {
    try {
      return !!localStorage.getItem('remember_me');
    } catch {
      return false;
    }
  });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const abortRef = useRef(null);

  // Validation
  const MIN_NAME_LEN = 2;
  const MIN_PWD_LEN = 8;
  const isValidEmail = (val) => /\S+@\S+\.\S+/.test(val);
  const isFormValid = useMemo(() => {
    const n = name.trim();
    const e = email.trim().toLowerCase();
    const p = password; // ne pas trim
    return n.length >= MIN_NAME_LEN && isValidEmail(e) && p.length >= MIN_PWD_LEN;
  }, [name, email, password]);

  // Nettoyage des requêtes en cours à l’unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  // Reset des erreurs à la saisie
  useEffect(() => {
    if (error) setError('');
  }, [name, email, password]); // volontairement sans "error"

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || !isFormValid) return;

    setError('');
    setSuccessMsg('');
    setLoading(true);

    // Annule la requête précédente si existante
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password, // respecter exactement la saisie
        remember, // si backend gère maxAge côté cookie
      };

      // Autorise aussi le cookie httpOnly si ton backend en pose un
      const { data, status } = await axios.post(REGISTER_URL, payload, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: 15000,
        signal: controller.signal,
      });

      // Attendu: 201 + { token, user } (ou 200)
      if ((status === 201 || status === 200) && data?.user) {
        // Persistance "remember me" (comme Login)
        try {
          if (remember) localStorage.setItem('remember_me', '1');
          else localStorage.removeItem('remember_me');
        } catch {
          // stockage indisponible: ignorer
        }

        if (data?.token) {
          // Connexion immédiate
          await login(data.token, data.user, { remember });

          // Redirection préférentielle vers la route d’origine
          const from = location.state?.from;
          const target = from
            ? `${from.pathname}${from.search || ''}${from.hash || ''}`
            : '/';
          navigate(target, { replace: true });
          return;
        }

        // Pas de token: fallback vers /login
        setSuccessMsg('Compte créé avec succès. Redirection…');
        setTimeout(() => navigate('/login', { replace: true }), 900);
        return;
      }

      throw new Error('Réponse inattendue du serveur');
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.error('Erreur d’inscription :', err);
      }

      // Requête annulée: ne rien afficher
      const canceled =
        err?.name === 'CanceledError' ||
        err?.code === 'ERR_CANCELED';
      if (canceled) return;

      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.message;
      const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;

      let message = 'Inscription impossible. Vérifiez vos informations.';
      if (err?.code === 'ECONNABORTED') {
        message = 'Délai dépassé. Réessayez.';
      } else if (status === 409 || (status === 400 && /existant|utilisé|exist/i.test(serverMsg || ''))) {
        message = serverMsg || 'Email déjà utilisé';
      } else if (status === 400 && serverMsg) {
        message = serverMsg;
      } else if (status === 401) {
        message = serverMsg || 'Identifiants invalides';
      } else if (status === 422) {
        message = serverMsg || 'Données invalides';
      } else if (status === 429) {
        message = 'Trop de tentatives. Réessayez dans quelques minutes.';
      } else if (status >= 500) {
        message = 'Erreur serveur. Réessayez plus tard.';
      } else if (!err?.response) {
        message = isOffline ? 'Vous êtes hors ligne.' : 'Impossible de contacter le serveur.';
      } else if (serverMsg) {
        message = serverMsg;
      }

      setError(message);
    } finally {
      setLoading(false);
      abortRef.current = null;
      // Optionnel: nettoyer le mot de passe après tentative
      // setPassword('');
    }
  };

  return (
    <section className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg w-full max-w-md p-6 space-y-6"
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">Inscription</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Crée ton compte pour continuer
          </p>
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

        {successMsg && (
          <div
            role="status"
            aria-live="polite"
            className="text-sm text-green-600 dark:text-green-400 font-semibold bg-green-100 dark:bg-green-900/40 border border-green-300 dark:border-green-600 rounded px-4 py-2"
          >
            {successMsg}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nom
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoCapitalize="words"
              autoComplete="name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Votre nom"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Au moins {MIN_NAME_LEN} caractères.
            </p>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Votre email"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
                type={showPwd ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)} // ne pas trim
                placeholder="Votre mot de passe"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                aria-pressed={showPwd}
                className="absolute inset-y-0 right-2 px-2 text-xs text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                {showPwd ? 'Masquer' : 'Afficher'}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Au moins {MIN_PWD_LEN} caractères. Les espaces sont pris en compte tels quels.
            </p>
          </div>

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
        </div>

        <button
          type="submit"
          disabled={loading || !isFormValid}
          className={`w-full py-2 px-4 text-sm font-medium text-white rounded-md shadow-md transition ${
            loading || !isFormValid
              ? 'bg-cyan-400 cursor-not-allowed'
              : 'bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-700 dark:hover:bg-cyan-800'
          }`}
        >
          {loading ? 'Création de compte...' : "S’inscrire"}
        </button>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Vous avez déjà un compte ?{' '}
          <Link to="/login" className="text-cyan-600 dark:text-cyan-400 font-medium underline">
            Connexion
          </Link>
        </p>
      </form>
    </section>
  );
}
