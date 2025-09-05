// src/components/Footer.jsx
import { Link, useInRouterContext } from 'react-router-dom';

function SafeLink({ to, children, ...props }) {
  // Utilise Link seulement si on est dans un Router, sinon fallback <a>
  const inRouter = typeof useInRouterContext === 'function' ? useInRouterContext() : false;

  if (!to || !inRouter) {
    const href = typeof to === 'string' ? to : '#';
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }

  return (
    <Link to={to} {...props}>
      {children}
    </Link>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-cyan-600 text-gray-800 dark:bg-gray-900 dark:text-gray-300 animate-fadeInSlow">
      <div className="mx-auto w-full max-w-screen-xl">
        {/* Top grid */}
        <div className="grid grid-cols-2 gap-8 px-4 py-8 lg:py-10 md:grid-cols-4">
          {/* Marque */}
          <div>
            <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Osakha</h2>
            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-400">
              Boutique en ligne basée à Dakar, Sénégal. Produits sélectionnés, paiement sécurisé,
              et livraison rapide. Besoin d’aide ? Écris‑nous.
            </p>
            <ul className="mt-4 text-sm">
              <li className="mb-1">
                <a
                  href="mailto:contact@osakha.sn"
                  className="hover:underline"
                  aria-label="Envoyer un email à Osakha"
                >
                  contact@osakha.sn
                </a>
              </li>
              <li className="mb-1">
                <span className="text-gray-700 dark:text-gray-400">Dakar, Sénégal</span>
              </li>
            </ul>
          </div>

          {/* Boutique */}
          <div>
            <h2 className="mb-6 text-sm font-semibold uppercase text-gray-900 dark:text-white">Boutique</h2>
            <ul className="font-medium space-y-3">
              <li>
                <SafeLink to="/" className="hover:underline">Accueil</SafeLink>
              </li>
              <li>
                <SafeLink to="/products" className="hover:underline">Tous les produits</SafeLink>
              </li>
              <li>
                <SafeLink to="/cart" className="hover:underline">Panier</SafeLink>
              </li>
              <li>
                <SafeLink to="/checkout" className="hover:underline">Paiement</SafeLink>
              </li>
              <li>
                <SafeLink to="/orders/summary" className="hover:underline">Résumé de commande</SafeLink>
              </li>
            </ul>
          </div>

          {/* Compte */}
          <div>
            <h2 className="mb-6 text-sm font-semibold uppercase text-gray-900 dark:text-white">Compte</h2>
            <ul className="font-medium space-y-3">
              <li>
                <SafeLink to="/login" className="hover:underline">Connexion</SafeLink>
              </li>
              <li>
                <SafeLink to="/register" className="hover:underline">Inscription</SafeLink>
              </li>
              <li>
                <SafeLink to="/profile" className="hover:underline">Mon profil</SafeLink>
              </li>
              <li>
                <SafeLink to="/orders" className="hover:underline">Mes commandes</SafeLink>
              </li>
              <li>
                <SafeLink to="/forgot-password" className="hover:underline">Mot de passe oublié</SafeLink>
              </li>
            </ul>
          </div>

          {/* Aide & Légal */}
          <div>
            <h2 className="mb-6 text-sm font-semibold uppercase text-gray-900 dark:text-white">Aide & Légal</h2>
            <ul className="font-medium space-y-3">
              <li>
                <SafeLink to="/contact" className="hover:underline">Contact</SafeLink>
              </li>
              <li>
                <a
                  href="mailto:contact@osakha.sn?subject=Support%20Osakha"
                  className="hover:underline"
                >
                  Support client
                </a>
              </li>
              <li>
                <SafeLink to="/privacy" className="hover:underline">Politique de confidentialité</SafeLink>
              </li>
              <li>
                <SafeLink to="/terms" className="hover:underline">Conditions d’utilisation</SafeLink>
              </li>
              <li>
                <SafeLink to="/admin/login" className="hover:underline">Espace Admin</SafeLink>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="px-4 py-6 bg-gray-200 dark:bg-gray-800 md:flex md:items-center md:justify-between rounded-b-lg">
          <span className="text-sm sm:text-center">
            © {year}{' '}
            <SafeLink to="/" className="hover:underline">
              Osakha
            </SafeLink>
            . Tous droits réservés.
          </span>

          <div className="flex mt-4 space-x-5 sm:justify-center md:mt-0">
            <a
              href="https://www.facebook.com/osakha"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-50"
              aria-label="Facebook"
            >
              🌐
            </a>
            <a
              href="https://x.com/osakha"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-50"
              aria-label="Twitter/X"
            >
              🐦
            </a>
            <a
              href="https://www.instagram.com/osakha"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-50"
              aria-label="Instagram"
            >
              📸
            </a>
            <a
              href="mailto:contact@osakha.sn"
              className="hover:text-cyan-50"
              aria-label="Email"
            >
              ✉️
            </a>
            <a
              href="https://github.com/osakha"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-50"
              aria-label="GitHub"
            >
              💻
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
