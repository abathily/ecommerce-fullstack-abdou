import { useState } from 'react';

export default function Contact() {
  const [form, setForm] = useState({
    nom: '',
    email: '',
    sujet: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!form.nom.trim()) newErrors.nom = 'Nom requis';
    if (!validateEmail(form.email)) newErrors.email = 'Email invalide';
    if (!form.sujet.trim()) newErrors.sujet = 'Sujet requis';
    if (!form.message.trim()) newErrors.message = 'Message requis';
    if (Object.keys(newErrors).length > 0) return setErrors(newErrors);

    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const result = await response.json();
    if (result.success) {
      setSubmitted(true);
      setForm({ nom: '', email: '', sujet: '', message: '' });
      setTimeout(() => setSubmitted(false), 4000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-12 animate-fadeIn">
      <h1 className="text-4xl font-bold text-cyan-700 dark:text-cyan-400">
         Contactez-nous
      </h1>

      {/* Coordonnées + Carte */}
      <div className="grid md:grid-cols-2 gap-10">
        <div className="space-y-4 text-gray-700 dark:text-gray-300">
          <p className="text-lg">Besoin d’aide ? Nous sommes là pour vous répondre.</p>
          <p><span className="font-semibold text-cyan-700 dark:text-cyan-400">📧 Email :</span> support@osakha.sn</p>
          <p><span className="font-semibold text-cyan-700 dark:text-cyan-400">📱 Téléphone :</span> +221 77 557 11 33</p>
          <p><span className="font-semibold text-cyan-700 dark:text-cyan-400">🏢 Adresse :</span> Rue du Commerce, Dakar, Sénégal</p>
          <p><span className="font-semibold text-cyan-700 dark:text-cyan-400">🕒 Horaires :</span> Lundi - Samedi : 8h à 18h</p>

          <div className="mt-6 flex gap-4">
            <a href="https://facebook.com/osakha" target="_blank" rel="noreferrer">
              <img src="/icons/facebook.svg" alt="Facebook" className="h-6 hover:scale-110 transition" />
            </a>
            <a href="https://instagram.com/osakha" target="_blank" rel="noreferrer">
              <img src="/icons/instagram.svg" alt="Instagram" className="h-6 hover:scale-110 transition" />
            </a>
            <a href="https://wa.me/221775571133" target="_blank" rel="noreferrer">
              <img src="/icons/whatsapp.svg" alt="WhatsApp" className="h-6 hover:scale-110 transition" />
            </a>
          </div>
        </div>

        <div className="rounded overflow-hidden shadow-lg animate-fadeInSlow">
          <iframe
            title="Localisation Osakha"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d..."
            width="100%"
            height="300"
            allowFullScreen
            loading="lazy"
            className="border-none w-full"
          ></iframe>
        </div>
      </div>

      {/* Formulaire */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white dark:bg-gray-900 shadow-md rounded-lg p-6 animate-fadeIn"
      >
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
          ✉️ Envoyez-nous un message
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              name="nom"
              value={form.nom}
              onChange={handleChange}
              placeholder="Votre nom"
              required
              className="border rounded px-4 py-2 w-full bg-white dark:bg-gray-800 dark:text-white"
            />
            {errors.nom && <p className="text-red-600 text-sm mt-1">{errors.nom}</p>}
          </div>
          <div>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Votre email"
              required
              className="border rounded px-4 py-2 w-full bg-white dark:bg-gray-800 dark:text-white"
            />
            {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
          </div>
        </div>

        <div>
          <input
            type="text"
            name="sujet"
            value={form.sujet}
            onChange={handleChange}
            placeholder="Sujet"
            required
            className="border rounded px-4 py-2 w-full bg-white dark:bg-gray-800 dark:text-white"
          />
          {errors.sujet && <p className="text-red-600 text-sm mt-1">{errors.sujet}</p>}
        </div>

        <div>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            placeholder="Votre message..."
            rows={5}
            required
            className="border rounded px-4 py-2 w-full bg-white dark:bg-gray-800 dark:text-white"
          ></textarea>
          {errors.message && <p className="text-red-600 text-sm mt-1">{errors.message}</p>}
        </div>

        <button
          type="submit"
          className="bg-cyan-700 text-white px-6 py-2 rounded hover:bg-cyan-600 transition"
        >
          Envoyer
        </button>

        {submitted && (
          <div className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 p-3 rounded mt-4 animate-fadeIn">
            ✅ Merci ! Votre message a été envoyé avec succès.
          </div>
        )}
      </form>
    </div>
  );
}
