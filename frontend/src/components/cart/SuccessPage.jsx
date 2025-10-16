import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

function SuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_URL = "https://projet-bloc3.onrender.com";

  useEffect(() => {
    if (!sessionId) {
      alert("Session Stripe manquante.");
      navigate("/public-events");
    }
  }, [sessionId, navigate]);

  const handleSendTicket = async () => {
    if (!email) {
      alert("Veuillez entrer une adresse email valide.");
      return;
    }

    setLoading(true);
    setStatus("Envoi du billet...");

    try {
      const response = await fetch(
        `${API_URL}/api/send-ticket?sessionId=${sessionId}&email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) throw new Error("Erreur lors de l'envoi du billet.");
      const result = await response.text();
      setStatus(result);
    } catch (error) {
      console.error(error);
      setStatus("❌ Échec de l'envoi du billet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "30px", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
      <h2>🎉 Paiement réussi !</h2>
      <p>Votre paiement a été validé. Entrez votre email pour recevoir vos billets :</p>

      <input
        type="email"
        placeholder="Votre email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "6px",
          border: "1px solid #ccc",
          marginBottom: "10px",
        }}
      />

      <button
        onClick={handleSendTicket}
        disabled={loading}
        style={{
          padding: "10px 20px",
          border: "none",
          borderRadius: "6px",
          backgroundColor: "#16a34a",
          color: "#fff",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        {loading ? "Envoi en cours..." : "Envoyer le billet"}
      </button>

      {status && (
        <p style={{ marginTop: "15px", color: status.startsWith("❌") ? "red" : "green" }}>
          {status}
        </p>
      )}
    </div>
  );
}

export default SuccessPage;
