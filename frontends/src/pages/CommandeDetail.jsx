// src/pages/CommandeDetail.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function CommandeDetail() {
  const { id } = useParams();
  const location = useLocation();
  const { token } = useAuth();

  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE =
    (import.meta && import.meta.env && import.meta.env.VITE_API_URL) ||
    process.env.REACT_APP_API_URL ||
    "https://ecommerce-fullstack-abdou.onrender.com";

  const formatXOF = (value) =>
    new Intl.NumberFormat("fr-SN", {
      style: "currency",
      currency: "XOF",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));

  const formatDateTime = (value) => {
    const d = value ? new Date(value) : null;
    return d && !Number.isNaN(d.valueOf())
      ? d.toLocaleString("fr-SN", { dateStyle: "full", timeStyle: "short" })
      : "—";
  };

  const normalizeStatus = (raw) => {
    if (!raw) return "preparation";
    const s = String(raw).toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
    if (["pending", "processing", "en_preparation", "preparation"].includes(s)) return "preparation";
    if (["shipped", "expediee", "expedie", "expedition"].includes(s)) return "expediee";
    if (["delivered", "livree", "livre"].includes(s)) return "livree";
    return "preparation";
  };

  const steps = useMemo(
    () => [
      { key: "preparation", label: "En préparation", icon: "⚙️" },
      { key: "expediee", label: "Expédiée", icon: "✈️" },
      { key: "livree", label: "Livrée", icon: "📬" },
    ],
    []
  );

  const cacheKey = useMemo(() => (id ? `order:${id}` : null), [id]);

  const saveCache = useCallback(
    (data) => {
      if (!cacheKey) return;
      try {
        localStorage.setItem(cacheKey, JSON.stringify(data));
      } catch {}
    },
    [cacheKey]
  );

  const loadCache = useCallback(() => {
    if (!cacheKey) return null;
    try {
      const raw = localStorage.getItem(cacheKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [cacheKey]);

  const fetchOrder = useCallback(async () => {
    if (!id) {
      setError("Identifiant de commande manquant.");
      setIsLoading(false);
      return;
    }
    try {
      const res = await axios.get(`${API_BASE}/api/orders/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        withCredentials: true,
      });
      if (res.data && (res.data.orderId || res.data._id || res.data.id)) {
        setOrder(res.data);
        saveCache(res.data);
        setError("");
      } else {
        throw new Error("Réponse invalide");
      }
    } catch {
      const cached = loadCache();
      if (cached) {
        setOrder(cached);
        setError("Affichage des données en cache (mode hors-ligne).");
      } else {
        setError("Commande introuvable ou connexion indisponible.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE, id, loadCache, saveCache, token]);

  useEffect(() => {
    const fromState = location.state && location.state.order ? location.state.order : null;
    if (fromState) {
      setOrder(fromState);
      saveCache(fromState);
      setIsLoading(false);
    } else {
      const cached = loadCache();
      if (cached) {
        setOrder(cached);
        setIsLoading(false);
      }
    }

    fetchOrder();
    const interval = setInterval(fetchOrder, 10000);
    return () => clearInterval(interval);
  }, [fetchOrder, loadCache, location.state, saveCache]);

  const computed = useMemo(() => {
    if (!order) return { idLabel: "—", statusKey: "preparation", products: [], total: 0 };
    const idLabel = order.orderId || order.id || order._id || "—";
    const statusKey = normalizeStatus(order.status);
    const products = Array.isArray(order.products) ? order.products : [];
    const total =
      order.total ??
      products.reduce((acc, item) => {
        const qty = Number(item.quantity || 0);
        const price = Number(item.price ?? item.productId?.price ?? 0);
        return acc + qty * price;
      }, 0);
    return { idLabel, statusKey, products, total };
  }, [order]);

  useEffect(() => {
    if (computed.idLabel && computed.idLabel !== "—") {
      document.title = `Commande #${computed.idLabel} | Osakha`;
    }
  }, [computed.idLabel]);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  if (!order && error) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchOrder}
          className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Réessayer
        </button>
        <div className="mt-6">
          <Link to="/mes-commandes" className="text-indigo-600 hover:underline">
            ← Retour à mes commandes
          </Link>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const activeIndex = steps.findIndex((s) => s.key === computed.statusKey);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">📦 Commande #{computed.idLabel}</h1>
        <div className="flex items-center gap-2">
          <Link
            to="/mes-commandes"
            className="px-3 py-2 text-sm rounded border hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            ← Mes commandes
          </Link>
          <button
            onClick={() => window.print()}
            className="px-3 py-2 text-sm rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            🖨️ Imprimer
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-4 text-sm text-amber-600">
          {error} — les données seront mises à jour dès que possible.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded border">
          <p><strong>Client :</strong> {order.name || order.customer?.name || "—"}</p>
          <p><strong>Date :</strong> {formatDateTime(order.date || order.createdAt)}</p>
          <p><strong>Adresse :</strong> {order.address || order.shipping?.address || "—"}</p>
        </div>
        <div className="p-4 rounded border">
          <p><strong>Statut :</strong> <span className="font-semibold">
            {steps.find((s) => s.key === computed.statusKey)?.label}
          </span></p>
          <p><strong>Mode de paiement :</strong> {order.paymentMethod || "—"}</p>
          <p><strong>Référence paiement :</strong> {order.paymentRef || "—"}</p>
        </div>
      </div>

      <div className="my-6">
        <h2 className="text-md font-semibold mb-3">Suivi de livraison</h2>
        <div className="flex justify-between items-center text-sm">
          {steps.map((etape, index) => {
            const isActive = activeIndex >= 0 && index <= activeIndex;
            return (
              <div key={etape.key} className="flex-1 text-center">
                <div
                  className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center text-lg ${
                    isActive ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {etape.icon}
                </div>
                <p className={`mt-1 ${isActive ? "text-green-700 font-semibold" : "text-gray-500"}`}>
                  {etape.label}
                </p>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-sm text-indigo-600 font-medium text-center">
          {{
            preparation: "Estimation : livraison dans 2 à 3 jours",
            expediee: "Estimation : livraison demain ou après-demain",
            livree: "✅ Votre commande a été livrée",
          }[computed.statusKey]}
        </p>
      </div>

      <h2 className="text-md font-semibold mt-6 mb-2">Produits</h2>
      <ul className="bg-gray-50 dark:bg-gray-900 border p-4 rounded">
        {computed.products.map((item, index) => {
          const name = item.name || item.productId?.name || "Produit";
          const quantity = Number(item.quantity) || 0;
          const unitPrice = Number(item.price ?? item.productId?.price ?? 0);
          const total = quantity * unitPrice;

          return (
            <li key={index} className="flex justify-between py-2 border-b last:border-b-0">
              <span className="truncate pr-2">{name} × {quantity}</span>
              <span className="whitespace-nowrap">{formatXOF(total)}</span>
            </li>
          );
        })}
        <li className="flex justify-between font-bold pt-4 text-base">
          <span>Total :</span>
          <span>{formatXOF(computed.total)}</span>
        </li>
      </ul>
    </div>
  );
}
