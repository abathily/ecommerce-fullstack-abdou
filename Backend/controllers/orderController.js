import Order from "../models/Order.js";
import Product from "../models/Product.js";
import nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";

// 🛒 Créer une commande
export const placeOrder = async (req, res) => {
  try {
    const {
      products = [],
      address = "",
      phone = "",
      name = "",
      email = ""
    } = req.body;

    const requiredFields = [address.trim(), phone.trim(), name.trim(), email.trim()];
    if (products.length === 0 || requiredFields.some(field => !field)) {
      return res.status(400).json({ message: "Certains champs sont manquants ou invalides." });
    }

    let total = 0;
    const validItems = [];
    const rejectedItems = [];

    for (const item of products) {
      const { productId, quantity } = item;

      if (!productId || !mongoose.Types.ObjectId.isValid(productId) || quantity <= 0) {
        rejectedItems.push({ ...item, reason: "Produit ou quantité invalide." });
        continue;
      }

      const product = await Product.findById(productId);
      if (!product) {
        rejectedItems.push({ ...item, reason: "Produit introuvable." });
        continue;
      }

      if (product.stock < quantity) {
        rejectedItems.push({
          productId,
          name: product.name,
          quantityRequested: quantity,
          stockAvailable: product.stock,
          reason: "Pas de stock pour le moment."
        });
        continue;
      }

      product.stock -= quantity;
      await product.save();

      total += product.price * quantity;

      validItems.push({
        productId: product._id,
        quantity
      });
    }

    if (validItems.length === 0) {
      return res.status(404).json({
        message: "Tous les produits du panier sont invalides ou en rupture de stock.",
        rejected: rejectedItems
      });
    }

    const orderId = uuidv4();

    const order = await Order.create({
      orderId,
      user: req.user?._id || null,
      name: name.trim(),
      email: email.trim(),
      address: address.trim(),
      phone: phone.trim(),
      products: validItems,
      total,
      status: "Pending",
      isPaid: false,
      date: new Date()
    });

    // 📧 Email de confirmation
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.MAIL_USER || "demo@mail.com",
          pass: process.env.MAIL_PASS || "demoPass"
        }
      });

      await transporter.sendMail({
        from: process.env.MAIL_USER || "demo@mail.com",
        to: email,
        subject: "Confirmation de commande - O'Sakha",
        html: `
          <h2>Merci pour votre commande !</h2>
          <p>Commande #${order.orderId}</p>
          <p>Total : ${order.total} CFA</p>
          <p>Adresse : ${order.address}</p>
          <p>Nous vous contacterons pour la livraison.</p>
        `
      });
    } catch (err) {
      console.warn("⚠️ Email non envoyé :", err?.message || err);
    }

    res.status(201).json({ success: true, order });
  } catch (err) {
    console.error("❌ Erreur création commande :", err?.message || err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// 💳 Valider le paiement
export const placePayment = async (req, res) => {
  const { id } = req.params;
  const { name, email, cardNumber } = req.body;

  try {
    const order = await Order.findOne({ orderId: id });
    if (!order) return res.status(404).json({ message: "Commande introuvable" });

    order.isPaid = true;
    order.paidAt = new Date();
    order.status = "Paid";
    await order.save();

    // 📧 Reçu de paiement
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.MAIL_USER || "demo@mail.com",
          pass: process.env.MAIL_PASS || "demoPass"
        }
      });

      await transporter.sendMail({
        from: process.env.MAIL_USER || "demo@mail.com",
        to: email,
        subject: "Reçu de paiement - O'Sakha",
        html: `
          <h2>Reçu de commande</h2>
          <p>Commande #${order.orderId}</p>
          <p>Total payé : ${order.total} CFA</p>
          <p>Date : ${new Date(order.paidAt).toLocaleString()}</p>
          <p>Merci pour votre achat chez O'Sakha !</p>
        `
      });
    } catch (err) {
      console.warn("⚠️ Reçu non envoyé :", err?.message || err);
    }

    res.json({ success: true, message: "Paiement validé", order });
  } catch (err) {
    console.error("❌ Erreur paiement :", err?.message || err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// 📄 Récupérer une commande spécifique
export const getOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await Order.findOne({ orderId: id }).populate("products.productId", "name price");

    if (!order) {
      return res.status(404).json({ message: "Commande introuvable" });
    }

    res.json(order);
  } catch (err) {
    console.error("❌ Erreur récupération commande :", err?.message || err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// 📋 Voir toutes les commandes (admin)
export const getAllOrders = async (_req, res) => {
  try {
    const orders = await Order.find({})
      .populate("products.productId", "name price")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error("❌ Erreur récupération commandes :", err?.message || err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// 🔄 Mettre à jour le statut d'une commande (admin)
export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const order = await Order.findOne({ orderId: id });
    if (!order) return res.status(404).json({ message: "Commande introuvable" });

    order.status = status || order.status;
    await order.save();

    res.json({ success: true, message: "Statut mis à jour", order });
  } catch (err) {
    console.error("❌ Erreur mise à jour statut :", err?.message || err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// 📦 Récupérer les commandes de l'utilisateur connecté
export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Utilisateur non authentifié" });

    const orders = await Order.find({ user: userId })
      .populate("products.productId", "name price")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error("❌ Erreur récupération commandes utilisateur :", err?.message || err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
