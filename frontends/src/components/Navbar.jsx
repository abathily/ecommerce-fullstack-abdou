// src/components/Navbar.jsx
import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import BoutiqueDropdown from './BoutiqueDropdown';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();

  // Compte total des articles (quantités)
  const cartCount = useMemo(
    () => cart.reduce((acc, item) => acc + (item.quantity ?? 1), 0),
    [cart]
  );

  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [hasOrder, setHasOrder] = useState(false);
  const profileRef = useRef(null);
  const location = useLocation();

  // Init thème
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldDark = savedTheme ? savedTheme === 'dark' : prefersDark;
      document.documentElement.classList.toggle('dark', shouldDark);
      setDarkMode(shouldDark);
    } catch {
      // no-op
    }
  }, []);

  // Présence d’une commande pour le lien Résumé
  useEffect(() => {
    const refresh = () => {
      try {
        const order = localStorage.getItem('order');
        const lastOrderId = localStorage.getItem('lastOrderId');
        setHasOrder(Boolean(order || lastOrderId));
      } catch {
        setHasOrder(false);
      }
    };
    refresh();
    window.addEventListener('storage', refresh);
    window.addEventListener('order:updated', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('order:updated', refresh);
    };
  }, []);

  // Fermer menu profil au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fermer menus au changement de route
  useEffect(() => {
    setMenuOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  // Fermer menus avec Échap
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setIsProfileOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {
      // no-op
    }
    setDarkMode(next);
  };

  const linkBase = 'hover:text-yellow-300 transition-colors';
  const activeLink = 'text-yellow-400 dark:text-yellow-300';

  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="sticky top-0 z-50 bg-white/60 backdrop-blur-md dark:bg-gray-900/40 border-b border-transparent dark:border-gray-800"
      aria-label="Navigation principale"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex-shrink-0" aria-label="Aller à l’accueil">
            <img src="/osakha.png" alt="Osakha" className="h-10 w-auto" />
          </Link>

          {/* Desktop */}
          <div className="hidden sm:flex space-x-6 items-center text-gray-800 dark:text-gray-100">
            <BoutiqueDropdown />

            <NavLink
              to="/cart"
              className={({ isActive }) =>
                `relative ${linkBase} ${isActive ? activeLink : ''}`
              }
            >
              Panier
              {cartCount > 0 && (
                <span
                  aria-live="polite"
                  aria-label={`${cartCount} articles dans le panier`}
                  className="absolute -top-2 -right-4 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full"
                >
                  {cartCount}
                </span>
              )}
            </NavLink>

            {/* {hasOrder && (
              <NavLink
                to="/order-summary"
                className={({ isActive }) => `${linkBase} ${isActive ? activeLink : ''}`}
              >
                Résumé
              </NavLink>
            )} */}

            <NavLink
              to="/orders"
              className={({ isActive }) => `${linkBase} ${isActive ? activeLink : ''}`}
            >
              Commandes
            </NavLink>

            <NavLink
              to="/contact"
              className={({ isActive }) => `${linkBase} ${isActive ? activeLink : ''}`}
            >
              Contact
            </NavLink>

            <button
              onClick={toggleDarkMode}
              className="text-xl px-2 py-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10"
              aria-label={darkMode ? 'Passer en thème clair' : 'Passer en thème sombre'}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>

            {user ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen((o) => !o)}
                  className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow hover:bg-cyan-50 transition dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                  aria-expanded={isProfileOpen}
                  aria-haspopup="menu"
                  aria-label="Ouvrir le menu profil"
                >
                  {user.image ? (
                    <img
                      src={user.image}
                      alt="Photo de profil"
                      className="h-8 w-8 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                      <svg
                        className="h-5 w-5 text-gray-600 dark:text-white"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5.121 17.804A10.97 10.97 0 0112 15c2.502 0 4.788.82 6.879 2.204M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                  )}
                  <span
                    className={`text-sm font-semibold ${
                      user.isAdmin ? 'text-yellow-600' : 'text-cyan-600'
                    }`}
                  >
                    {user.isAdmin ? 'Admin' : 'Moi'}
                  </span>
                </button>

                {isProfileOpen && (
                  <div
                    role="menu"
                    className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 shadow-lg rounded-md p-4 border dark:border-gray-600 text-gray-800 dark:text-white z-40"
                  >
                    <p className="font-bold text-base">{user.name}</p>
                    <p className="text-sm">{user.email}</p>
                    <p className="text-xs mt-1 italic">
                      {user.isAdmin ? 'Administrateur' : 'Client'}
                    </p>
                    <Link
                      to="/profile"
                      className="block mt-2 text-blue-600 hover:underline text-sm dark:text-blue-400"
                      role="menuitem"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      Voir profil
                    </Link>
                    {user.isAdmin && (
                      <Link
                        to="/admin/dashboard"
                        className="block mt-2 text-red-600 hover:underline text-sm dark:text-red-400"
                        role="menuitem"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        Accès Admin
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        logout();
                      }}
                      className="mt-3 w-full text-left text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded"
                      role="menuitem"
                    >
                      🚪 Déconnexion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `px-4 py-1 rounded bg-white text-cyan-700 font-semibold hover:bg-cyan-100 transition dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 ${isActive ? 'ring-2 ring-cyan-400' : ''}`
                }
              >
                Connexion
              </NavLink>
            )}
          </div>

          {/* Mobile buttons */}
          <div className="sm:hidden flex items-center space-x-2 text-gray-800 dark:text-white">
            <button
              onClick={toggleDarkMode}
              className="text-xl px-2 py-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10"
              aria-label={darkMode ? 'Passer en thème clair' : 'Passer en thème sombre'}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/10 focus:outline-none"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label="Ouvrir le menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Menu Mobile */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="sm:hidden px-4 pb-4 space-y-2 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white"
        >
          <BoutiqueDropdown />
          <NavLink to="/cart" className="block py-2 relative">
            Panier
            {cartCount > 0 && (
              <span
                aria-live="polite"
                aria-label={`${cartCount} articles dans le panier`}
                className="absolute top-0 right-0 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full"
              >
                {cartCount}
              </span>
            )}
          </NavLink>

          {hasOrder && (
            <NavLink to="/order-summary" className="block py-2">
              Résumé
            </NavLink>
          )}

          <NavLink to="/orders" className="block py-2">Commandes</NavLink>
          <NavLink to="/contact" className="block py-2">Contact</NavLink>

          {user ? (
            <>
              <NavLink to="/profile" className="block py-2 font-medium">
                👤 {user.name}
                <span
                  className={`ml-2 text-xs px-2 py-1 rounded-full ${
                    user.isAdmin ? 'bg-yellow-300 text-yellow-900' : 'bg-cyan-300 text-cyan-900'
                  }`}
                >
                  {user.isAdmin ? 'Admin' : 'Client'}
                </span>
              </NavLink>
              {user.isAdmin && (
                <NavLink to="/admin/dashboard" className="block text-yellow-600 font-medium py-1">
                  🔧 Accès Admin
                </NavLink>
              )}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="block w-full text-center py-2 bg-red-500 text-white font-semibold rounded hover:bg-red-600 transition"
              >
                🚪 Déconnexion
              </button>
            </>
          ) : (
            <NavLink
              to="/login"
              className="block w-full text-center py-2 bg-white text-cyan-700 font-semibold rounded hover:bg-cyan-100 transition dark:bg-gray-900 dark:text-white dark:hover:bg-gray-700"
            >
              🔐 Connexion
            </NavLink>
          )}
        </div>
      )}
    </motion.nav>
  );
}
