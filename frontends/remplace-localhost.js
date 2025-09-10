// remplace-localhost.js
import fs from 'fs';
import path from 'path';

const dossier = './src';
const ancienURL = 'http://localhost:5000';
const nouveauURL = 'https://ecommerce-fullstack-abdou.onrender.com';

function remplacerDansFichier(fichier) {
  const contenu = fs.readFileSync(fichier, 'utf8');
  if (contenu.includes(ancienURL)) {
    const nouveauContenu = contenu.replaceAll(ancienURL, nouveauURL);
    fs.writeFileSync(fichier, nouveauContenu, 'utf8');
    console.log(`✅ Modifié : ${fichier}`);
  }
}

function parcourirDossier(dossier) {
  fs.readdirSync(dossier).forEach((fichier) => {
    const chemin = path.join(dossier, fichier);
    const stats = fs.statSync(chemin);

    if (stats.isDirectory()) {
      parcourirDossier(chemin);
    } else if (chemin.endsWith('.js') || chemin.endsWith('.jsx')) {
      remplacerDansFichier(chemin);
    }
  });
}

parcourirDossier(dossier);
console.log('🎉 Remplacement terminé !');
