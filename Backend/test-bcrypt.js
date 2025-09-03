import bcrypt from "bcrypt";

// 🔐 Valeur que tu tapes dans le frontend
const motDePasseTape = "Drissa123@";

// 💾 Valeur qui est stockée dans MongoDB
const hashStocke = "$2b$10$H4CRXU6SSQXiIAIBvQDy6.rhxLD336/ca9DMNvC5rP51WqQDeShF2";

const test = async () => {
  const match = await bcrypt.compare(motDePasseTape, hashStocke);
  console.log("🔍 Résultat comparaison :", match);
};

test();
