import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminSidebar from './components/AdminSidebar';
import toast from 'react-hot-toast';

const pageSize = 5;
const privilegeOptions = ['produits', 'catégories', 'commandes', 'utilisateurs', 'statistiques'];

export default function Users() {
  const { token, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [form, setForm] = useState({
    name: '', email: '', password: '', isAdmin: false, privileges: []
  });
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!isLoading && (!token || !user || !user.isAdmin)) {
      navigate('/login');
    } else if (token && user?.isAdmin) {
      fetchUsers();
    }
  }, [isLoading, token, user]);

  useEffect(() => {
    const query = search.toLowerCase().trim();
    setFiltered(users.filter(u => u.name?.toLowerCase().includes(query)));
    setPage(1);
  }, [search, users]);

  const handleError = (msg) => {
    console.error(msg);
    toast.error(msg);
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
      setFiltered(res.data);
    } catch (err) {
      setError('❌ Erreur chargement');
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password } = form;
    if (!name.trim() || !email.trim() || (!editingId && !password.trim())) {
      toast.error('⛔ Remplis tous les champs requis');
      return;
    }

    const payload = { ...form };
    const url = editingId
      ? `http://localhost:5000/api/users/${editingId}`
      : 'http://localhost:5000/api/users';
    const method = editingId ? axios.put : axios.post;

    try {
      await method(url, payload, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(editingId ? '✅ Utilisateur modifié' : '🚀 Utilisateur créé');
      resetForm();
      fetchUsers();
    } catch (err) {
      handleError(err.response?.data?.message || '❌ Échec enregistrement');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('⚠️ Supprimer cet utilisateur ?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('🗑️ Utilisateur supprimé');
      fetchUsers();
    } catch (err) {
      handleError('❌ Suppression échouée');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ name: '', email: '', password: '', isAdmin: false, privileges: [] });
  };

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const pages = Math.ceil(filtered.length / pageSize);

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-800 dark:text-white">
      <AdminSidebar />
      <div className="ml-64 p-8">
        <h1 className="text-2xl font-bold mb-6">👥 Utilisateurs</h1>

        <input type="text" value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Rechercher..."
          className="mb-6 px-3 py-2 border rounded w-full md:w-1/2 dark:bg-gray-800" />

        {error && <p className="text-red-600 font-semibold">{error}</p>}

        {!error && (
          <>
            <table className="w-full border text-sm dark:border-gray-600">
              <thead className="bg-gray-200 dark:bg-gray-800">
                <tr>
                  <th>Nom</th><th>Email</th><th>Rôle</th><th>Privilèges</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(u => (
                  <tr key={u._id} className="border-t dark:border-gray-700">
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      {u.isAdmin ? 'Admin' : 'Client'}
                      {u.isAdmin && (
                        <span className="ml-1 text-xs px-2 py-1 bg-yellow-300 dark:bg-yellow-600 text-yellow-800 dark:text-white rounded-full">👑</span>
                      )}
                    </td>
                    <td>{Array.isArray(u.privileges) && u.privileges.length ? u.privileges.join(', ') : '—'}</td>
                    <td>
                      <button onClick={() => {
                        setEditingId(u._id);
                        setForm({
                          name: u.name,
                          email: u.email,
                          password: '',
                          isAdmin: u.isAdmin,
                          privileges: u.privileges || []
                        });
                      }}
                        className="px-2 py-1 bg-blue-500 text-white rounded text-xs">✏️</button>
                      <button onClick={() => handleDelete(u._id)}
                        className="px-2 py-1 bg-red-500 text-white rounded text-xs ml-2">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex gap-2 justify-center mt-6">
              {[...Array(pages)].map((_, i) => (
                <button key={i} onClick={() => setPage(i + 1)}
                  className={`px-3 py-1 rounded ${page === i + 1
                    ? 'bg-cyan-700 text-white font-semibold'
                    : 'bg-white dark:bg-gray-800 dark:text-white'}`}>
                  {i + 1}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit}
              className="mt-10 max-w-md bg-white dark:bg-gray-800 p-6 rounded border dark:border-gray-600">
              <h2 className="text-lg font-semibold mb-4">
                {editingId ? '✏️ Modifier utilisateur' : '➕ Ajouter utilisateur'}
              </h2>

              <input type="text" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Nom" required
                className="mb-3 w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600" />

              <input type="email" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="Email" required
                className="mb-3 w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600" />

              {!editingId && (
                <input type="password" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Mot de passe" required
                  className="mb-3 w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
              )}

              <label className="flex items-center gap-2 mb-3">
                <input type="checkbox" checked={form.isAdmin}
                  onChange={e => setForm({ ...form, isAdmin: e.target.checked, privileges: [] })} />
                Admin ?
              </label>

              {form.isAdmin && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-2">🎯 Privilèges :</h3>
                  <div className="space-y-2">
                    {privilegeOptions.map(opt => (
                      <label key={opt} className="flex items-center gap-2">
                        <input type="checkbox"
                          checked={form.privileges.includes(opt)}
                          onChange={e => {
                            const updated = e.target.checked
                              ? [...form.privileges, opt]
                              : form.privileges.filter(p => p !== opt);
                            setForm({ ...form, privileges: updated });
                          }} />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4 mt-4">
                <button type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                  {editingId ? '✅ Sauvegarder' : '🚀 Créer'}
                </button>
                {editingId && (
                  <button type="button" onClick={resetForm}
                    className="text-gray-600 dark:text-gray-300 hover:underline">Annuler</button>
                )}
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

                