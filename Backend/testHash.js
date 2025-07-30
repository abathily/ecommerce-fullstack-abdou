import bcrypt from "bcryptjs";

const motDePasse = "Idi123@";

// Génération d’un nouveau hash
bcrypt.genSalt(10, (err, salt) => {
  bcrypt.hash(motDePasse, salt, async (err, hash) => {
    console.log("💾 Nouveau hash :", hash);

    // Comparaison avec le même mot de passe
    const match = await bcrypt.compare(motDePasse, hash);
    console.log("✅ Comparaison :", match ? "✔️ correspondance" : "❌ pas de correspondance");
  });
});
