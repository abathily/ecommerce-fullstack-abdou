import { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import ProductCard from '../components/ProductCard';
import CategorySection from '../components/CategorySection';
import Carousel from '../components/Carousel';
import VideoIntro from '../components/VideoIntro';

export default function Home() {
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    subcategory: '',
    priceOrder: '',
    brands: [],
  });

  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categorizedProducts, setCategorizedProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [modeFiltrage, setModeFiltrage] = useState(false);

  const testimonials = [
    {
      name: 'Aïssatou Diallo',
      img: '/avatars/client1.jpg',
      role: 'Cliente fidèle',
      text: "“Un service impeccable et des produits qui respirent l'authenticité. J’ai retrouvé ici ce que je cherchais depuis des années.”"
    },
    {
      name: 'Souleymane Ndiaye',
      img: '/avatars/client2.jpg',
      role: 'Artisan partenaire',
      text: "“O’Sakha m’a permis de faire découvrir mes créations à l’international. Une vitrine sérieuse pour les talents locaux.”"
    },
    {
      name: 'Fatou Bâ',
      img: '/avatars/client3.jpg',
      role: 'Acheteuse professionnelle',
      text: "“Qualité, transparence et engagement. C’est devenu mon site préféré pour sourcer des marques africaines.”"
    }
  ];

  const partners = [
    { name: 'Kerastase', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Kérastase_logo.svg/512px-Kérastase_logo.svg.png' },
    { name: 'L’Oréal', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/L%27Or%C3%A9al_logo.svg/512px-L%27Or%C3%A9al_logo.svg.png' },
    { name: 'Sony', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Sony_logo.svg/512px-Sony_logo.svg.png' },
    { name: 'Samsung', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/512px-Samsung_Logo.svg.png' },
    { name: 'Apple', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/512px-Apple_logo_black.svg.png' }
  ];

  const isFiltreActif = Object.values(filters).some((value) =>
    Array.isArray(value) ? value.length > 0 : value !== ''
  );

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        if (isFiltreActif) {
          const params = {
            ...(filters.search && { search: filters.search }),
            ...(filters.category && { category: filters.category }),
            ...(filters.subcategory && { subcategory: filters.subcategory }),
            ...(filters.priceOrder && { priceOrder: filters.priceOrder }),
            ...(filters.brands.length && { brands: filters.brands.join(',') }),
          };
          const res = await axios.get('http://localhost:5000/api/products', { params });
          setFilteredProducts(res.data);
          setModeFiltrage(true);
        } else {
          const res = await axios.get('http://localhost:5000/api/products');
          const produits = res.data;
          const regroupésParCatégorie = {};
          produits.forEach((prod) => {
            const cat = prod.category || 'Autres';
            if (!regroupésParCatégorie[cat]) regroupésParCatégorie[cat] = [];
            regroupésParCatégorie[cat].push(prod);
          });
          setCategorizedProducts(regroupésParCatégorie);
          setModeFiltrage(false);
        }
      } catch (err) {
        console.error('❌ Erreur produits :', err.message);
        setFilteredProducts([]);
        setCategorizedProducts({});
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [filters]);

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <VideoIntro />

      <div className="flex flex-col sm:flex-row bg-gray-50 dark:bg-gray-900 min-h-screen">
        {/* 🧭 Sidebar */}
        <aside className="sm:w-[20rem] sm:sticky sm:top-24 h-fit max-h-[calc(100vh-6rem)] overflow-hidden">
          <Sidebar filters={filters} setFilters={setFilters} />
        </aside>

        {/* 🛍️ Main */}
        <main className="flex-1 px-4 sm:px-6 py-10 space-y-20">
          <h1 className="text-3xl font-bold text-cyan-700 dark:text-cyan-400 mb-6">Bienvenue dans O'Sakha</h1>

          <Carousel />

          {/* 🛒 Produits */}
          <section id="produits">
            {loading ? (
              <p className="text-gray-600">Chargement...</p>
            ) : modeFiltrage ? (
              <>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">🎯 Résultats filtrés</h2>
                {filteredProducts.length === 0 ? (
                  <p className="text-red-600">Aucun produit trouvé.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredProducts.map((p) => (
                      <ProductCard key={p._id} product={p} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">🗂️ Produits par catégorie</h2>
                {Object.entries(categorizedProducts).map(([cat, produits]) => (
                  <CategorySection key={cat} title={cat} products={produits} maxVisible={6} />
                ))}
              </>
            )}
          </section>

          {/* 💬 Témoignages */}
          <section>
            <h2 className="text-xl font-bold text-cyan-700 dark:text-cyan-400 mb-6">💬 Ce que disent nos clients</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((t, idx) => (
                <div key={idx} className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg shadow-sm group hover:scale-[1.02] transition">
                  <div className="flex items-center gap-4 mb-3">
                    <img src={t.img} alt={t.name} className="w-12 h-12 rounded-full object-cover group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="font-bold text-gray-700 dark:text-white">{t.name}</p>
                      <p className="text-sm text-gray-500">{t.role}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm italic">{t.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 🤝 Partenaires */}
          <section>
            <h2 className="text-xl font-bold text-cyan-700 dark:text-cyan-400 mb-6">🤝 Nos partenaires</h2>
            <div className="flex flex-wrap gap-6 justify-center items-center">
              {partners.map((p, idx) => (
                <img key={idx} src={p.logo} alt={p.name} className="h-12 w-auto grayscale hover:grayscale-0 transition" />
              ))}
            </div>
          </section>

          {/* 📦 À propos */}
          <section className="pt-10 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-cyan-700 dark:text-cyan-400 mb-4">📦 À propos de la boutique</h2>
            <p className="text-gray-700 dark:text-gray-300 max-w-3xl leading-relaxed">
              O’Sakha est une boutique sénégalaise dédiée à la mise en lumière des talents africains.
              Chaque produit est sélectionné avec soin pour refléter l’authenticité, la durabilité et la richesse culturelle du continent.
              Nos équipes collaborent avec des marques locales et internationales pour offrir une expérience unique à chaque client.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
