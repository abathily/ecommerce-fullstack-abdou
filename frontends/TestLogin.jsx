import React, { useState } from "react";

const TestLogin = () => {
  const [email, setEmail] = useState("admin@osakha.com");
  const [password, setPassword] = useState("Admin@2025");
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include", // si tu utilises des cookies
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erreur inconnue");
      }

      setResponse(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      setResponse(null);
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Test de connexion API</h2>
      <button onClick={handleLogin}>Tester /api/users/login</button>
      {response && <pre>{JSON.stringify(response, null, 2)}</pre>}
      {error && <p style={{ color: "red" }}>❌ {error}</p>}
    </div>
  );
};

export default TestLogin;
