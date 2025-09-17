import { useEffect, useState } from 'react';
import axios from 'axios';
import AdminSidebar from './components/AdminSidebar';
import toast from 'react-hot-toast';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [form, setForm] = useState({
    name: '', price: '', stock: '', category: '', subcategory: '',
    imagesLinks: '', description: ''
  });
  const [localFiles, setLocalFiles] = useState([]);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 6;

  useEffect(() => { fetch(); }, []);
  useEffect(() => {
    const match = v => v?.toLowerCase().includes(search.toLowerCase());
    setFiltered(products.filter(p =>
      [p.name, p.category, p.subcategory].some(match)
    ));
    setPage(1);
  }, [search, products]);

  const fetch = async () => {
    const res = await axios.get('https://backend-9qig.onrender.com/api/products');
    setProducts(res.data); setFiltered(res.data);
  };

  const reset = () => {
    setForm({
      name: '', price: '', stock: '', category: '',
      subcategory: '', imagesLinks: '', description: ''
    });
    setLocalFiles([]); setEditing(null);
  };

  const handleUpload = (e) => {
    setLocalFiles([...e.target.files]);
  };

  const previewImages = [
    ...(editing?.images || []),
    ...localFiles.map(file => URL.createObjectURL(file))
  ];

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.stock || !form.category) {
      toast.error("⛔ Champs requis manquants !");
      return;
    }

    try {
      const payload = {
        name: form.name,
        price: form.price,
        stock: form.stock,
        category: form.category,
        subcategory: form.subcategory,
        description: form.description
      };

      const url = editing
        ? `https://backend-9qig.onrender.com/api/products/${editing._id}`
        : 'https://backend-9qig.onrender.com/api/products';
      const method = editing ? axios.put : axios.post;

      const { data: savedProduct } = await method(url, payload);

      const formData = new FormData();
      if (localFiles.length > 0) {
        localFiles.forEach(file => formData.append('images', file));
      }
      formData.append('links', JSON.stringify(
        form.imagesLinks.split(',').map(l => l.trim()).filter(Boolean)
      ));

      await axios.post(`https://backend-9qig.onrender.com/api/products/${savedProduct._id}/images`, formData);

      toast.success(editing ? '✅ Produit modifié !' : '✅ Produit ajouté !');
      fetch(); reset();
    } catch (err) {
      console.error(err);
      toast.error('❌ Erreur lors de l’enregistrement du produit.');
    }
  };

  const handleEdit = (product) => {
    setForm({
      name: product.name || '',
      price: product.price || '',
      stock: product.stock || '',
      category: product.category || '',
      subcategory: product.subcategory || '',
      description: product.description || '',
      imagesLinks: Array.isArray(product.images)
        ? product.images.filter(img => !img.startsWith('/uploads/')).join(', ')
        : ''
    });
    setLocalFiles([]);
    setEditing(product);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`https://backend-9qig.onrender.com/api/products/${id}`);
      toast.success('🗑️ Produit supprimé.');
      fetch();
    } catch (err) {
      toast.error('❌ Suppression échouée.');
    }
  };

  const total = Math.ceil(filtered.length / limit);
  const data = filtered.slice((page - 1) * limit, page * limit);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      <div className="w-64"><AdminSidebar /></div>
      <div className="flex-1 p-6 overflow-auto">
        <h1 className="text-3xl font-bold mb-6 text-cyan-700 dark:text-cyan-400">🛍️ Produits</h1>

        <form onSubmit={submit} className="space-y-4 mb-8 bg-white dark:bg-gray-800 p-6 rounded shadow border dark:border-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {['name','price','stock','category','subcategory'].map((k) => (
              <input key={k}
                type={['price','stock'].includes(k) ? 'number' : 'text'}
                required={['name','price','stock','category'].includes(k)}
                placeholder={k}
                value={form[k]}
                onChange={(e)=>setForm({...form,[k]:e.target.value})}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            ))}
            <textarea
              placeholder="Liens d'images (séparés par virgule)"
              value={form.imagesLinks}
              onChange={(e)=>setForm({...form, imagesLinks: e.target.value})}
              className="w-full col-span-2 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <input type="file" multiple onChange={handleUpload}
              className="w-full col-span-2 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>

          <div className="flex gap-4 flex-wrap mt-2">
            {previewImages.map((img, i) => (
              <img key={i} src={img} alt="preview" className="h-20 w-20 object-cover rounded border dark:border-gray-600" />
            ))}
          </div>

          <textarea
            value={form.description}
            onChange={(e)=>setForm({...form, description:e.target.value})}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white mt-4"
            rows={3}
            placeholder="Description"
          />

          <div className="flex gap-4 mt-4">
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              {editing ? 'Mettre à jour' : 'Ajouter'}
            </button>
            {editing && (
              <button type="button" onClick={reset}
                className="text-gray-600 dark:text-gray-300 hover:underline">Annuler</button>
            )}
          </div>
        </form>

        <input type="text" placeholder="🔍 Rechercher..." value={search}
          onChange={(e)=>setSearch(e.target.value)}
          className="w-full p-2 mb-4 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />

        <table className="w-full border border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              {['Nom','Prix','Stock','Catégorie','Sous-catégorie','Actions'].map((t,i)=>(
                <th key={i} className="p-2 border dark:border-gray-600">{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(p=>(
              <tr key={p._id} className="border-t dark:border-gray-600">
                <td className="p-2">{p.name}</td>
                <td className="p-2">{p.price.toLocaleString()} FCFA</td>
                <td className="p-2">{p.stock}</td>
                <td className="p-2">{p.category}</td>
                <td className="p-2">{p.subcategory || '-'}</td>
                <td className="p-2 space-x-2">
                  <button onClick={()=>handleEdit(p)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600">Modifier</button>
                  <button onClick={()=>handleDelete(p._id)}
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-center items-center gap-4 mt-6">
          <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}
            className="px-3 py-1 bg-slate-200 dark:bg-gray-700 rounded hover:bg-slate-300 dark:hover:bg-gray-600">
            ⬅️ Précédent
          </button>
          <span>{page} / {total}</span>
          <button onClick={() => setPage(p => Math.min(p + 1, total))} disabled={page === total}
            className="px-3 py-1 bg-slate-200 dark:bg-gray-700 rounded hover:bg-slate-300 dark:hover:bg-gray-600">
            Suivant ➡️
          </button>
        </div>
      </div>
    </div>
  );
}
