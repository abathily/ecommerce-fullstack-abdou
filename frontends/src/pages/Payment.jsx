// src/pages/Payment.jsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

export default function Payment() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const orderId = state?.orderId;

  const [cardNumber, setCardNumber] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handlePay = async () => {
    try {
      const { data } = await axios.post(`${API_BASE}/api/orders/${orderId}/pay`, {
        cardNumber,
        name,
        email,
      });

      if (data.success) {
        navigate("/receipt", { state: { orderId } });
      }
    } catch (err) {
      console.error("Erreur paiement :", err);
    }
  };

  return (
    <section className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Paiement</h2>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom" />
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="Carte bancaire" />
      <button onClick={handlePay}>Valider le paiement</button>
    </section>
  );
}
