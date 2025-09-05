// src/pages/Cart.jsx
import { useMemo } from "react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { TrashIcon } from "@heroicons/react/24/outline";
import { PlusIcon, MinusIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export default function Cart() {
  const { cart, removeFromCart, clearCart, updateQuantity } = useCart();
  const navigate = useNavigate();

  const total = useMemo(
    () =>
      cart.reduce((acc, item) => {
        const price =
          typeof item.price === "number" ? item.price : Number(item.price) || 0;
        const qty =
          typeof item.quantity === "number"
            ? item.quantity
            : Number(item.quantity) || 1;
        return acc + price * qty;
      }, 0),
    [cart]
  );

  const fmt = (n) =>
    (Number(n) || 0).toLocaleString("fr-FR", { maximumFractionDigits: 0 }) +
    " CFA";

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("❌ Votre panier est vide.");
      return;
    }
    // Ne pas vider le panier ici. On redirige seulement.
    toast.success("✅ Commande validée, redirection…");
    navigate("/checkout");
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-950 px-6 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-cyan-700 dark:text-cyan-400 mb-6">
          🛒 Votre panier
        </h1>

        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-12 text-gray-600 dark:text-gray-300">
            <img src="/images/empty-cart.svg" alt="Panier vide" className="w-64 mb-6" />
            <p className="text-lg text-center">
              Votre panier est vide pour le moment.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {cart.map((item) => (
                <motion.div
                  key={item._id ?? item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="flex justify-between items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4 rounded-md shadow"
                >
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item._id ?? item.id,
                            Math.max(1, (item.quantity || 1) - 1)
                          )
                        }
                        disabled={(item.quantity || 1) === 1}
                        className="p-1 bg-gray-200 dark:bg-gray-800 rounded hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50"
                        aria-label="Diminuer la quantité"
                      >
                        <MinusIcon className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                      </button>
                      <span className="text-sm">
                        {item.quantity} ×{" "}
                        {fmt(
                          typeof item.price === "number"
                            ? item.price
                            : Number(item.price) || 0
                        )}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(
                            item._id ?? item.id,
                            (item.quantity || 1) + 1
                          )
                        }
                        className="p-1 bg-gray-200 dark:bg-gray-800 rounded hover:bg-gray-300 dark:hover:bg-gray-700"
                        aria-label="Augmenter la quantité"
                      >
                        <PlusIcon className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-300">
                      {fmt(
                        ((typeof item.price === "number"
                          ? item.price
                          : Number(item.price) || 0) *
                          (typeof item.quantity === "number"
                            ? item.quantity
                            : Number(item.quantity) || 1))
                      )}
                    </span>
                    <button
                      onClick={() => removeFromCart(item._id ?? item.id)}
                      className="flex items-center gap-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition"
                    >
                      <TrashIcon className="h-4 w-4" />
                      <span className="text-sm">Retirer</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <div className="flex justify-between items-center mt-6">
              <p className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                Total :{" "}
                <span className="text-cyan-700 dark:text-cyan-300">
                  {fmt(total)}
                </span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <button
                onClick={clearCart}
                className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition"
              >
                🧹 Vider le panier
              </button>

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className={`w-full sm:w-auto text-white px-4 py-2 rounded-md text-sm font-medium text-center transition ${
                  cart.length === 0
                    ? "bg-cyan-400 cursor-not-allowed"
                    : "bg-cyan-600 hover:bg-cyan-800"
                }`}
              >
                 Passer à la commande
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
