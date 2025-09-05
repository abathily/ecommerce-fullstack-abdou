// src/components/AdminLayout.jsx
import AdminSidebar from './AdminSidebar';
import { useState } from 'react';

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-gray-50">
      <AdminSidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main
        className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : ''
        } md:ml-64 p-6 md:p-8`}
      >
        {/* Bouton menu mobile */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden mb-4 px-3 py-2 bg-cyan-600 text-white rounded"
        >
          ☰ Menu
        </button>

        {children}
      </main>
    </div>
  );
}
