// models/userModel.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 12;
// 60 chars totaux, 53 après le coût
const BCRYPT_REGEX = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom est requis'],
      trim: true,
      minlength: 2,
    },
    email: {
      type: String,
      required: [true, 'L’email est requis'],
      // IMPORTANT: pas de "unique: true" ici pour éviter le doublon d'index
      lowercase: true,
      trim: true,
      match: [/.+@.+\..+/, 'Format d’email invalide'],
    },
    // Hash bcrypt actuel (ne PAS rendre required ici, on gère dans les hooks)
    passwordHash: {
      type: String,
      select: false,
    },
    // Ancien champ hérité, conservé pour migration douce
    password: {
      type: String,
      select: false,
      required: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    loginCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Index unique email (définition centralisée pour éviter les doublons)
userSchema.index({ email: 1 }, { unique: true });

// Définir un mot de passe (hash inside, sans trim)
userSchema.methods.setPassword = async function (plain) {
  if (typeof plain !== 'string' || !plain) {
    throw new Error('Mot de passe invalide');
  }
  this.passwordHash = await bcrypt.hash(plain, BCRYPT_ROUNDS);

  // Nettoyage éventuel de l’ancien champ
  if (typeof this.password !== 'undefined') {
    this.password = undefined;
  }
};

// Comparer un mot de passe (fallback legacy si passwordHash absent)
// Attention: nécessite que le doc ait été chargé avec select('+passwordHash +password')
userSchema.methods.validatePassword = function (plain) {
  const hash = this.passwordHash || this.password;
  if (!hash || typeof plain !== 'string') return Promise.resolve(false);
  return bcrypt.compare(plain, hash);
};

// Helper: trouver par email avec les secrets (utile pour le login)
userSchema.statics.findByEmailWithSecrets = function (email) {
  if (typeof email !== 'string') return this.findOne({ email: null });
  const normalized = email.toLowerCase().trim();
  return this.findOne({ email: normalized }).select('+passwordHash +password');
};

// Hooks de normalisation et migration
userSchema.pre('save', async function (next) {
  try {
    // Normalisation email
    if (this.isModified('email') && typeof this.email === 'string') {
      this.email = this.email.toLowerCase().trim();
    }

    // Synchroniser isAdmin avec role
    if (this.isModified('role')) {
      this.isAdmin = this.role === 'admin';
    }

    // MIGRATION/INITIALISATION:
    // - Si un ancien champ "password" existe et pas de passwordHash → basculer
    if (this.password && !this.passwordHash) {
      if (BCRYPT_REGEX.test(this.password)) {
        // Déjà hashé (ancien schéma) → copier tel quel
        this.passwordHash = this.password;
      } else {
        // Clair → hasher
        this.passwordHash = await bcrypt.hash(this.password, BCRYPT_ROUNDS);
      }
      this.password = undefined;
    }

    // - Si on a directement reçu un passwordHash en clair par erreur → hasher
    if (this.isModified('passwordHash') && this.passwordHash && !BCRYPT_REGEX.test(this.passwordHash)) {
      this.passwordHash = await bcrypt.hash(this.passwordHash, BCRYPT_ROUNDS);
    }

    // À la création, exiger un secret (passwordHash ou password migré)
    if (this.isNew && !this.passwordHash) {
      return next(new Error('Le mot de passe est requis'));
    }

    next();
  } catch (err) {
    next(err);
  }
});

// Gestion des updates via findOneAndUpdate
userSchema.pre('findOneAndUpdate', async function (next) {
  try {
    const update = this.getUpdate() || {};
    const $set = update.$set || { ...update };

    // Normalisation email
    if (typeof $set.email === 'string') {
      $set.email = $set.email.toLowerCase().trim();
    }

    // Sync isAdmin si role changé
    if (typeof $set.role !== 'undefined' && typeof $set.isAdmin === 'undefined') {
      $set.isAdmin = $set.role === 'admin';
    }

    // Si l’ancien champ "password" est fourni → migrer
    if ($set.password) {
      if (BCRYPT_REGEX.test($set.password)) {
        $set.passwordHash = $set.password;
      } else {
        $set.passwordHash = await bcrypt.hash($set.password, BCRYPT_ROUNDS);
      }
      delete $set.password;
    }

    // Si passwordHash fourni en clair → hasher
    if ($set.passwordHash && !BCRYPT_REGEX.test($set.passwordHash)) {
      $set.passwordHash = await bcrypt.hash($set.passwordHash, BCRYPT_ROUNDS);
    }

    // Réinjecter l’update
    if (update.$set) {
      update.$set = $set;
      this.setUpdate(update);
    } else {
      this.setUpdate($set);
    }

    next();
  } catch (err) {
    next(err);
  }
});

// Projection sûre
userSchema.methods.toSafeJSON = function () {
  const { _id, name, email, role, isAdmin, createdAt, updatedAt, loginCount } = this.toObject();
  return { _id, name, email, role, isAdmin, createdAt, updatedAt, loginCount };
};

const User = mongoose.model('User', userSchema);
export default User;
