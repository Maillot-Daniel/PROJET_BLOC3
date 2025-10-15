import React, { useState } from "react";

function TicketEmailForm({ primaryKey }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL = "https://projet-bloc3.onrender.com";

  const handleSendTicket = async () => {
    if (!email) {
      alert("Veuillez entrer une adresse email valide.");
      return;
    }

    setLoading(true);
    setStatus("Envoi du billet...");

    try {
      const response = await fetch(`${API_URL}/api/send-ticket?primaryKey=${primaryKey}&email=${encodeURIComponent(email)}`, {
        method: "POST",
      });

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
    <div style={{ padding: "20px", marginTop: "30px", backgroundColor: "#f3f4f6", borderRadius: "10px" }}>
      <h3>Recevoir votre billet par email</h3>
      <input
        type="email"
        placeholder="Votre email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
      />
      <button
        onClick={handleSendTicket}
        disabled={loading}
        style={{ width: "100%", padding: "10px", backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}
      >
        {loading ? "Envoi en cours..." : "Envoyer le billet"}
      </button>
      {status && <p style={{ marginTop: "10px", color: status.startsWith("❌") ? "red" : "green" }}>{status}</p>}
    </div>
  );
}

export default TicketEmailForm;
