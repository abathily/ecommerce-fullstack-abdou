// src/pages/Checkout.jsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function genId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "ord_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function Checkout() {
  const [cart, setCart] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientInfo, setClientInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("cart");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCart(Array.isArray(parsed) ? parsed : []);
      } catch (err) {
        console.error("Erreur chargement panier :", err);
      }
    }
  }, []);

  const totals = useMemo(() => {
    const subtotal = cart.reduce((acc, item) => {
      const price = typeof item.price === "number" ? item.price : Number(item.price) || 0;
      const quantity = typeof item.quantity === "number" ? item.quantity : Number(item.quantity) || 1;
      return acc + price * quantity;
    }, 0);
    const tva = subtotal * 0.18;
    const total = subtotal + tva;
    return { subtotal, tva, total };
  }, [cart]);

  const fmt = (n) =>
    (Number(n) || 0).toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " CFA";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setClientInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleOrder = () => {
    if (isSubmitting) return;

    const { name, email, phone, address } = clientInfo;
    if (!name || !email || !phone || !address) {
      toast.error("Veuillez remplir toutes les informations client.");
      return;
    }
    if (cart.length === 0) {
      toast.error("🛒 Votre panier est vide.");
      return;
    }

    setIsSubmitting(true);

    const products = cart.map((item) => ({
      productId: item._id ?? item.id ?? undefined,
      quantity: item.quantity,
      name: item.name || "Produit",
      price: typeof item.price === "number" ? item.price : Number(item.price) || 0,
    }));

    const order = {
      orderId: genId(),
      ...clientInfo,
      products,
      subtotal: totals.subtotal,
      tva: totals.tva,
      total: totals.total,
      tvaRate: 0.18,
      date: new Date().toLocaleString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    // Enregistrer la commande pour fallback
    localStorage.setItem("order", JSON.stringify(order));
    localStorage.setItem("lastOrderId", order.orderId);

    toast.success("✅ Commande réussie !");
    // Redirection — ne pas vider le panier ici
    navigate("/OrderSummary", { state: { order } });

    setIsSubmitting(false);
  };

  const handleCancel = () => {
    localStorage.removeItem("cart");
    window.dispatchEvent(new Event("storage"));
    setCart([]);
    setClientInfo({ name: "", email: "", phone: "", address: "" });
    toast("Commande annulée.");
  };

  return (
    <div className="max-w-xl mx-auto p-6 text-gray-800 dark:text-gray-100">
      <h1 className="text-2xl font-bold mb-4">Finaliser la commande</h1>

      <div className="grid gap-4 mb-6">
        {[
          { name: "name", type: "text", placeholder: "Nom complet" },
          { name: "email", type: "email", placeholder: "Email" },
          { name: "phone", type: "tel", placeholder: "Téléphone" },
          { name: "address", type: "text", placeholder: "Adresse de livraison" },
        ].map((field) => (
          <input
            key={field.name}
            name={field.name}
            type={field.type}
            value={clientInfo[field.name]}
            onChange={handleChange}
            placeholder={field.placeholder}
            className="border border-gray-400 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        ))}
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">🧺 Produits :</h2>
        {cart.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">Le panier est vide.</p>
        ) : (
          <>
            {cart.map((item, i) => {
              const price = typeof item.price === "number" ? item.price : Number(item.price) || 0;
              return (
                <div key={i} className="flex justify-between border-b border-gray-300 dark:border-gray-700 py-2">
                  <span>{item.name} × {item.quantity}</span>
                  <span>{fmt(price * item.quantity)}</span>
                </div>
              );
            })}
            <div className="mt-4 text-right space-y-1 text-sm">
              <p><strong>Sous-total HT:</strong> {fmt(totals.subtotal)}</p>
              <p><strong>TVA (18%):</strong> {fmt(totals.tva)}</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                Total TTC: {fmt(totals.total)}
              </p>
            </div>
          </>
        )}
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleOrder}
          disabled={isSubmitting || cart.length === 0}
          className={`px-4 py-2 rounded text-white transition ${
            isSubmitting || cart.length === 0
              ? "bg-green-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {isSubmitting ? "Traitement..." : "Commander"}
        </button>
        <button
          onClick={handleCancel}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
