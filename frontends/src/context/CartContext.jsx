import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // Ajouter un produit
  const addToCart = (product) => {
    setCart((prevCart) => {
      const exists = prevCart.find((item) => item._id === product._id);
      if (exists) {
        return prevCart.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  // Retirer un produit
  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item._id !== id));
  };

  // Vider le panier
  const clearCart = () => {
    setCart([]);
  };

  // ✅ Mettre à jour la quantité (➕ ➖)
  const updateQuantity = (id, newQty) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item._id === id
          ? {
              ...item,
              quantity: Math.max(1, newQty), // Empêche de descendre sous 1
            }
          : item
      )
    );
  };

  // 💾 Persistance via localStorage (optionnel)
  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, clearCart, updateQuantity }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
