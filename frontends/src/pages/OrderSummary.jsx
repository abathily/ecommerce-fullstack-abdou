// src/pages/orderSummary.jsx
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { QRCode } from "react-qrcode-logo";

// Polyfill si crypto.randomUUID n'est pas dispo
function genId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "ord_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Récupère la dernière commande stockée en local
function parseOrderFromStorage() {
  const primary = localStorage.getItem("order");
  const last = localStorage.getItem("lastOrder");
  const raw = primary || last;
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    return data && typeof data === "object" ? data : null;
  } catch {
    return null;
  }
}

// Normalisation robuste pour différents schémas { products | items | cart }
function normalizeOrder(raw) {
  if (!raw || typeof raw !== "object") return null;

  const source =
    (Array.isArray(raw.products) && raw.products) ||
    (Array.isArray(raw.items) && raw.items) ||
    (Array.isArray(raw.cart) && raw.cart) ||
    [];

  const products = source.map((item) => {
    const id = item.productId ?? item.id ?? undefined;
    const name = item.name ?? item.title ?? item.productName ?? "Produit";

    const price =
      Number(
        typeof item.price === "number" ? item.price : item.unitPrice ?? item.price
      ) || 0;

    const quantity =
      Number(
        typeof item.quantity === "number" ? item.quantity : item.qty ?? item.quantity
      ) || 1;

    return { id, name, price, quantity };
  });

  const computedSubtotal = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const taxRate =
    typeof raw.tvaRate === "number" && raw.tvaRate >= 0 && raw.tvaRate <= 1
      ? raw.tvaRate
      : 0.18;

  const subtotal = typeof raw.subtotal === "number" ? raw.subtotal : computedSubtotal;
  const tva = typeof raw.tva === "number" ? raw.tva : subtotal * taxRate;
  const total =
    typeof raw.total === "number"
      ? raw.total
      : Math.round((subtotal + tva) * 100) / 100;

  const date =
    raw.date ||
    new Date().toLocaleString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return {
    orderId: raw.orderId || genId(),
    date,
    name: raw.name || raw.customerName || "Client",
    email: raw.email || raw.customerEmail || "",
    phone: raw.phone || raw.customerPhone || "",
    address: raw.address || raw.shippingAddress || "",
    products,
    subtotal,
    tva,
    total,
    tvaRate: taxRate,
  };
}

// Persiste l'ordre et maintient un index local
function persistOrder(order) {
  if (!order || !order.orderId) return;

  localStorage.setItem("order", JSON.stringify(order));
  localStorage.setItem(`order:${order.orderId}`, JSON.stringify(order));

  let index = [];
  try {
    index = JSON.parse(localStorage.getItem("ordersIndex")) || [];
  } catch {
    index = [];
  }
  if (!index.some((it) => it.orderId === order.orderId)) {
    index.unshift({
      orderId: order.orderId,
      date: order.date,
      total: order.total,
      name: order.name,
    });
    localStorage.setItem("ordersIndex", JSON.stringify(index.slice(0, 50)));
  }

  // Notifie la navbar (lien "Résumé" conditionnel)
  window.dispatchEvent(new Event("order:updated"));
}

const fmt = (n) =>
  (Number(n) || 0).toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " CFA";

