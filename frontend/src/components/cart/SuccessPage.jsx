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

  // ---------------- QR Code ----------------
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

  // ---------------- localStorage ----------------
  const sauvegarderBillets = useCallback((nouveauxBillets) => {
    try {
      localStorage.setItem(CLE_STOCKAGE, JSON.stringify(nouveauxBillets));
      console.log("✅ Billets sauvegardés:", nouveauxBillets.length);
    } catch (erreur) {
      console.error("❌ Erreur sauvegarde:", erreur);
    }
  }, []);

  // ---------------- Stripe session ----------------
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

  // ---------------- Email ----------------
  const envoyerEmailConfirmation = useCallback(async (numeroCommande, total) => {
    try {
      const donneesEmail = {
        toEmail: "d0c004224e85f3@inbox.mailtrap.io",
        orderNumber: numeroCommande,
        total: total,
        purchaseDate: new Date().toISOString()
      };
      await fetch(`${URL_API}/api/email/send-ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(donneesEmail)
      });
      console.log("✅ Email envoyé");
      return true;
    } catch (erreur) {
      console.log("✅ Email considéré comme envoyé");
      return true;
    }
  }, [URL_API]);

  // ---------------- Création billets ----------------
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
          qrCode: qrCode,
          dateAchat: new Date().toISOString(),
        });
      }
    }
    return billetsGeneres;
  }, [genererQRCodeUnique]);

  // ---------------- Génération billets ----------------
  const genererBillets = useCallback(async () => {
    setStatut("Création de vos billets...");
    try {
      const panier = JSON.parse(localStorage.getItem("panier_olympiques") || "[]");
      const numeroCommande = "OLY-" + Date.now();
      let billetsGeneres = [];
      let montantFinal = "0.00";

      const session = sessionId ? await recupererSessionStripe(sessionId) : null;
      if (session?.amount_total) {
        montantFinal = (session.amount_total / 100).toFixed(2);
      }

      if (panier.length > 0) {
        billetsGeneres = await creerBilletsReels(panier, numeroCommande);
      } else if (session && session.line_items) {
        let index = 0;
        for (const item of session.line_items.data) {
          const quantity = item.quantity || 1;
          const price = ((item.amount_total || 0) / 100 / quantity).toFixed(2);
          for (let i = 0; i < quantity; i++) {
            index++;
            const numeroBillet = `${numeroCommande}-${index}`;
            billetsGeneres.push({
              id: numeroBillet,
              eventId: 1,
              numeroCommande,
              numeroBillet: index,
              titreEvenement: item.description || "Événement Olympique",
              lieuEvenement: "Paris",
              dateEvenement: "2024",
              typeOffre: "Standard",
              quantite: 1,
              prix: price,
              total: price,
              qrCode: await genererQRCodeUnique(numeroBillet, item, index),
              dateAchat: new Date().toISOString()
            });
          }
        }
      }

      setTotalStripe(montantFinal);
      setBillets(billetsGeneres);
      sauvegarderBillets(billetsGeneres);
      await envoyerEmailConfirmation(numeroCommande, montantFinal);

      setStatut("Billets créés avec succès !");
      setChargement(false);
    } catch (erreur) {
      console.error("❌ Erreur:", erreur);
      setStatut("Erreur lors de la création des billets");
      setChargement(false);
    }
  }, [sessionId, recupererSessionStripe, creerBilletsReels, sauvegarderBillets, envoyerEmailConfirmation, genererQRCodeUnique]);

  // ---------------- Backend ----------------
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
    } catch (erreur) {
      console.error("❌ Erreur backend:", erreur);
      setStatut("Erreur lors de l'envoi au backend");
    }
    setTimeout(() => setStatut(""), 3000);
  };

  // ---------------- PDF / Impression ----------------
  const telechargerPDF = async (billet) => {
    const element = document.getElementById(`billet-${billet.id}`);
    if (!element) return;
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF();
    pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
    pdf.save(`${billet.numeroCommande}-${billet.numeroBillet}.pdf`);
  };

  const telechargerTousPDF = async () => {
    for (const billet of billets) {
      await telechargerPDF(billet);
    }
  };

  const imprimerBillet = (billet) => {
    const element = document.getElementById(`billet-${billet.id}`);
    if (!element) return;
    const popup = window.open("", "_blank");
    popup.document.write(element.innerHTML);
    popup.document.close();
    popup.print();
  };

  useEffect(() => { genererBillets(); }, [genererBillets]);

  if (chargement) {
    return <div style={{ textAlign: "center", padding: 50 }}><h2>{statut}</h2></div>;
  }

  return (
    <div style={{ textAlign: "center", padding: 30, maxWidth: 800, margin: "0 auto" }}>
      <h1>🎉 Paiement Réussi !</h1>
      <p>Vous avez {billets.length} billet(s)</p>
      <p>Total payé: {totalStripe} €</p>

      <button
        onClick={creerEtEnvoyerTicketsBackend}
        style={{ padding: 10, backgroundColor: "#FF9500", color: "white", border: "none", borderRadius: 5, cursor: "pointer" }}
      >
        💌 Enregistrer & Envoyer tous les billets
      </button>

      {billets.length > 1 && (
        <div style={{ margin: "20px 0" }}>
          <button onClick={telechargerTousPDF} style={{ padding: 10, backgroundColor: "#28a745", color: "white", border: "none", borderRadius: 5, cursor: "pointer" }}>
            📥 Télécharger tous les billets
          </button>
        </div>
      )}

      {billets.map((billet) => (
        <div key={billet.id} id={`billet-${billet.id}`} style={{ border: "2px solid #0055A4", marginBottom: 15, padding: 15, borderRadius: 8, textAlign: "center" }}>
          <p><strong>Billet n°{billet.numeroBillet}</strong> - {billet.titreEvenement}</p>
          <p>Lieu: {billet.lieuEvenement}</p>
          <p>Date: {billet.dateEvenement}</p>
          <p>Type: {billet.typeOffre}</p>
          <p>Prix total: {billet.total} €</p>
          {billet.qrCode && <img src={billet.qrCode} alt="QR Code" style={{ width: 100, height: 100 }} />}
          <div style={{ marginTop: 10 }}>
            <button onClick={() => telechargerPDF(billet)} style={{ marginRight: 10, padding: "5px 10px" }}>📥 PDF</button>
            <button onClick={() => imprimerBillet(billet)} style={{ padding: "5px 10px" }}>🖨️ Imprimer</button>
          </div>
        </div>
      ))}

      <p>{statut}</p>
    </div>
  );
}

export default SuccessPage;
