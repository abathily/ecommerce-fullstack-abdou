const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const orderSchema = new mongoose.Schema({
  // 👤 Utilisateur (optionnel si commande invitée)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },

  // 📦 Identifiant unique de commande
  orderId: {
    type: String,
    required: true,
    unique: true,
    default: uuidv4
  },

  // 🧍 Nom du client
  name: {
    type: String,
    required: true,
    set: val => val.trim()
  },

  // 📧 Email du client
  email: {
    type: String,
    required: true,
    set: val => val.trim().toLowerCase()
  },

  // 🛒 Produits commandés
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      }
    }
  ],

  // 💰 Total de la commande
  total: {
    type: Number,
    required: true,
    min: 0
  },

  // 🏠 Adresse de livraison
  address: {
    type: String,
    required: true,
    set: val => val.trim()
  },

  // 📞 Téléphone du client
  phone: {
    type: String,
    required: true,
    set: val => val.trim()
  },

  // 📦 Statut
  status: {
    type: String,
    enum: ['Pending', 'Valide', 'Pas valide'],
    default: 'Pending'
  }

}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
