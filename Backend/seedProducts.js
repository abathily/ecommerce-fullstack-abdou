require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

async function insertTestProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connexion MongoDB réussie');

    const products = [
      {
        name: 'Samsung Galaxy A14',
        model: 'A14',
        brand: 'Samsung',
        image: 'https://images.samsung.com/is/image/samsung/p6pim/galaxy-a14/gallery/galaxy-a14.png',
        description: 'Smartphone économique avec bonnes performances',
        category: 'Smartphones',
        subcategory: 'Android',
        price: 199,
        stock: 20
      },
      {
        name: 'Shampoing Kerastase Nutritive',
        model: 'Nutritive',
        brand: 'Kerastase',
        image: 'https://www.kerastase.fr/dw/image/v2/BJNM_PRD/on/demandware.static/-/Sites-kerastase-master-catalog/default/dwf1566271/images/PACKSHAMPOO/3474636803725.jpg',
        description: 'Shampoing nourrissant pour cheveux secs',
        category: 'Soins',
        subcategory: 'Shampoings',
        price: 25,
        stock: 50
      },
      {
        name: 'iPhone 14 Pro Max',
        model: '14 Pro Max',
        brand: 'Apple',
        image: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-14-pro-max-gold',
        description: 'Smartphone haut de gamme avec caméra puissante',
        category: 'Smartphones',
        subcategory: 'iPhone',
        price: 899,
        stock: 15
      },
      {
        name: 'Casque Bluetooth Sony WH-1000XM5',
        model: 'WH-1000XM5',
        brand: 'Sony',
        image: 'https://cdn.sony.com/image/WH-1000XM5-product-image.jpg',
        description: 'Casque à réduction de bruit active',
        category: 'Accessoires',
        subcategory: 'Audio',
        price: 299,
        stock: 10
      },
      {
        name: 'Sérum L’Oréal Revitalift',
        model: 'Revitalift',
        brand: 'L’Oréal',
        image: 'https://loreal-paris.fr/images/revitalift-serum.png',
        description: 'Sérum anti-âge pour peau mature',
        category: 'Soins',
        subcategory: 'Visage',
        price: 40,
        stock: 30
      }
    ];

    // 🔁 Supprimer les doublons existants avant insertion
    const names = products.map(p => p.name);
    await Product.deleteMany({ name: { $in: names } });

    await Product.insertMany(products);
    console.log(`✅ ${products.length} produits insérés avec succès`);
  } catch (error) {
    console.error('❌ Erreur insertion produits :', error.message);
  } finally {
    mongoose.disconnect();
  }
}

insertTestProducts();
