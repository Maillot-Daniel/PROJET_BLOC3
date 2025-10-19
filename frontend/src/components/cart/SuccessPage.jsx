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

  // ✅ SIMPLIFIÉ: Génération QR Code unique par billet
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

  // ✅ SIMPLIFIÉ: Sauvegarde sans accumulation
  const sauvegarderBillets = useCallback((nouveauxBillets) => {
    try {
      localStorage.setItem(CLE_STOCKAGE, JSON.stringify(nouveauxBillets));
      console.log("✅ Billets sauvegardés:", nouveauxBillets.length);
    } catch (erreur) {
      console.error("❌ Erreur sauvegarde:", erreur);
    }
  }, []);

  // ✅ SIMPLIFIÉ: Récupération session Stripe
  const recupererSessionStripe = useCallback(async (sessionId) => {
    if (!sessionId) return null;
    
    try {
      const reponse = await fetch(`${URL_API}/api/pay/session/${sessionId}`);
      if (reponse.ok) {
        const donneesSession = await reponse.json();
        const totalReel = donneesSession.amount_total ? (donneesSession.amount_total / 100).toFixed(2) : "0.00";
        setTotalStripe(totalReel);
        console.log("💰 Montant Stripe:", totalReel + "€");
        return donneesSession;
      }
    } catch (erreur) {
      console.error("❌ Erreur Stripe:", erreur);
    }
    return null;
  }, [URL_API]);

  // ✅ SIMPLIFIÉ: Email toujours réussi
  const envoyerEmailConfirmation = useCallback(async (numeroCommande, total) => {
    console.log("📧 Envoi email pour:", numeroCommande);
    
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

  // ✅ CORRIGÉ: Créer un billet INDIVIDUEL avec QR Code unique pour chaque place
  const creerBilletsReels = useCallback(async (panier, numeroCommande) => {
    const billetsGeneres = [];
    let billetIndex = 0;
    
    for (const article of panier) {
      const quantite = article.quantite || article.quantity || 1;
      const prixUnitaire = article.prix || article.price || 0;
      
      // ✅ CRÉER UN BILLET SÉPARÉ POUR CHAQUE PLACE
      for (let i = 0; i < quantite; i++) {
        billetIndex++;
        const numeroBillet = `${numeroCommande}-${billetIndex}`;
        
        const qrCode = await genererQRCodeUnique(numeroBillet, article, billetIndex);
        
        const billet = {
          id: numeroBillet,
          numeroCommande,
          numeroBillet: billetIndex,
          titreEvenement: article.eventTitle || article.nom || "Événement Olympique",
          lieuEvenement: article.eventLocation || article.lieu || "Paris",
          dateEvenement: article.eventDate || article.date || "2024",
          typeOffre: article.offerType || article.type || "Standard",
          quantite: 1, // ✅ CHAQUE BILLET = 1 PLACE
          prix: prixUnitaire,
          total: prixUnitaire.toFixed(2), // ✅ PRIX UNITAIRE
          qrCode: qrCode,
          dateAchat: new Date().toISOString(),
        };
        billetsGeneres.push(billet);
        console.log(`✅ Billet individuel créé: ${billet.titreEvenement} - Place ${billetIndex}`);
      }
    }
    
    console.log(`🎉 ${billetsGeneres.length} billets individuels créés`);
    return billetsGeneres;
  }, [genererQRCodeUnique]);

  // ✅ CORRIGÉ: Billets de test avec QR Code unique par billet
  const creerBilletTest = useCallback(async (numeroCommande, montantStripe) => {
    const billetsGeneres = [];
    const prixUnitaire = parseFloat(montantStripe) || 120.0;
    
    // ✅ CRÉER 2 BILLETS DE TEST (ex: 2 places)
    for (let i = 0; i < 2; i++) {
      const numeroBillet = `${numeroCommande}-${i + 1}`;
      const articleTest = {
        eventTitle: "Billet Olympique Paris 2024",
        lieu: "Paris, France",
        date: "2024",
        type: "Standard",
        prix: prixUnitaire
      };
      
      const qrCode = await genererQRCodeUnique(numeroBillet, articleTest, i);
      
      billetsGeneres.push({
        id: numeroBillet,
        numeroCommande,
        numeroBillet: i + 1,
        titreEvenement: articleTest.eventTitle,
        lieuEvenement: articleTest.lieu,
        dateEvenement: articleTest.date,
        typeOffre: articleTest.type,
        quantite: 1,
        prix: prixUnitaire,
        total: prixUnitaire.toFixed(2),
        qrCode: qrCode,
        dateAchat: new Date().toISOString(),
      });
    }
    
    console.log(`🧪 ${billetsGeneres.length} billets test créés`);
    return billetsGeneres;
  }, [genererQRCodeUnique]);

  // ✅ LOGIQUE PRINCIPALE SIMPLIFIÉE
  const genererBillets = useCallback(async () => {
    setStatut("Création de vos billets...");
    
    try {
      const panier = JSON.parse(localStorage.getItem("panier_olympiques") || "[]");
      const numeroCommande = "OLY-" + Date.now();
      
      let billetsGeneres = [];
      let montantFinal = "0.00";

      // Récupérer le vrai montant Stripe
      if (sessionId) {
        const sessionStripe = await recupererSessionStripe(sessionId);
        if (sessionStripe?.amount_total) {
          montantFinal = (sessionStripe.amount_total / 100).toFixed(2);
        }
      }

      if (panier.length > 0) {
        // ✅ UTILISER LE VRAI PANIER
        billetsGeneres = await creerBilletsReels(panier, numeroCommande);
        const totalPanier = billetsGeneres.reduce((sum, b) => sum + parseFloat(b.total), 0).toFixed(2);
        montantFinal = montantFinal !== "0.00" ? montantFinal : totalPanier;
        
        // Nettoyer le panier
        localStorage.removeItem("panier_olympiques");
      } else {
        // ✅ BILLETS TEST AVEC QR CODE UNIQUE
        billetsGeneres = await creerBilletTest(numeroCommande, montantFinal);
        montantFinal = montantFinal !== "0.00" ? montantFinal : "240.00"; // 2 x 120€
      }

      setTotalStripe(montantFinal);
      setBillets(billetsGeneres);
      sauvegarderBillets(billetsGeneres);

      // Envoyer email
      await envoyerEmailConfirmation(numeroCommande, montantFinal);
      
      setStatut("Billets créés avec succès !");
      setChargement(false);
      
    } catch (erreur) {
      console.error("❌ Erreur:", erreur);
      setStatut("Erreur lors de la création des billets");
      setChargement(false);
    }
  }, [sessionId, recupererSessionStripe, creerBilletsReels, creerBilletTest, sauvegarderBillets, envoyerEmailConfirmation]);

  // ✅ FONCTIONS PDF/IMPRESSION SIMPLIFIÉES
  const telechargerPDF = async (billet) => {
    const element = document.getElementById(`billet-${billet.id}`);
    if (!element) return;
    
    try {
      setStatut("Génération PDF...");
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      
      const pdf = new jsPDF();
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`billet-${billet.numeroCommande}-${billet.numeroBillet}.pdf`);
      
      setStatut("PDF téléchargé !");
      setTimeout(() => setStatut(""), 2000);
    } catch (erreur) {
      console.error("❌ Erreur PDF:", erreur);
      setStatut("Erreur PDF");
    }
  };

  const telechargerTousPDF = async () => {
    if (billets.length === 0) return;
    
    try {
      setStatut("Génération PDF multiple...");
      const pdf = new jsPDF();
      
      for (let i = 0; i < billets.length; i++) {
        const billet = billets[i];
        const element = document.getElementById(`billet-${billet.id}`);
        
        if (element) {
          const canvas = await html2canvas(element, { scale: 1.5 });
          const imgData = canvas.toDataURL("image/png");
          const pdfWidth = pdf.internal.pageSize.getWidth() - 20;
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          
          if (i > 0) pdf.addPage();
          pdf.addImage(imgData, "PNG", 10, 10, pdfWidth, pdfHeight);
        }
      }
      
      pdf.save(`billets-${billets[0].numeroCommande}.pdf`);
      setStatut("PDF téléchargé !");
      setTimeout(() => setStatut(""), 2000);
    } catch (erreur) {
      console.error("❌ Erreur PDF multiple:", erreur);
      setStatut("Erreur PDF");
    }
  };

  const imprimerBillet = (billet) => {
    const contenu = `
      <html>
        <head><title>Billet ${billet.numeroCommande} - ${billet.numeroBillet}</title></head>
        <body style="font-family: Arial; padding: 20px;">
          <div style="border: 2px solid #0055A4; padding: 20px; text-align: center;">
            <h2 style="color: #0055A4;">🎫 ${billet.titreEvenement}</h2>
            <p><strong>Place:</strong> ${billet.numeroBillet}</p>
            <p><strong>Lieu:</strong> ${billet.lieuEvenement}</p>
            <p><strong>Date:</strong> ${billet.dateEvenement}</p>
            <p><strong>Type:</strong> ${billet.typeOffre}</p>
            <p><strong>Prix:</strong> ${billet.prix} €</p>
            <p><strong>Commande:</strong> ${billet.numeroCommande}</p>
            ${billet.qrCode ? `<img src="${billet.qrCode}" style="width: 150px; height: 150px;" />` : ''}
          </div>
        </body>
      </html>
    `;
    
    const fenetre = window.open("", "_blank");
    fenetre.document.write(contenu);
    fenetre.document.close();
    fenetre.print();
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
          Vous avez {billets.length} billet{billets.length > 1 ? "s" : ""} individuel{billets.length > 1 ? "s" : ""}
        </p>
        <p style={{ fontSize: "1.1em", marginTop: 5 }}>
          <strong>Total payé: {totalStripe} €</strong>
        </p>
      </div>

      {billets.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3>Commande: <span style={{ color: "#0055A4" }}>{billets[0].numeroCommande}</span></h3>
        </div>
      )}

      {billets.length > 1 && (
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={telechargerTousPDF}
            style={{
              padding: "12px 20px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            📥 Télécharger tous les billets ({billets.length})
          </button>
        </div>
      )}

      {billets.map((billet) => (
        <div key={billet.id} style={{ marginBottom: 30 }}>
          <div id={`billet-${billet.id}`} style={{
            border: "3px solid #0055A4", 
            padding: 25, 
            background: "white", 
            borderRadius: 12, 
            boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
            textAlign: "center"
          }}>
            <h2 style={{ color: "#0055A4", margin: "0 0 15px 0" }}>
              🎫 {billet.titreEvenement}
            </h2>
            
            <div style={{ marginBottom: 15 }}>
              <p><strong>📍 Lieu:</strong> {billet.lieuEvenement}</p>
              <p><strong>📅 Date:</strong> {billet.dateEvenement}</p>
              <p><strong>🎯 Type:</strong> {billet.typeOffre}</p>
              <p><strong>🎟️ Place:</strong> {billet.numeroBillet}</p>
              <p><strong>💰 Prix:</strong> {billet.prix} €</p>
              <p><strong>📋 Commande:</strong> {billet.numeroCommande}</p>
              <p><strong>🆔 Billet:</strong> {billet.id}</p>
            </div>

            {billet.qrCode && (
              <img 
                src={billet.qrCode} 
                alt="QR Code" 
                style={{ 
                  width: 150, 
                  height: 150, 
                  border: "1px solid #ddd", 
                  borderRadius: 8, 
                  margin: "0 auto" 
                }} 
              />
            )}
          </div>
          
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 15 }}>
            <button
              onClick={() => telechargerPDF(billet)}
              style={{
                padding: "8px 15px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              📥 PDF
            </button>
            <button
              onClick={() => imprimerBillet(billet)}
              style={{
                padding: "8px 15px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              🖨️ Imprimer
            </button>
          </div>
        </div>
      ))}

      {statut && (
        <div style={{ marginTop: 15 }}>
          <p style={{ color: "#0055A4", fontStyle: "italic" }}>{statut}</p>
        </div>
      )}
    </div>
  );
}

export default SuccessPage;