import { useState } from "react";
import { Label, TextInput, Button, Toast } from "flowbite-react";
import axios from "axios";

export default function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");
  const [message, setMessage] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/api/admin/reset-password", {
        email,
        nouveauMotDePasse
      });
      setMessage(res.data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || "Erreur inattendue.");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-semibold mb-4">🔐 Réinitialiser mot de passe</h2>
      <form onSubmit={handleReset}>
        <div className="mb-4">
          <Label htmlFor="email" value="Email utilisateur" />
          <TextInput
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="exemple@mail.com"
          />
        </div>
        <div className="mb-4">
          <Label htmlFor="password" value="Nouveau mot de passe" />
          <TextInput
            id="password"
            type="password"
            value={nouveauMotDePasse}
            onChange={(e) => setNouveauMotDePasse(e.target.value)}
            required
            placeholder="Mot de passe sécurisé"
          />
        </div>
        <Button type="submit" color="purple">
          Réinitialiser
        </Button>
      </form>
      {message && (
        <Toast className="mt-4" style={{ backgroundColor: "#f0f0f0" }}>
          <span>{message}</span>
        </Toast>
      )}
    </div>
  );
}
