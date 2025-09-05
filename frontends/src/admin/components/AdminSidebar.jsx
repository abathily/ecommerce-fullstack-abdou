import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  CubeIcon,
  ListBulletIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export default function AdminSidebar({ open, setOpen }) {
  const navItems = [
    { label: 'Dashboard', icon: HomeIcon, to: '/admin/dashboard' },
    { label: 'Produits', icon: CubeIcon, to: '/admin/products' },
    { label: 'Catégories', icon: ListBulletIcon, to: '/admin/categories' },
    { label: 'Commandes', icon: ClipboardDocumentListIcon, to: '/admin/orders' },
    { label: 'Utilisateurs', icon: UserGroupIcon, to: '/admin/users' },
  ];

  return (
    <>
      <aside
        className={`fixed top-0 left-0 h-screen w-64 z-40 p-4 shadow-md border-r
          transition-transform duration-500 ease-in-out transform-gpu
          bg-white dark:bg-gray-900 dark:border-gray-700 ${
            open ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 flex flex-col`}
      >
        {/* Bouton de fermeture (mobile) */}
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 md:hidden text-gray-500 hover:text-black dark:hover:text-white"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        {/* En-tête */}
        <div className="mt-2 mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400">🛒 Admin</h2>
          <span className="text-xs font-medium px-2 py-1 bg-cyan-200 text-cyan-800 dark:bg-cyan-700 dark:text-white rounded-full">
            Admin
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-grow space-y-2">
          {navItems.map(({ label, icon: Icon, to }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2 rounded transition-colors ${
                  isActive
                    ? 'bg-cyan-200 dark:bg-cyan-700 text-cyan-800 dark:text-white font-semibold'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-cyan-100 dark:hover:bg-gray-800'
                }`
              }
            >
              <Icon className="h-5 w-5 transition duration-300 ease-out group-hover:scale-105 group-hover:-translate-y-0.5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
          Version 1.0.0 © {new Date().getFullYear()}
        </div>
      </aside>

      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 transition-opacity duration-300 ease-out md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
