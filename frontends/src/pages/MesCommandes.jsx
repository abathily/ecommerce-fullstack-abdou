// src/pages/MesCommandes.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function MesCommandes() {
  const { token } = useAuth();

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const API_BASE =
    (import.meta && import.meta.env && import.meta.env.VITE_API_URL) ||
    process.env.REACT_APP_API_URL ||
    "https://backend-9qig.onrender.com";

  const cacheKey = "orders:me";

  const formatXOF = (value) =>
    new Intl.NumberFormat("fr-SN", {
      style: "currency",
      currency: "XOF",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));

  const formatDateTime = (value) => {
    const d = value ? new Date(value) : null;
    return d && !Number.isNaN(d.valueOf())
      ? d.toLocaleString("fr-SN", { dateStyle: "medium", timeStyle: "short" })
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

  const stepsMap = {
    preparation: { label: "En préparation", color: "bg-yellow-100 text-yellow-800", icon: "⚙️" },
    expediee: { label: "Expédiée", color: "bg-blue-100 text-blue-800", icon: "✈️" },
    livree: { label: "Livrée", color: "bg-green-100 text-green-800", icon: "📬" },
  };

  const saveCache = useCallback((data) => {
    try {
      localStorage.setItem(cacheKey, JSON.stringify({ data, ts: Date.now() }));
    } catch {}
  }, []);

  const loadCache = useCallback(() => {
    try {
      const raw = localStorage.getItem(cacheKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.data || null;
    } catch {
      return null;
    }
  }, []);

  const normalizeOrder = useCallback((o) => {
    const id = o.id || o.orderId || o._id || null;
    const createdAt = o.createdAt || o.date || o.updatedAt || null;
    const status = normalizeStatus(o.status);
    const products = Array.isArray(o.products) ? o.products : [];
    const total =
      o.total ??
      products.reduce((acc, item) => {
        const qty = Number(item.quantity || 0);
        const price = Number(item.price ?? item.productId?.price ?? 0);
        return acc + qty * price;
      }, 0);
    const customer = o.name || o.customer?.name || o.user?.name || o.client?.name || "—";
    return { ...o, _id_norm: id, _date_norm: createdAt, _status_norm: status, _total_norm: total, _customer_norm: customer };
  }, []);

  const hydrate = useCallback((data) => {
    const normalized = data
      .filter(Boolean)
      .map(normalizeOrder)
      .sort((a, b) => (new Date(b._date_norm || 0) - new Date(a._date_norm || 0)));
    setOrders(normalized);
    saveCache(normalized);
  }, [normalizeOrder, saveCache]);

  const fetchFrom = useCallback(
    async (url) => {
      const res = await axios.get(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        withCredentials: true,
      });
      return res.data;
    },
    [token]
  );

  const fetchOrders = useCallback(async () => {
    setError("");
    try {
      let data = await fetchFrom(`${API_BASE}/api/orders/me`);
      if (!Array.isArray(data) && Array.isArray(data?.orders)) data = data.orders;
      if (!Array.isArray(data)) throw new Error("Réponse invalide");
      hydrate(data);
    } catch {
      try {
        let data = await fetchFrom(`${API_BASE}/api/orders?mine=true`);
        if (!Array.isArray(data) && Array.isArray(data?.orders)) data = data.orders;
        if (!Array.isArray(data)) throw new Error("Réponse invalide");
        hydrate(data);
      } catch {
        try {
          let data = await fetchFrom(`${API_BASE}/api/commandes`);
          if (!Array.isArray(data) && Array.isArray(data?.orders)) data = data.orders;
          if (!Array.isArray(data)) throw new Error("Réponse invalide");
          hydrate(data);
        } catch {
          const cached = loadCache();
          if (cached) {
            setOrders(cached);
            setError("Affichage des commandes en cache (mode hors-ligne).");
          } else {
            setError("Impossible de charger vos commandes pour le moment.");
          }
        }
      }
    } finally {
      setIsLoading(false);
      setLastUpdated(new Date());
    }
  }, [API_BASE, fetchFrom, hydrate, loadCache]);

  const intervalRef = useRef(null);

  useEffect(() => {
    const cached = loadCache();
    if (cached) {
      setOrders(cached);
      setIsLoading(false);
    }
    fetchOrders();
    intervalRef.current = setInterval(fetchOrders, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchOrders, loadCache]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      const matchStatus = statusFilter === "all" || o._status_norm === statusFilter;
      if (!q) return matchStatus;
      const inId = String(o._id_norm || "").toLowerCase().includes(q);
      const inCustomer = String(o._customer_norm || "").toLowerCase().includes(q);
      const inProducts = (o.products || []).some((p) =>
        String(p.name || p.productId?.name || "").toLowerCase().includes(q)
      );
      return matchStatus && (inId || inCustomer || inProducts);
    });
  }, [orders, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const visible = filtered.slice(start, start + pageSize);

  const stats = useMemo(() => {
    const s = { preparation: 0, expediee: 0, livree: 0, total: orders.length };
    orders.forEach((o) => {
      s[o._status_norm] = (s[o._status_norm] || 0) + 1;
    });
    return s;
  }, [orders]);

  return (
    <section className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-4">
        <h1 className="text-2xl font-semibold">📦 Mes commandes</h1>
        {lastUpdated && (
          <p className="text-sm text-gray-500">Dernière mise à jour: {formatDateTime(lastUpdated)}</p>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded border border-amber-300 bg-amber-50 text-amber-800">
          {error}{" "}
          <button onClick={fetchOrders} className="ml-2 underline hover:no-underline">
            Réessayer
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <input
          type="text"
          placeholder="Rechercher (ID, client, produit...)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900"
        >
          <option value="all">Tous les statuts</option>
          <option value="preparation">En préparation</option>
          <option value="expediee">Expédiée</option>
          <option value="livree">Livrée</option>
        </select>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Total: {stats.total}</span>
          <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">Prépa: {stats.preparation}</span>
          <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">Exp: {stats.expediee}</span>
          <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">Livrées: {stats.livree}</span>
        </div>
      </div>

      {isLoading && orders.length === 0 ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse h-16 bg-gray-200 dark:bg-gray-800 rounded" />
          ))}
        </div>
      ) : null}

      {!isLoading && filtered.length === 0 ? (
        <div className="p-8 text-center text-gray-500 border rounded">
          🛒 Aucune commande à afficher avec ces critères.
        </div>
      ) : null}

      <ul className="space-y-3">
        {visible.map((o) => {
          const id = o._id_norm;
          const date = o._date_norm;
          const status = o._status_norm;
          const badge = stepsMap[status] || stepsMap.preparation;

          const itemsCount = Array.isArray(o.products)
            ? o.products.reduce((acc, it) => acc + Number(it.quantity || 0), 0)
            : 0;

          return (
            <li key={id} className="border rounded p-4 bg-white dark:bg-gray-900 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="font-semibold truncate">Commande #{id || "—"}</h2>
                  <p className="text-sm text-gray-500">
                    {formatDateTime(date)} • {itemsCount} article(s)
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded ${badge.color}`}>
                    {badge.icon} {badge.label}
                  </span>
                  <span className="font-semibold whitespace-nowrap">{formatXOF(o._total_norm)}</span>
                  <Link
                    to={`/mes-commandes/${id}`}
                    state={{ order: o }}
                    className="text-indigo-600 hover:underline whitespace-nowrap"
                  >
                    Détails →
                  </Link>
                </div>
              </div>

              {Array.isArray(o.products) && o.products.length > 0 && (
                <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                  {o.products.slice(0, 3).map((it, idx) => {
                    const name = it.name || it.productId?.name || "Produit";
                    const qty = Number(it.quantity || 0);
                    return (
                      <span key={idx} className="mr-3">
                        {name} × {qty}
                      </span>
                    );
                  })}
                  {o.products.length > 3 && (
                    <span className="text-gray-400">+{o.products.length - 3} autre(s)</span>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {filtered.length > pageSize && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            className="px-3 py-1 rounded border disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            ← Précédent
          </button>
          <span className="text-sm">Page {currentPage} / {totalPages}</span>
          <button
            className="px-3 py-1 rounded border disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Suivant →
          </button>
        </div>
      )}
    </section>
  );
}
