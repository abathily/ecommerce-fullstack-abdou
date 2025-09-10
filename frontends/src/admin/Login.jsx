import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await axios.post('https://ecommerce-fullstack-abdou.onrender.com/api/users/login', {
        email,
        password
      });

      const { user, token } = data;

      if (user?.isAdmin) {
        login(token); // 🔐 Stocker le token dans AuthContext
        navigate('/admin/dashboard');
      } else {
        alert("⛔ Accès refusé : vous n'êtes pas administrateur.");
      }
    } catch (error) {
      const message = error.response?.data?.message || "Email ou mot de passe invalide.";
      console.error("❌ Erreur connexion admin :", message);
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto mt-10 p-6 border rounded-lg shadow-md bg-white"
    >
      <h2 className="text-2xl font-bold mb-6 text-center text-cyan-700">🔐 Connexion Admin</h2>

      <label className="block mb-2 text-sm text-slate-700">Email</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email administrateur"
        className="w-full mb-4 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
        required
      />

      <label className="block mb-2 text-sm text-slate-700">Mot de passe</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Mot de passe"
        className="w-full mb-6 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
        required
      />

      <button
        type="submit"
        disabled={loading}
        className={`w-full py-2 rounded-md text-white ${
          loading ? 'bg-cyan-400 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-700 transition-colors'
        }`}
      >
        {loading ? 'Connexion...' : 'Se connecter'}
      </button>
    </form>
  );
}
