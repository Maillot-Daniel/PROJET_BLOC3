import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import QRCode from "qrcode";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function SuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [billets, setBillets] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [statut, setStatut] = useState("");
  const [totalStripe, setTotalStripe] = useState("0.00");

  const CLE_STOCKAGE = "oly_billets";
  const URL_API = "https://projet-bloc3.onrender.com";

  // --- QR Code unique pour chaque billet
  const genererQRCodeUnique = useCallback(async (numeroBillet, evenement, index) => {
    try {
      const contenuQR = JSON.stringify({
        idBillet: numeroBillet,
        evenement: evenement.eventTitle || evenement.nom || "Événement Olympique",
        type: evenement.offerType || evenement.type || "Standard",
        date: evenement.eventDate || evenement.date || "2024",
        lieu: evenement.eventLocation || evenement.lieu || "Paris",
        prix: evenement.prix || evenement.price || 0,
        numero: index + 1,
        horodatage: Date.now()
      });
      return await QRCode.toDataURL(contenuQR, {
        width: 150,
        margin: 1,
        color: { dark: "#0055A4", light: "#FFFFFF" },
      });
    } catch (erreur) {
      console.error("❌ Erreur QR Code:", erreur);
      return null;
    }
  }, []);

  // --- Sauvegarde localStorage
  const sauvegarderBillets = useCallback((nouveauxBillets) => {
    try {
      localStorage.setItem(CLE_STOCKAGE, JSON.stringify(nouveauxBillets));
      console.log("✅ Billets sauvegardés:", nouveauxBillets.length);
    } catch (erreur) {
      console.error("❌ Erreur sauvegarde:", erreur);
    }
  }, []);

  // --- Récup session Stripe
  const recupererSessionStripe = useCallback(async (sessionId) => {
    if (!sessionId) return null;
    try {
      const reponse = await fetch(`${URL_API}/api/pay/session/${sessionId}`);
      if (reponse.ok) {
        const donneesSession = await reponse.json();
        const totalReel = donneesSession.amount_total ? (donneesSession.amount_total / 100).toFixed(2) : "0.00";
        setTotalStripe(totalReel);
        return donneesSession;
      }
    } catch (erreur) {
      console.error("❌ Erreur Stripe:", erreur);
    }
    return null;
  }, [URL_API]);

  // --- Création billets réels
  const creerBilletsReels = useCallback(async (panier, numeroCommande) => {
    const billetsGeneres = [];
    let billetIndex = 0;

    for (const article of panier) {
      const quantite = article.quantite || article.quantity || 1;
      const prixUnitaire = article.prix || article.price || 0;

      for (let i = 0; i < quantite; i++) {
        billetIndex++;
        const numeroBillet = `${numeroCommande}-${billetIndex}`;
        const qrCode = await genererQRCodeUnique(numeroBillet, article, billetIndex);

        billetsGeneres.push({
          id: numeroBillet,
          eventId: article.eventId || 1,
          numeroCommande,
          numeroBillet: billetIndex,
          titreEvenement: article.eventTitle || article.nom || "Événement Olympique",
          lieuEvenement: article.eventLocation || article.lieu || "Paris",
          dateEvenement: article.eventDate || article.date || "2024",
          typeOffre: article.offerType || article.type || "Standard",
          quantite: 1,
          prix: prixUnitaire,
          total: prixUnitaire.toFixed(2),
          qrCode,
          dateAchat: new Date().toISOString(),
        });
      }
    }

    return billetsGeneres;
  }, [genererQRCodeUnique]);

  // --- Génération billets
  const genererBillets = useCallback(async () => {
    setStatut("Création de vos billets...");
    try {
      const panier = JSON.parse(localStorage.getItem("panier_olympiques") || "[]");
      const numeroCommande = "OLY-" + Date.now();

      let billetsGeneres = [];
      let montantFinal = "0.00";

      if (sessionId) {
        const sessionStripe = await recupererSessionStripe(sessionId);
        if (sessionStripe?.amount_total) {
          montantFinal = (sessionStripe.amount_total / 100).toFixed(2);
        }
      }

      if (panier.length > 0) {
        billetsGeneres = await creerBilletsReels(panier, numeroCommande);
        const totalPanier = billetsGeneres.reduce((sum, b) => sum + parseFloat(b.total), 0).toFixed(2);
        montantFinal = montantFinal !== "0.00" ? montantFinal : totalPanier;
        localStorage.removeItem("panier_olympiques");
      }

      setTotalStripe(montantFinal);
      setBillets(billetsGeneres);
      sauvegarderBillets(billetsGeneres);
      setStatut("Billets créés avec succès !");
      setChargement(false);
    } catch (erreur) {
      console.error("❌ Erreur:", erreur);
      setStatut("Erreur lors de la création des billets");
      setChargement(false);
    }
  }, [sessionId, recupererSessionStripe, creerBilletsReels, sauvegarderBillets]);

  // --- Envoyer tous les billets au backend
  const creerEtEnvoyerTicketsBackend = async () => {
    if (!billets.length) return;
    setStatut("Création et envoi des billets au backend...");

    try {
      for (const billet of billets) {
        const payload = {
          userId: 1,
          eventId: billet.eventId,
          offerTypeId: 1,
          quantity: billet.quantite,
          price: billet.prix,
        };
        await fetch(`${URL_API}/api/tickets/create-and-send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      setStatut("Tous les billets envoyés au backend !");
      setTimeout(() => setStatut(""), 3000);
    } catch (erreur) {
      console.error("❌ Erreur backend:", erreur);
      setStatut("Erreur lors de l'envoi au backend");
    }
  };

  // --- Télécharger PDF d’un billet
  const telechargerPDF = async (billet) => {
    const element = document.getElementById(`billet-${billet.id}`);
    if (!element) return;

    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: [canvas.width, canvas.height],
    });
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save(`billet-${billet.id}.pdf`);
  };

  // --- Télécharger tous les billets en PDF
  const telechargerTousPDF = async () => {
    for (const billet of billets) {
      await telechargerPDF(billet);
    }
  };

  // --- Imprimer un billet
  const imprimerBillet = (billet) => {
    const element = document.getElementById(`billet-${billet.id}`);
    if (!element) return;

    const printWindow = window.open("", "PRINT", "height=650,width=900,top=100,left=150");
    printWindow.document.write('<html><head><title>Billet</title></head><body>');
    printWindow.document.write(element.outerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  useEffect(() => { genererBillets(); }, [genererBillets]);

  if (chargement) {
    return (
      <div style={{ textAlign: "center", padding: 50 }}>
        <h2>{statut}</h2>
        <div style={{
          width: 50, height: 50,
          border: "5px solid #f3f3f3",
          borderTop: "5px solid #0055A4",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          margin: "0 auto",
        }}></div>
        <p>Préparation de vos billets...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", padding: 30, maxWidth: 800, margin: "0 auto" }}>
      <h1>🎉 Paiement Réussi !</h1>
      <p>Vous avez {billets.length} billet(s)</p>
      <p>Total payé: {totalStripe} €</p>

      <button
        onClick={creerEtEnvoyerTicketsBackend}
        style={{
          padding: 12,
          backgroundColor: "#FF9500",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          marginBottom: 20
        }}
      >
        💌 Enregistrer & Envoyer tous les billets
      </button>

      {billets.map((billet) => (
        <div key={billet.id} id={`billet-${billet.id}`} style={{
          border: "2px solid #0055A4",
          padding: 15,
          marginBottom: 15,
          borderRadius: 8,
          backgroundColor: "white"
        }}>
          <h3>🎫 {billet.titreEvenement}</h3>
          <p><strong>📍 Lieu:</strong> {billet.lieuEvenement}</p>
          <p><strong>📅 Date:</strong> {billet.dateEvenement}</p>
          <p><strong>🎯 Type:</strong> {billet.typeOffre}</p>
          <p><strong>🎟️ Place:</strong> {billet.numeroBillet}</p>
          <p><strong>💰 Prix total:</strong> {billet.total} €</p>
          <p><strong>📋 Commande:</strong> {billet.numeroCommande}</p>
          {billet.qrCode && <img src={billet.qrCode} alt="QR Code" style={{ width: 150, height: 150 }} />}
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 10 }}>
            <button onClick={() => telechargerPDF(billet)} style={{ padding: "8px 15px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}>📥 PDF</button>
            <button onClick={() => imprimerBillet(billet)} style={{ padding: "8px 15px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}>🖨️ Imprimer</button>
          </div>
        </div>
      ))}

      {billets.length > 1 && (
        <button
          onClick={telechargerTousPDF}
          style={{ padding: "12px 20px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: 6, cursor: "pointer", marginTop: 10 }}
        >
          📥 Télécharger tous les billets ({billets.length})
        </button>
      )}

      {statut && <p style={{ color: "#0055A4", fontStyle: "italic", marginTop: 15 }}>{statut}</p>}
    </div>
  );
}

export default SuccessPage;
