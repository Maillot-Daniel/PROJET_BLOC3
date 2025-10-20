import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import QRCode from "qrcode";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

function SuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [billets, setBillets] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [statut, setStatut] = useState("");
  const [totalStripe, setTotalStripe] = useState("0.00");

  const CLE_STOCKAGE = "oly_billets";
  const URL_API = "https://projet-bloc3.onrender.com";

  // Debug stockage local
  const debugStockageLocal = useCallback(() => {
    console.log("🔍 DEBUG Stockage Local:");
    console.log("🛒 panier_olympiques:", localStorage.getItem("panier_olympiques"));
    console.log("🎫 oly_billets:", localStorage.getItem(CLE_STOCKAGE));
    console.log("🔗 sessionId:", sessionId);

    try {
      const panier = JSON.parse(localStorage.getItem("panier_olympiques") || "[]");
      console.log("📊 CONTENU DU PANIER:", panier);
      console.log("🔢 Nombre d'articles dans le panier:", panier.length);
    } catch (erreur) {
      console.error("❌ Erreur analyse panier:", erreur);
    }
  }, [sessionId, CLE_STOCKAGE]);

  // Récup session Stripe
  const recupererSessionStripe = useCallback(async (sessionId) => {
    if (!sessionId) return null;
    try {
      const reponse = await fetch(`${URL_API}/api/pay/session/${sessionId}`);
      if (reponse.ok) {
        const donneesSession = await reponse.json();
        let totalReel = "0.00";
        if (donneesSession.amount_total) totalReel = (donneesSession.amount_total / 100).toFixed(2);
        setTotalStripe(totalReel);
        return donneesSession;
      }
    } catch (erreur) {
      console.error("❌ Erreur récupération Stripe:", erreur);
    }
    return null;
  }, [URL_API]);

  const genererQRCodePourEvenement = useCallback(async (numeroCommande, evenement) => {
    try {
      const contenuQR = {
        idCommande: numeroCommande,
        titreEvenement: evenement.eventTitle || "Événement Olympique",
        prix: evenement.prix || evenement.price || 0,
        quantite: evenement.quantite || evenement.quantity || 1,
        horodatage: Date.now(),
      };
      return await QRCode.toDataURL(JSON.stringify(contenuQR), {
        width: 200,
        margin: 2,
        color: { dark: "#0055A4", light: "#FFFFFF" },
      });
    } catch (erreur) {
      console.error("❌ Erreur génération QR Code:", erreur);
      return null;
    }
  }, []);

  const sauvegarderBilletsStockage = useCallback((nouveauxBillets) => {
    try {
      localStorage.setItem(CLE_STOCKAGE, JSON.stringify(nouveauxBillets));
    } catch (erreur) {
      console.error("❌ Erreur sauvegarde billets:", erreur);
    }
  }, [CLE_STOCKAGE]);

  // Créer billets depuis Stripe
  const creerBilletsDepuisStripe = useCallback(async (sessionStripe, numeroCommande) => {
    if (!sessionStripe) return [];
    const billetsGeneres = [];
    const dateAchatISO = new Date().toISOString();

    if (sessionStripe.line_items && sessionStripe.line_items.data) {
      let billetIndex = 0;
      for (const item of sessionStripe.line_items.data) {
        billetIndex++;
        const description = item.description || "Événement Olympique";
        const quantite = item.quantity || 1;
        const prixUnitaire = item.price?.unit_amount ? item.price.unit_amount / 100 : 1683.00;

        const qrCode = await genererQRCodePourEvenement(numeroCommande, {
          eventTitle: description,
          prix: prixUnitaire,
          quantite: quantite
        });

        billetsGeneres.push({
          id: `${numeroCommande}-STRIPE-${billetIndex}`,
          numeroCommande,
          idEvenement: billetIndex,
          titreEvenement: description,
          dateEvenement: "2024",
          lieuEvenement: "Paris",
          typeOffre: "Standard",
          quantite: quantite,
          prix: prixUnitaire,
          total: (prixUnitaire * quantite).toFixed(2),
          qrCode,
          dateAchat: dateAchatISO,
          statut: "actif",
          source: "stripe"
        });
      }
    } else {
      const montantTotal = parseFloat(totalStripe) || 1683.00;
      const qrCode = await genererQRCodePourEvenement(numeroCommande, {
        eventTitle: "Événement Olympique",
        prix: montantTotal,
        quantite: 1
      });
      billetsGeneres.push({
        id: `${numeroCommande}-FALLBACK`,
        numeroCommande,
        titreEvenement: "Événement Olympique",
        dateEvenement: "2024",
        lieuEvenement: "Paris",
        typeOffre: "Standard",
        quantite: 1,
        prix: montantTotal,
        total: montantTotal.toFixed(2),
        qrCode,
        dateAchat: dateAchatISO,
        statut: "actif",
        source: "fallback"
      });
    }

    return billetsGeneres;
  }, [totalStripe, genererQRCodePourEvenement]);

  // Génération principale des billets
  const genererBillets = useCallback(async () => {
    setStatut("Création de vos billets...");
    debugStockageLocal();

    try {
      const panier = JSON.parse(localStorage.getItem("panier_olympiques") || "[]");
      const numeroCommande = "OLY-" + Date.now();
      let billetsGeneres = [];

      if (sessionId) {
        const sessionStripe = await recupererSessionStripe(sessionId);
        if (sessionStripe) {
          billetsGeneres = await creerBilletsDepuisStripe(sessionStripe, numeroCommande);
        }
      }

      if (billetsGeneres.length === 0 && panier.length > 0) {
        let totalCalculé = 0;
        for (const article of panier) {
          const qrCode = await genererQRCodePourEvenement(numeroCommande, article);
          const prixUnitaire = article.prix || article.price || 0;
          const quantite = article.quantite || article.quantity || 1;
          const totalArticle = prixUnitaire * quantite;
          totalCalculé += totalArticle;

          billetsGeneres.push({
            id: `${numeroCommande}-${article.eventId || article.id || Date.now()}`,
            numeroCommande,
            titreEvenement: article.eventTitle || article.nom || "Événement Olympique",
            dateEvenement: article.eventDate || article.date || "2024",
            lieuEvenement: article.eventLocation || article.lieu || "Paris",
            typeOffre: article.offerType || article.type || "Standard",
            quantite,
            prix: prixUnitaire,
            total: totalArticle.toFixed(2),
            qrCode,
            dateAchat: new Date().toISOString(),
            statut: "actif",
            source: "panier_local"
          });
        }

        if (totalStripe === "0.00") setTotalStripe(totalCalculé.toFixed(2));
      }

      if (billetsGeneres.length === 0) {
        const montant = parseFloat(totalStripe) > 0 ? totalStripe : "1683.00";
        const qrCode = await genererQRCodePourEvenement(numeroCommande, {
          eventTitle: "Événement Olympique",
          prix: parseFloat(montant),
          quantite: 1
        });

        billetsGeneres.push({
          id: `${numeroCommande}-SECOURS`,
          numeroCommande,
          titreEvenement: "Événement Olympique",
          dateEvenement: "2024",
          lieuEvenement: "Paris",
          typeOffre: "Standard",
          quantite: 1,
          prix: parseFloat(montant),
          total: montant,
          qrCode,
          dateAchat: new Date().toISOString(),
          statut: "actif",
          source: "secours"
        });
      }

      setBillets(billetsGeneres);
      sauvegarderBilletsStockage(billetsGeneres);

      if (billetsGeneres.length > 0) localStorage.removeItem("panier_olympiques");
      setChargement(false);
      setStatut(`✅ ${billetsGeneres.length} billet(s) créé(s) avec succès !`);

    } catch (erreur) {
      console.error("❌ Erreur création billets:", erreur);
      setStatut("Erreur lors de la création des billets");
      setChargement(false);
    }
  }, [
    sessionId,
    totalStripe,
    debugStockageLocal,
    recupererSessionStripe,
    creerBilletsDepuisStripe,
    genererQRCodePourEvenement,
    sauvegarderBilletsStockage
  ]);

  // Télécharger PDF
  const telechargerBilletPDF = async (billet) => {
    const elementBillet = document.getElementById(`billet-${billet.id}`);
    if (!elementBillet) return;
    try {
      setStatut(`Génération PDF...`);
      const canvas = await html2canvas(elementBillet, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`billet-${billet.numeroCommande}.pdf`);
      setStatut("PDF téléchargé !");
    } catch (erreur) {
      console.error("❌ Erreur génération PDF:", erreur);
      setStatut("Erreur lors du téléchargement");
    }
  };

  // Imprimer billet
  const imprimerBillet = (billet) => {
    const elementBillet = document.getElementById(`billet-${billet.id}`);
    if (!elementBillet) return;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head><title>Billet ${billet.titreEvenement}</title></head>
        <body>${elementBillet.outerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  useEffect(() => {
    genererBillets();
  }, [genererBillets]);

  if (chargement) {
    return (
      <div style={{ textAlign: "center", padding: 50 }}>
        <h2>{statut}</h2>
        <div style={{ margin: 20 }}>
          <div style={{
            width: 50, height: 50,
            border: "5px solid #f3f3f3",
            borderTop: "5px solid #0055A4",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto",
          }}></div>
        </div>
        <p>Préparation de vos billets...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", padding: 30, maxWidth: 800, margin: "0 auto" }}>
      <div style={{ background: "linear-gradient(135deg, #0055A4 0%, #EF4135 100%)", color: "white", padding: 30, borderRadius: 15, marginBottom: 30 }}>
        <h1 style={{ margin: 0, fontSize: "2.5em" }}>🎉 Paiement Réussi !</h1>
        <p style={{ fontSize: "1.2em", marginTop: 10 }}>
          Vous avez {billets.length} billet{billets.length > 1 ? "s" : ""}
        </p>
        <p style={{ fontSize: "1.1em", marginTop: 5 }}>
          <strong>Total payé: {totalStripe} €</strong>
        </p>
      </div>

      {billets.map((billet) => (
        <div key={billet.id} style={{ marginBottom: 30 }}>
          <div id={`billet-${billet.id}`} style={{ border: "3px solid #0055A4", padding: 25, background: "white", borderRadius: 12, boxShadow: "0 8px 25px rgba(0,0,0,0.1)" }}>
            <h2 style={{ color: "#0055A4", margin: "0 0 15px 0" }}>🎫 {billet.titreEvenement}</h2>
            <p><strong>📍 Lieu:</strong> {billet.lieuEvenement}</p>
            <p><strong>📅 Date:</strong> {billet.dateEvenement}</p>
            <p><strong>🎯 Type:</strong> {billet.typeOffre}</p>
            <p><strong>🎟️ Quantité:</strong> {billet.quantite}</p>
            <p><strong>💰 Total:</strong> {billet.total} €</p>
            <p><strong>📋 Commande:</strong> {billet.numeroCommande}</p>
            {billet.qrCode && <img src={billet.qrCode} alt="QR Code" style={{ width: 150, height: 150, margin: "15px 0" }} />}
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 15 }}>
            <button onClick={() => telechargerBilletPDF(billet)} style={{ padding: "8px 15px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}>
              📥 PDF
            </button>
            <button onClick={() => imprimerBillet(billet)} style={{ padding: "8px 15px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}>
              🖨️ Imprimer
            </button>
          </div>
        </div>
      ))}

      {statut && <p style={{ color: "#0055A4", fontStyle: "italic", marginTop: 15 }}>{statut}</p>}
    </div>
  );
}

export default SuccessPage;
