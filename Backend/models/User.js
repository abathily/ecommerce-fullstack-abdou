const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    // 🧍 Nom complet
    name: {
      type: String,
      required: [true, 'Le nom est requis'],
      trim: true,
      minlength: 2,
      set: val => val.trim()
    },

    // 📧 Adresse email
    email: {
      type: String,
      required: [true, 'L’email est requis'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/.+@.+\..+/, 'Format d’email invalide'],
      set: val => val.trim()
    },

    // 🔒 Mot de passe
    password: {
      type: String,
      required: [true, 'Le mot de passe est requis'],
      minlength: 6
    },

    // 🛡️ Admin ou non
    isAdmin: {
      type: Boolean,
      default: false
    },

    // 🖼️ URL image de profil
    image: {
      type: String,
      default: '',
      set: val => val.trim()
    }
  },
  {
    timestamps: true
  }
);

// 🔐 Hachage du mot de passe avant sauvegarde
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// 🔍 Méthode pour vérifier le mot de passe
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// 🧾 Export du modèle
module.exports = mongoose.model('User', userSchema);
