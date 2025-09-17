import express from "express";
import {
  placeOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  placePayment,
  getOrderById
} from "../controllers/orderController.js";

import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

/* --------------------------------------------------
    Commandes - Public & Utilisateur
---------------------------------------------------*/

// 🛒 Créer une commande (invité ou connecté)
router.post("/checkout", placeOrder);

// 💳 Valider le paiement d'une commande
router.post("/:id/pay", placePayment);

// 📦 Récupérer une commande spécifique (pour reçu)
router.get("/:id", getOrderById);

// 📋 Récupérer mes commandes (utilisateur connecté)
router.get("/my-orders", protect, getMyOrders);

/* --------------------------------------------------
    Commandes - Accès Admin
---------------------------------------------------*/

// 📋 Voir toutes les commandes
router.get("/", protect, adminOnly, getAllOrders);

// 🔄 Mettre à jour le statut d'une commande
router.put("/:id", protect, adminOnly, updateOrderStatus);

export default router;
