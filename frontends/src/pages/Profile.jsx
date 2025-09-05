// src/pages/Profile.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Résout la base URL du backend (Vite ou CRA)
function resolveBaseURL() {
  const fromEnv =
    process.env.REACT_APP_API_URL ||
    (typeof import.meta !== "undefined" &&
      import.meta.env &&
      import.meta.env.VITE_API_URL);

  if (fromEnv) return fromEnv;

  const { protocol, hostname, port } = window.location;
  if (port === "3000" || port === "3001") return `${protocol}//${hostname}:5000`;
  return "";
}

// Récupère un éventuel token stocké localement (fallback)
function getStoredTokenFromAuthStorage() {
  try {
    const raw = localStorage.getItem("auth") || sessionStorage.getItem("auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token || null;
  } catch {
    return null;
  }
}

// Essaie plusieurs endpoints jusqu'au premier succès (stop si erreur != 404)
async function tryGet(api, urls, config = {}) {
  let lastError;
  for (const url of urls) {
    try {
      const res = await api.get(url, config);
      return res;
    } catch (err) {
      lastError = err;
      if (err?.response?.status !== 404) throw err;
    }
  }
  throw lastError;
}

export default function Profile() {
  const { user, token: ctxToken, logout } = useAuth();

  const [history, setHistory] = useState([]); // commandes normalisées
  const [connectionCount, setConnectionCount] = useState(0);

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });

  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  // Axios instance dédiée
  const api = useMemo(
    () =>
      axios.create({
        baseURL: resolveBaseURL(),
        withCredentials: true, // cookies httpOnly si le backend en utilise
      }),
    []
  );

  // Intercepteur pour injecter le token dans les requêtes
  const reqInterceptorId = useRef(null);
  useEffect(() => {
    const token = ctxToken || getStoredTokenFromAuthStorage();
    reqInterceptorId.current = api.interceptors.request.use((config) => {
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    return () => {
      if (reqInterceptorId.current !== null) {
        api.interceptors.request.eject(reqInterceptorId.current);
      }
    };
  }, [api, ctxToken]);

  // Helpers d'affichage
  const formatDate = useCallback((value) => {
    const d = value ? new Date(value) : null;
    return d && !Number.isNaN(d.valueOf()) ? d.toLocaleDateString("fr-SN") : "—";
  }, []);

  // Normalisation des statuts
  const normalizeStatus = useCallback((raw) => {
    if (!raw) return "preparation";
    const s = String(raw).toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
    if (["pending", "processing", "en_preparation", "preparation"].includes(s)) return "preparation";
    if (["shipped", "expediee", "expedie", "expedition"].includes(s)) return "expediee";
    if (["delivered", "livree", "livre"].includes(s)) return "livree";
    return "preparation";
  }, []);

  // Normalisation d'une commande
  const normalizeOrder = useCallback(
    (o) => {
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
      return {
        ...o,
        _id_norm: id,
        _date_norm: createdAt,
        _status_norm: status,
        _total_norm: total,
        _customer_norm: customer,
      };
    },
    [normalizeStatus]
  );

  // Cache local des commandes
  const ORDERS_CACHE_KEY = "orders:me";
  const saveOrdersCache = useCallback((data) => {
    try {
      localStorage.setItem(ORDERS_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
    } catch {}
  }, []);
  const loadOrdersCache = useCallback(() => {
    try {
      const raw = localStorage.getItem(ORDERS_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.data || null;
    } catch {
      return null;
    }
  }, []);

  // Chargement du profil + historique + connexions
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    async function load() {
      if (!user) {
        setLoading(false);
        return;
      }

      setErrMsg("");
      setLoading(true);

      try {
        // Profil
        const profileRes = await api.get("/api/users/profile", { signal: controller.signal });
        if (!alive) return;

        const serverUser = profileRes.data || {};
        setFormData({
          name: serverUser.name || user.name || "",
          email: serverUser.email || user.email || "",
          password: "",
        });

        // Historique des commandes (essaie plusieurs endpoints)
        try {
          const ordersRes = await tryGet(
            api,
            [
              "/api/orders/myorders",
              "/api/orders/mine",
              `/api/orders/user/${serverUser._id || user._id}`,
            ],
            { signal: controller.signal }
          );

          let ordersData = ordersRes?.data;
          if (!Array.isArray(ordersData) && Array.isArray(ordersData?.orders)) {
            ordersData = ordersData.orders;
          }
          if (!Array.isArray(ordersData)) ordersData = [];

          const normalized = ordersData
            .filter(Boolean)
            .map(normalizeOrder)
            .sort((a, b) => new Date(b._date_norm || 0) - new Date(a._date_norm || 0));

          if (alive) {
            setHistory(normalized);
            saveOrdersCache(normalized);
          }
        } catch {
          if (alive) {
            const cached = loadOrdersCache();
            if (cached) setHistory(cached);
            else setHistory([]);
          }
        }

        // Nombre de connexions (multi endpoints)
        try {
          const connRes = await tryGet(
            api,
            [
              "/api/users/profile/connections",
              `/api/users/${serverUser._id || user._id}/connections`,
              "/api/users/connections",
            ],
            { signal: controller.signal }
          );
          if (alive) {
            const count =
              typeof connRes.data === "number"
                ? connRes.data
                : connRes.data?.count ?? connRes.data?.connections ?? 0;
            setConnectionCount(Number(count) || 0);
          }
        } catch {
          if (alive) {
            const fallbackCount =
              profileRes.data?.connectionCount ??
              profileRes.data?.loginCount ??
              user?.connectionCount ??
              user?.loginCount ??
              0;
            setConnectionCount(Number(fallbackCount) || 0);
          }
        }
      } catch (e) {
        const status = e?.response?.status;
        if (status === 401 || status === 403) {
          setErrMsg("Session expirée. Veuillez vous reconnecter.");
          logout?.();
        } else if (status === 404) {
          setErrMsg("Endpoint introuvable (404). Vérifiez les routes du backend.");
        } else {
          setErrMsg(e?.response?.data?.message || e?.message || "Erreur inconnue.");
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
      controller.abort();
    };
  }, [api, user, logout, normalizeOrder, loadOrdersCache, saveOrdersCache]);

  // Handlers formulaire
  const handleChange = (e) =>
    setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));

  const handleUpdate = async () => {
    if (!user) return;
    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
    };
    if (formData.password.trim().length >= 6) {
      payload.password = formData.password.trim();
    }

    try {
      await api.put("/api/users/profile", payload);
      alert("✅ Infos mises à jour avec succès !");
      setEditMode(false);
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        alert("🔒 Non autorisé. Veuillez vous reconnecter.");
        logout?.();
      } else if (status === 404) {
        alert("❌ Route introuvable (/api/users/profile).");
      } else {
        alert(`❌ Échec : ${e?.response?.data?.message || e?.message}`);
      }
    }
  };

  const handleReset = () => {
    setFormData({ name: user?.name || "", email: user?.email || "", password: "" });
    alert("🔁 Infos réinitialisées.");
  };

  const handlePrint = () => window.print();

  if (!user) {
    return (
      <div className="bg-gray-100 dark:bg-gray-900 min-h-screen flex items-center justify-center text-gray-700 dark:text-gray-200">
        <p className="text-lg font-medium">⛔ Vous n'êtes pas connecté.</p>
      </div>
    );
  }

  const { photo, isAdmin, privilege } = user;
  const { name, email } = formData;

  // UI principal
  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
      <div className="max-w-xl mx-auto p-6 text-gray-800 dark:text-gray-100">
        <h1 className="text-3xl font-bold mb-6 text-cyan-700 dark:text-cyan-400">👤 Mon Profil</h1>

        {loading && <div className="text-sm mb-4">Chargement du profil...</div>}
        {errMsg && <div className="text-sm text-red-600 dark:text-red-400 mb-4">{errMsg}</div>}

        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded shadow p-6 flex flex-col items-center text-sm">
          {photo ? (
            <img src={photo} alt="Photo de profil" className="w-24 h-24 rounded-full mb-4 object-cover border" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-300 dark:bg-gray-700 mb-4 flex items-center justify-center">
              <span className="text-xl">👤</span>
            </div>
          )}

          {!editMode ? (
            <>
              <p className="mb-2">
                <span className="font-semibold">Nom :</span> {name || "—"}
              </p>
              <p className="mb-2">
                <span className="font-semibold">Email :</span> {email || "—"}
              </p>
            </>
          ) : (
            <>
              <input
                name="name"
                value={name}
                onChange={handleChange}
                className="mb-2 px-2 py-1 rounded text-black w-full"
                placeholder="Nom"
              />
              <input
                name="email"
                value={email}
                onChange={handleChange}
                className="mb-2 px-2 py-1 rounded text-black w-full"
                placeholder="Email"
              />
              <input
                name="password"
                value={formData.password}
                onChange={handleChange}
                type="password"
                className="mb-2 px-2 py-1 rounded text-black w-full"
                placeholder="Nouveau mot de passe (min 6)"
              />
            </>
          )}

          {isAdmin && (
            <p className="mb-2">
              <span className="font-semibold">Rôle :</span> 👑 Admin
            </p>
          )}

          {privilege && (
            <div className="mb-4 w-full">
              <p className="font-semibold mb-2">🔐 Privilèges :</p>
              <ul className="list-disc pl-5 text-xs">
                {privilege.canAdd && <li>➕ Ajouter du contenu</li>}
                {privilege.canEdit && <li>✏️ Modifier du contenu</li>}
                {privilege.canDelete && <li>🗑️ Supprimer du contenu</li>}
                {privilege.canHideSection && <li>🙈 Cacher certaines sections</li>}
                {!privilege.canAdd &&
                  !privilege.canEdit &&
                  !privilege.canDelete &&
                  !privilege.canHideSection && <li>Aucun privilège attribué</li>}
              </ul>
            </div>
          )}

          <p className="text-xs mb-4">
            🕓 Nombre de connexions : <span className="font-bold">{connectionCount}</span>
          </p>

          <div className="w-full text-left mb-4">
            <p className="font-semibold mb-2">📜 Historique des commandes :</p>
            {history.length === 0 ? (
              <p className="text-xs">Aucune commande passée.</p>
            ) : (
              <ul className="list-disc pl-5 text-xs">
                {history.map((order) => {
                  const id =
                    order._id_norm ||
                    order._id ||
                    order.orderId ||
                    order.id ||
                    order.number ||
                    Math.random().toString(36).slice(2);

                  const dateValue = order._date_norm || order.date || order.createdAt || order.updatedAt;
                  const dateLabel = formatDate(dateValue);

                  return (
                    <li key={id} className="mb-1">
                      🧾 Commande #{id} – {dateLabel}{" "}
                      {id && (
                        <Link
                          to={`/mes-commandes/${id}`}
                          state={{ order }}
                          className="text-indigo-600 hover:underline"
                        >
                          Voir le détail →
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded"
              disabled={loading}
            >
              ✏️ Modifier mes infos
            </button>
          ) : (
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={handleUpdate}
                className="bg-green-600 hover:bg-green-700 text-white text-xs px-4 py-2 rounded"
              >
                💾 Enregistrer
              </button>
              <button
                onClick={handleReset}
                className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-4 py-2 rounded"
              >
                🔁 Réinitialiser
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white text-xs px-4 py-2 rounded"
              >
                Annuler
              </button>
            </div>
          )}

          <button
            onClick={handlePrint}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2 rounded"
          >
            Imprimer
          </button>
        </div>
      </div>
    </div>
  );
}
