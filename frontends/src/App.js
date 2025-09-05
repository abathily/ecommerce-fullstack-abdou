// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layout
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages publiques
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProductDetails from './pages/ProductDetails';
import ProductList from './pages/ProductList';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSummary from './pages/OrderSummary';
import ContactPage from './pages/Contact';
import ForgotPassword from './pages/ForgotPassword';
import MesCommandes from './pages/MesCommandes';


// Pages utilisateur protégées
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import CommandeDetail from './pages/CommandeDetail';
import Unauthorized from './pages/Unauthorized';

// Pages administration
import Dashboard from './admin/Dashboard';
import ProductsAdmin from './admin/Products';
import CategoriesAdmin from './admin/Categories';
import UsersAdmin from './admin/Users';
import OrdersAdmin from './admin/Orders';
import AdminLogin from './admin/Login';

// Contextes
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Routes sécurisées
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// 404 simple
const NotFound = () => <div className="p-6 text-center">Page non trouvée</div>;

// Route "publique uniquement": si déjà authentifié, on redirige.
// - Non-admin -> `to`
// - Admin -> `adminTo`
// Détecte aussi si l'utilisateur tente d'accéder à une page admin publique (ex: /admin/login).
function PublicOnlyRoute({ to = '/', adminTo = '/admin/dashboard' }) {
  const { user, token, isLoading, isAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <section className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-300">⏳ Chargement de la session...</p>
      </section>
    );
  }

  if (user && token) {
    const wantsAdmin = location.pathname.startsWith('/admin');
    const redirect = isAdmin ? adminTo : to;
    // Si l’utilisateur ouvre /admin/login mais n’est pas admin, on le redirige vers `to` (ex: /profile)
    return <Navigate to={wantsAdmin ? (isAdmin ? adminTo : to) : redirect} replace />;
  }

  return <Outlet />;
}

// Shell de l'application
function AppShell() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-white text-gray-800 dark:bg-gray-900 dark:text-white transition-colors duration-300">
        <Navbar />
        <Toaster position="top-right" reverseOrder={false} />
        <main className="flex-grow">
          <Routes>
            {/* Routes publiques */}
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/products/:category/:subcategory" element={<ProductList />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/OrderSummary" element={<OrderSummary />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/mes-commandes" element={<MesCommandes />} />


            {/* Auth publique uniquement (si connecté, redirige) */}
            <Route element={<PublicOnlyRoute to="/profile" />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>

            {/* Routes protégées utilisateur */}
            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<Profile />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/mes-commandes/:id" element={<CommandeDetail />} />
            </Route>

            {/* Admin - page de login admin publique uniquement */}
            <Route element={<PublicOnlyRoute to="/profile" adminTo="/admin/dashboard" />}>
              <Route path="/admin/login" element={<AdminLogin />} />
            </Route>

            {/* Admin - routes protégées */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route element={<AdminRoute />}>
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route path="/admin/products" element={<ProductsAdmin />} />
              <Route path="/admin/categories" element={<CategoriesAdmin />} />
              <Route path="/admin/users" element={<UsersAdmin />} />
              <Route path="/admin/orders" element={<OrdersAdmin />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppShell />
      </CartProvider>
    </AuthProvider>
  );
}