export default function OrderSummary() {
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const clearedRef = useRef(false);

  // Préférence à l'ordre passé via navigate(state), sinon fallback localStorage
  useEffect(() => {
    const rawState =
      (location.state && typeof location.state === "object" && location.state.order) ||
      (location.state && typeof location.state === "object" && location.state) ||
      null;

    if (rawState) {
      const normalized = normalizeOrder(rawState);
      if (normalized) {
        setOrder(normalized);
        return;
      }
    }
    const raw = parseOrderFromStorage();
    const normalized = normalizeOrder(raw);
    if (normalized) setOrder(normalized);
  }, [location.state]);

  // Persist, titre, et signal "order:updated"
  useEffect(() => {
    if (!order) return;
    persistOrder(order);
    document.title = `Résumé commande #${order.orderId}`;
  }, [order]);

  // Vider le panier UNE SEULE FOIS après confirmation (MAJ badge Navbar)
  useEffect(() => {
    if (!order || clearedRef.current) return;
    clearedRef.current = true;

    const lastCleared = localStorage.getItem("lastClearedOrderId");
    if (lastCleared !== order.orderId) {
      localStorage.removeItem("cart");
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("cart:changed"));
      localStorage.setItem("lastClearedOrderId", order.orderId);
    }
  }, [order]);

  const handlePrint = () => {
    if (typeof window !== "undefined" && window.print) window.print();
  };

  const handleTrack = () => {
    if (!order?.orderId) return;
    navigate(`/Orders/${order.orderId}`, { state: { orderId: order.orderId, order } });
  };

  if (!order) {
    return (
      <div className="max-w-xl mx-auto p-6 text-center text-gray-700 dark:text-gray-200">
        <p className="mb-4">⛔ Aucune commande trouvée.</p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => navigate("/cart")}
            className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition"
          >
            🛒 Retour au panier
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 transition"
          >
            🏬 Aller à la boutique
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative max-w-4xl mx-auto p-6 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200 print:bg-white print:text-black">
      {/* Filigrane imprimé */}
      <div className="hidden print:block absolute inset-0 z-0 pointer-events-none">
        <img
          src="/osakha.png"
          alt="Filigrane"
          className="w-[60%] mx-auto opacity-10 print:opacity-10"
          style={{ transform: "translateY(100px)" }}
        />
      </div>

      {/* En-tête */}
      <div className="text-center mb-6 relative z-10">
        <img src="/osakha.png" alt="Logo Boutique" className="mx-auto h-12 print:h-10" />
        <h1 className="text-2xl font-bold mt-2 text-cyan-700 dark:text-cyan-400 print:text-black">
          Reçu de commande
        </h1>
        <p className="text-sm">
          N° facture : <strong>{order.orderId}</strong>
        </p>
        <p className="text-sm">{order.date}</p>
      </div>

      {/* Infos client */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded mb-6 text-sm relative z-10 print:text-black">
        <p>
          <strong>Nom :</strong> {order.name}
        </p>
        <p>
          <strong>Email :</strong> {order.email || "—"}
        </p>
        <p>
          <strong>Téléphone :</strong> {order.phone || "—"}
        </p>
        <p>
          <strong>Adresse :</strong> {order.address || "—"}
        </p>
      </div>

      {/* Produits */}
      <div className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded relative z-10 print:text-black overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-gray-300 dark:border-gray-700">
              <th className="py-2 pr-2">Produit</th>
              <th className="py-2 pr-2">Qté</th>
              <th className="py-2 pr-2">PU</th>
              <th className="py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.products.map((item, idx) => {
              const key = item.id ?? `${item.name}-${idx}`;
              return (
                <tr key={key} className="border-b border-gray-200 dark:border-gray-800">
                  <td className="py-2 pr-2">{item.name}</td>
                  <td className="py-2 pr-2">{item.quantity}</td>
                  <td className="py-2 pr-2">{fmt(item.price)}</td>
                  <td className="py-2">{fmt(item.price * item.quantity)}</td>
                </tr>
              );
            })}
            {order.products.length === 0 && (
              <tr>
                <td colSpan={4} className="py-3 text-center text-gray-500 dark:text-gray-400">
                  Aucun produit dans cette commande.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Totaux */}
        <div className="mt-4 text-sm text-right space-y-1">
          <p>
            <strong>Sous-total HT :</strong> {fmt(order.subtotal)}
          </p>
          <p>
            <strong>TVA ({Math.round((order.tvaRate ?? 0.18) * 100)}%) :</strong> {fmt(order.tva)}
          </p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">
            Total TTC : {fmt(order.total)}
          </p>
        </div>
      </div>

      {/* QR Code */}
      <div className="mt-6 flex flex-col items-center gap-2 print:hidden">
        <QRCode
          value={JSON.stringify({ orderId: order.orderId, total: order.total })}
          size={120}
          qrStyle="dots"
          eyeRadius={3}
          fgColor="#0891b2"
        />
        <p className="text-xs text-gray-600 dark:text-gray-400">Facture #{order.orderId}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mt-8 print:hidden">
        <button
          onClick={() => navigate("/")}
          className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded text-sm"
        >
          ⬅️ Retour à la boutique
        </button>

        <button
          onClick={handlePrint}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
        >
          🖨 Télécharger le reçu
        </button>

        <button
          onClick={handleTrack}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm"
        >
          📦 Suivre ma commande
        </button>
      </div>

      {/* Remerciement */}
      <p className="mt-10 text-center text-sm text-gray-600 dark:text-gray-400 print:text-black">
        Merci pour votre commande <strong>{order.name}</strong>. Nous espérons vous revoir très
        bientôt 🧡
      </p>
    </div>
  );
}
