import Order from "../models/Order.js";
import Product from "../models/Product.js";
import nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";

// ✅ Créer une commande (connecté ou invité)
export const placeOrder = async (req, res) => {
  try {
    const {
      products = [],
      address = "",
      phone = "",
      name = "",
      email = ""
    } = req.body;

    console.log("📦 Requête reçue :", { products, address, phone, name, email });

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
      date: new Date()
    });

    // 📧 Envoi email
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.MAIL_USER || "demo@mail.com",
          pass: process.env.MAIL_PASS || "demoPass"
        }
      });

      const mailOptions = {
        from: process.env.MAIL_USER || "demo@mail.com",
        to: email,
        subject: "🛍️ Confirmation de commande – Boutique Africaine",
        html: `
          <h2>Bonjour ${name},</h2>
          <p>Commande <strong>#${orderId}</strong> enregistrée avec succès.</p>
          <p><strong>Total :</strong> ${Number(total).toLocaleString()} FCFA</p>
          <p><strong>Adresse :</strong> ${address}</p>
          <p><strong>Date :</strong> ${new Date().toLocaleString()}</p>
          <p>📦 Votre commande est en cours de préparation.</p>
          <hr />
          <p style="font-style: italic;">« Le fleuve fait des détours, mais n’oublie jamais sa destination. »</p>
          <p>— Boutique Africaine</p>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log("✅ Email envoyé à", email);
    } catch (emailError) {
      console.warn("⚠️ Email non envoyé :", emailError.message);
    }

    res.status(201).json({
      message: "Commande enregistrée.",
      orderId,
      rejected: rejectedItems.length > 0 ? rejectedItems : undefined
    });
  } catch (err) {
    console.error("🚨 Erreur complète serveur :", err);
    res.status(500).json({
      message: "Erreur serveur interne. Veuillez vérifier les logs pour plus de détails.",
      debug: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
  }
};

// ✅ Commandes personnelles
export const getMyOrders = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Authentification requise." });
    }

    const orders = await Order.find({ user: req.user._id }).sort({ date: -1 })
      .populate("products.productId");

    res.json(orders);
  } catch (err) {
    console.error("🚨 Erreur récupération commandes :", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ✅ Vue admin : toutes les commandes
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ date: -1 })
      .populate("user", "name email")
      .populate("products.productId");

    res.json(orders);
  } catch (err) {
    console.error("🚨 Erreur admin commandes :", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ✅ Admin : mise à jour du statut
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("user", "name email");

    if (!order) {
      return res.status(404).json({ message: "Commande non trouvée." });
    }

    res.json(order);
  } catch (err) {
    console.error("🚨 Erreur mise à jour commande :", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};
