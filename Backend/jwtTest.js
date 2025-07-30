require('dotenv').config();
const jwt = require('jsonwebtoken');

const sampleUser = {
  id: '64a7c880726401c712fbe4a0',
  email: 'admin@example.com',
  isAdmin: true
};

const token = jwt.sign(sampleUser, process.env.JWT_SECRET, { expiresIn: '1h' });

console.log(' Token généré :');
console.log(token);

// 🔎 Test de vérification
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log(' Décodage réussi :');
  console.log(decoded);
} catch (err) {
  console.error(' Erreur de vérification :', err);
}
