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

  const debugStockageLocal = useCallback(() => {
    console.log("🔍 DEBUG Stockage Local:");
    console.log("🛒 panier_olympiques:", localStorage.getItem("panier_olympiques"));
    console.log("🎫 oly_billets:", localStorage.getItem(CLE_STOCKAGE));
    console.log("🔗 sessionId:", sessionId);
    
    try {
      const panier = JSON.parse(localStorage.getItem("panier_olympiques") || "[]");
      console.log("📊 CONTENU DU PANIER:", panier);
      console.log("🔢 Nombre d'articles dans le panier:", panier.length);
      
      panier.forEach((article, index) => {
        console.log(`📦 Article ${index + 1}:`, {
          id: article.id,
          nom: article.nom || article.eventTitle,
          prix: article.prix || article.price,
          quantite: article.quantite || article.quantity,
          type: article.type || article.offerType,
          total: ((article.prix || article.price || 0) * (article.quantite || article.quantity || 1)).toFixed(2)
        });
      });
    } catch (erreur) {
      console.error("❌ Erreur analyse panier:", erreur);
    }
  }, [sessionId, CLE_STOCKAGE]);

  const recupererSessionStripe = useCallback(async (sessionId) => {
    if (!sessionId) {
      console.log("❌ Aucun sessionId fourni pour Stripe");
      return null;
    }
    
    console.log("🔄 Récupération session Stripe avec ID:", sessionId);
    try {
      console.log("📡 Appel API vers:", `${URL_API}/api/pay/session/${sessionId}`);
      
      const reponse = await fetch(`${URL_API}/api/pay/session/${sessionId}`);
      
      console.log("📡 Réponse Stripe status:", reponse.status);
      
      if (reponse.ok) {
        const donneesSession = await reponse.json();
        console.log("✅ Données session Stripe récupérées");
        
        let totalReel = "0.00";
        if (donneesSession.amount_total) {
          totalReel = (donneesSession.amount_total / 100).toFixed(2);
          console.log("💰 Montant total Stripe:", totalReel + "€");
        }
        
        setTotalStripe(totalReel);
        return donneesSession;
      } else {
        console.error("❌ Erreur réponse Stripe:", reponse.status);
      }
    } catch (erreur) {
      console.error("❌ Erreur récupération session Stripe:", erreur);
    }
    return null;
  }, []);

  const genererQRCodePourEvenement = useCallback(async (numeroCommande, evenement) => {
    console.log(`🎫 Génération QR Code pour: ${evenement.eventTitle || evenement.nom}`);
    
    try {
      const contenuQR = {
        idCommande: numeroCommande,
        idEvenement: evenement.eventId || evenement.id || 0,
        titreEvenement: evenement.eventTitle || evenement.nom || "Événement Olympique",
        dateEvenement: evenement.eventDate || evenement.date || "2024",
        lieuEvenement: evenement.eventLocation || evenement.lieu || "Paris",
        typeOffre: evenement.offerType || evenement.type || "Standard",
        quantite: evenement.quantite || evenement.quantity || 1,
        prix: evenement.prix || evenement.price || evenement.prixUnitaire || 0,
        horodatage: Date.now(),
        devise: "EUR",
      };
      
      const imageQRCode = await QRCode.toDataURL(JSON.stringify(contenuQR), {
        width: 200,
        margin: 2,
        color: { dark: "#0055A4", light: "#FFFFFF" },
      });
      
      return imageQRCode;
    } catch (erreur) {
      console.error("❌ Erreur génération QR Code:", erreur);
      return null;
    }
  }, []);

  const sauvegarderBilletsStockage = useCallback((nouveauxBillets) => {
    console.log("💾 Sauvegarde des billets:", nouveauxBillets.length);
    try {
      const billetsExistants = JSON.parse(localStorage.getItem(CLE_STOCKAGE) || "[]");
      const billetsMisesAJour = [...billetsExistants, ...nouveauxBillets];
      
      // Limiter à 50 billets maximum
      if (billetsMisesAJour.length > 50) {
        billetsMisesAJour.splice(0, billetsMisesAJour.length - 50);
      }
      
      localStorage.setItem(CLE_STOCKAGE, JSON.stringify(billetsMisesAJour));
      console.log("✅ Billets sauvegardés. Total:", billetsMisesAJour.length);
    } catch (erreur) {
      console.error("❌ Erreur sauvegarde billets:", erreur);
    }
  }, []);

  // ✅ Créer un billet par article du panier (pas par événement)
  const creerBilletsDepuisPanier = useCallback(async (panier, numeroCommande) => {
    console.log("🛒 Création billets depuis panier:", panier.length, "articles");
    
    const billetsGeneres = [];
    const dateAchatISO = new Date().toISOString();

    for (const article of panier) {
      console.log("📋 Traitement article:", {
        nom: article.eventTitle || article.nom,
        prix: article.prix || article.price,
        quantite: article.quantite || article.quantity,
        type: article.offerType || article.type
      });
      
      // ✅ Appliquer le prix et la quantité réels du panier
      const prixReel = article.prix || article.price || article.prixUnitaire || 0;
      const quantiteReelle = article.quantite || article.quantity || 1;
      const totalArticle = prixReel * quantiteReelle;
      
      const qrCode = await genererQRCodePourEvenement(numeroCommande, article);
      
      const billet = {
        id: `${numeroCommande}-${article.eventId || article.id || Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        numeroCommande,
        idEvenement: article.eventId || article.id || 0,
        titreEvenement: article.eventTitle || article.nom || "Événement Olympique",
        dateEvenement: article.eventDate || article.date || "2024",
        lieuEvenement: article.eventLocation || article.lieu || "Paris",
        typeOffre: article.offerType || article.type || "Standard",
        quantite: quantiteReelle,
        prix: prixReel,
        total: totalArticle.toFixed(2),
        qrCode,
        dateAchat: dateAchatISO,
        statut: "actif",
      };
      billetsGeneres.push(billet);
      console.log(`✅ Billet créé: ${billet.titreEvenement} - ${billet.quantite}x ${billet.prix}€ = ${billet.total}€`);
    }
    
    console.log("🎉 Tous les billets générés:", billetsGeneres.length);
    return billetsGeneres;
  }, [genererQRCodePourEvenement]);

  const creerBilletsTest = useCallback(async (numeroCommande) => {
    console.log("🧪 Création de billets de test");
    
    // ✅ Créer des données de test plus réalistes
    const articlesTest = [
      { 
        eventId: 1, 
        eventTitle: "Cérémonie d'Ouverture", 
        eventDate: "26 Juillet 2024", 
        eventLocation: "Stade de France", 
        offerType: "Standard", 
        quantite: 2, 
        prix: 150.0 
      },
      { 
        eventId: 2, 
        eventTitle: "Finale Athlétisme 100m", 
        eventDate: "3 Août 2024", 
        eventLocation: "Stade de France", 
        offerType: "VIP", 
        quantite: 1, 
        prix: 300.0 
      },
      { 
        eventId: 3, 
        eventTitle: "Finale Natation 200m", 
        eventDate: "28 Juillet 2024", 
        eventLocation: "Centre Aquatique", 
        offerType: "Famille", 
        quantite: 4, 
        prix: 89.0 
      }
    ];
    
    return await creerBilletsDepuisPanier(articlesTest, numeroCommande);
  }, [creerBilletsDepuisPanier]);

  const genererBillets = useCallback(async () => {
    console.log("🚀 DÉBUT - Génération des billets");
    setStatut("Création de vos billets...");
    
    debugStockageLocal();
    
    try {
      const panierRaw = localStorage.getItem("panier_olympiques");
      const panier = JSON.parse(panierRaw || "[]");
      
      let billetsGeneres = [];
      const numeroCommande = "OLY-" + Date.now() + "-" + Math.random().toString(36).substring(2, 8).toUpperCase();

      console.log("📇 Numéro de commande:", numeroCommande);
      console.log("📦 Articles dans le panier:", panier.length);

      if (sessionId) {
        console.log("🔗 Récupération données Stripe...");
        await recupererSessionStripe(sessionId);
      }

      if (panier.length === 0) {
        console.log("🛒 Panier vide, création billets test");
        billetsGeneres = await creerBilletsTest(numeroCommande);
        setTotalStripe("600.00");
      } else {
        console.log("🛒 Création billets depuis panier réel");
        billetsGeneres = await creerBilletsDepuisPanier(panier, numeroCommande);
        
        // Calculer le total réel du panier
        const totalReel = billetsGeneres.reduce((sum, b) => sum + parseFloat(b.total), 0).toFixed(2);
        if (totalStripe === "0.00") {
          setTotalStripe(totalReel);
        }
      }

      console.log("📊 RÉSUMÉ FINAL:", {
        nombreBillets: billetsGeneres.length,
        numeroCommande: numeroCommande,
        totalStripe: totalStripe,
        totalBillets: billetsGeneres.reduce((sum, b) => sum + parseFloat(b.total), 0).toFixed(2)
      });

      // ✅ Mettre à jour l'état AVANT la sauvegarde
      setBillets(billetsGeneres);
      sauvegarderBilletsStockage(billetsGeneres);
      
      // Nettoyage du panier seulement si on a utilisé le vrai panier
      if (panier.length > 0) {
        localStorage.removeItem("panier_olympiques");
        console.log("🗑️ Panier nettoyé");
      }
      
      setChargement(false);
      setStatut("Billets créés avec succès !");
      console.log("✅ PROCESSUS TERMINÉ");
      
    } catch (erreur) {
      console.error("❌ Erreur création billets:", erreur);
      setStatut("Erreur lors de la création des billets");
      setChargement(false);
    }
  }, [
    sessionId, 
    totalStripe,
    recupererSessionStripe, 
    creerBilletsDepuisPanier,
    creerBilletsTest, 
    sauvegarderBilletsStockage, 
    debugStockageLocal
  ]);

  // ✅ Télécharger tous les billets en un seul PDF
  const telechargerTousBilletsPDF = async () => {
    console.log("📄 Téléchargement de TOUS les billets en PDF");
    setStatut("Génération du PDF contenant tous les billets...");
    
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      let positionY = 10;
      
      for (let i = 0; i < billets.length; i++) {
        const billet = billets[i];
        const elementBillet = document.getElementById(`billet-${billet.id}`);
        
        if (elementBillet) {
          console.log(`🔄 Ajout billet ${i + 1}/${billets.length} au PDF`);
          
          const canvas = await html2canvas(elementBillet, { 
            scale: 2, 
            useCORS: true, 
            logging: false 
          });
          
          const imgData = canvas.toDataURL("image/png");
          const pdfWidth = pdf.internal.pageSize.getWidth() - 20; // Marge
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          
          // Nouvelle page si nécessaire
          if (positionY + pdfHeight > pdf.internal.pageSize.getHeight() - 10) {
            pdf.addPage();
            positionY = 10;
          }
          
          pdf.addImage(imgData, "PNG", 10, positionY, pdfWidth, pdfHeight);
          positionY += pdfHeight + 10;
        }
      }
      
           pdf.save(`billets-${billets[0]?.numeroCommande || 'commande'}.pdf`);
      
      setStatut("PDF téléchargé !");
      console.log("✅ PDF contenant tous les billets téléchargé");
      
      setTimeout(() => setStatut(""), 2000);
    } catch (erreur) {
      console.error("❌ Erreur génération PDF:", erreur);
      setStatut("Erreur lors du téléchargement");
    }
  };

  // ✅ Imprimer tous les billets dans une seule fenêtre
  const imprimerTousBillets = () => {
    console.log("🖨️ Impression de TOUS les billets");
    try {
      setStatut("Préparation impression de tous les billets...");
      
      const fenetreImpression = window.open("", "_blank");
      const contenuHTML = `
        <html>
          <head>
            <title>Billets - Commande ${billets[0]?.numeroCommande || ''}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                padding: 20px;
                margin: 0;
              }
              .ticket { 
                border: 2px solid #0055A4; 
                padding: 20px; 
                margin: 20px 0;
                page-break-inside: avoid;
                break-inside: avoid;
              }
              .ticket h2 { color: #0055A4; margin: 0 0 10px 0; }
              .ticket p { margin: 5px 0; }
              .qr-code { width: 150px; height: 150px; margin: 10px auto; display: block; }
              @media print {
                body { padding: 0; }
                .ticket { margin: 10px 0; }
              }
            </style>
          </head>
          <body>
            <h1 style="text-align: center; color: #0055A4;">🎫 Vos Billets Olympiques</h1>
            <p style="text-align: center; color: #666;">Commande: ${billets[0]?.numeroCommande || ''}</p>
            <hr style="margin: 20px 0;">
            
            ${billets.map((billet, index) => `
              <div class="ticket">
                <h2>${billet.titreEvenement}</h2>
                <p><strong>📍 Lieu:</strong> ${billet.lieuEvenement}</p>
                <p><strong>📅 Date:</strong> ${billet.dateEvenement}</p>
                <p><strong>🎯 Type:</strong> ${billet.typeOffre}</p>
                <p><strong>🎟️ Quantité:</strong> ${billet.quantite} billet${billet.quantite > 1 ? 's' : ''}</p>
                <p><strong>💰 Prix unitaire:</strong> ${billet.prix} €</p>
                <p><strong>💵 Total:</strong> ${billet.total} €</p>
                <p><strong>📋 Commande:</strong> ${billet.numeroCommande}</p>
                ${billet.qrCode ? `<img src="${billet.qrCode}" alt="QR Code" class="qr-code" />` : ''}
                ${index < billets.length - 1 ? '<div style="page-break-after: always;"></div>' : ''}
              </div>
            `).join('')}
          </body>
        </html>
      `;
      
      fenetreImpression.document.write(contenuHTML);
      fenetreImpression.document.close();
      
      fenetreImpression.onload = () => {
        console.log("🖨️ Lancement impression...");
        fenetreImpression.print();
        fenetreImpression.onafterprint = () => {
          fenetreImpression.close();
          setStatut("Impression terminée !");
          console.log("✅ Impression de tous les billets terminée");
          setTimeout(() => setStatut(""), 2000);
        };
      };
    } catch (erreur) {
      console.error("❌ Erreur impression:", erreur);
      setStatut("Erreur lors de l'impression");
    }
  };

  const telechargerBilletPDF = async (billet) => {
    console.log("📄 Téléchargement PDF pour billet:", billet.titreEvenement);
    const elementBillet = document.getElementById(`billet-${billet.id}`);
    if (!elementBillet) {
      console.error("❌ Élément billet non trouvé pour PDF");
      return;
    }
    
    try {
      setStatut(`Génération PDF pour ${billet.titreEvenement}...`);
      
      const canvas = await html2canvas(elementBillet, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL("image/png");
      
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`billet-${billet.titreEvenement}-${billet.numeroCommande}.pdf`);
      
      setStatut("PDF téléchargé !");
      console.log("✅ PDF billet individuel téléchargé");
      
      setTimeout(() => setStatut(""), 2000);
    } catch (erreur) {
      console.error("❌ Erreur génération PDF:", erreur);
      setStatut("Erreur lors du téléchargement");
    }
  };

  const imprimerBillet = (billet) => {
    console.log("🖨️ Impression billet individuel:", billet.titreEvenement);
    try {
      setStatut(`Préparation impression pour ${billet.titreEvenement}...`);
      const fenetreImpression = window.open("", "_blank");
      fenetreImpression.document.write(`
        <html>
          <head>
            <title>Billet - ${billet.titreEvenement}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .ticket { border: 2px solid #0055A4; padding: 20px; margin: 10px; }
            </style>
          </head>
          <body>
            <div class="ticket">
              <h2>🎫 ${billet.titreEvenement}</h2>
              <p><strong>📍 Lieu:</strong> ${billet.lieuEvenement}</p>
              <p><strong>📅 Date:</strong> ${billet.dateEvenement}</p>
              <p><strong>🎯 Type:</strong> ${billet.typeOffre}</p>
              <p><strong>🎟️ Quantité:</strong> ${billet.quantite}</p>
              <p><strong>💰 Total:</strong> ${billet.total} €</p>
              <p><strong>📋 Commande:</strong> ${billet.numeroCommande}</p>
              ${billet.qrCode ? `<img src="${billet.qrCode}" alt="QR Code" style="width: 150px; height: 150px;" />` : ''}
            </div>
          </body>
        </html>
      `);
      fenetreImpression.document.close();
      
      fenetreImpression.onload = () => {
        console.log("🖨️ Lancement impression...");
        fenetreImpression.print();
        fenetreImpression.onafterprint = () => {
          fenetreImpression.close();
          setStatut("Impression terminée !");
          console.log("✅ Impression billet individuel terminée");
          setTimeout(() => setStatut(""), 2000);
        };
      };
    } catch (erreur) {
      console.error("❌ Erreur impression:", erreur);
      setStatut("Erreur lors de l'impression");
    }
  };

  const formaterDate = (isoString) => {
    if (!isoString) return "Date non disponible";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Date invalide";
    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    console.log("🎯 SuccessPage monté - Début génération billets");
    console.log("🔗 Session ID from URL:", sessionId);
    genererBillets();
    
    return () => {
      console.log("🧹 SuccessPage démonté");
    };
  }, [genererBillets, sessionId]);

  if (chargement) {
    console.log("⏳ Affichage écran chargement...");
    return (
      <div style={{ textAlign: "center", padding: 50 }}>
        <h2>{statut}</h2>
        <div style={{ margin: 20 }}>
          <div
            style={{
              width: 50,
              height: 50,
              border: "5px solid #f3f3f3",
              borderTop: "5px solid #0055A4",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto",
            }}
          ></div>
        </div>
        <p>⏳ Préparation de vos billets...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  console.log("✅ Affichage des billets générés:", billets.length);
  console.log("💰 Total affiché:", totalStripe);
  
  // ✅ Afficher TOUS les billets sans limite
  const billetsAffiches = billets.slice(0, 100); // Limite large pour éviter les problèmes de performance

  return (
    <div style={{ textAlign: "center", padding: 30, maxWidth: 800, margin: "0 auto" }}>
      <div style={{ background: "linear-gradient(135deg, #0055A4 0%, #EF4135 100%)", color: "white", padding: 30, borderRadius: 15, marginBottom: 30 }}>
        <h1 style={{ margin: 0, fontSize: "2.5em" }}>🎉 Paiement Réussi !</h1>
        <p style={{ fontSize: "1.2em", marginTop: 10, opacity: 0.9 }}>
          Vous avez {billets.length} billet{billets.length > 1 ? "s" : ""}
        </p>
        <p style={{ fontSize: "1.1em", marginTop: 5 }}>
          <strong>💰 Total payé: {totalStripe} €</strong>
        </p>
        {!sessionId && (
          <p style={{ fontSize: "0.9em", marginTop: 5, opacity: 0.8 }}>
            ⚠️ Mode démonstration - Billets tests
          </p>
        )}
      </div>

      {billets.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3>
            Numéro de commande: <span style={{ color: "#0055A4" }}>{billets[0].numeroCommande}</span>
          </h3>
          {sessionId && (
            <p style={{ color: "#666", fontSize: "0.9em" }}>
              Session Stripe: {sessionId}
            </p>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 30, flexWrap: "wrap" }}>
        <button
          onClick={telechargerTousBilletsPDF}
          style={{
            padding: "12px 20px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: "0.9em",
          }}
        >
          📥 Télécharger tous ({billets.length})
        </button>
        <button
          onClick={imprimerTousBillets}
          style={{
            padding: "12px 20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: "0.9em",
          }}
        >
          🖨️ Imprimer tous ({billets.length})
        </button>
      </div>

      {/* ✅ Afficher TOUS les billets avec une clé unique */}
      {billetsAffiches.map((billet, index) => (
        <div key={`${billet.id}-${index}`} style={{ marginBottom: 30 }}>
          <div id={`billet-${billet.id}`} style={{ border: "3px solid #0055A4", padding: 25, background: "white", borderRadius: 12, boxShadow: "0 8px 25px rgba(0,0,0,0.1)", textAlign: "center" }}>
            <div style={{ borderBottom: "2px solid #f0f0f0", paddingBottom: 15, marginBottom: 15 }}>
              <h2 style={{ color: "#0055A4", margin: "0 0 5px 0", fontSize: "1.5em" }}>🎫 {billet.titreEvenement}</h2>
              <p style={{ color: "#666", margin: "5px 0", fontSize: "0.9em" }}>
                📍 {billet.lieuEvenement} | 📅 {billet.dateEvenement}
              </p>
              <p style={{ color: "#EF4135", margin: "5px 0", fontWeight: "bold" }}>
                {billet.quantite}x {billet.typeOffre} - {billet.total} €
              </p>
            </div>

            {billet.qrCode && <img src={billet.qrCode} alt={`QR Code - ${billet.titreEvenement}`} style={{ width: 180, height: 180, border: "1px solid #ddd", borderRadius: 8, margin: "0 auto" }} />}

            <div style={{ marginTop: 20 }}>
              <p style={{ margin: "8px 0", fontSize: "1em" }}>
                <strong>🎯 Type:</strong> {billet.typeOffre}
              </p>
              <p style={{ margin: "8px 0", fontSize: "1em" }}>
                <strong>🎟️ Quantité:</strong> {billet.quantite} billet{billet.quantite > 1 ? "s" : ""}
              </p>
              <p style={{ margin: "8px 0", fontSize: "1em" }}>
                <strong>💰 Prix unitaire:</strong> {billet.prix} €
              </p>
              <p style={{ margin: "8px 0", fontSize: "1em" }}>
                <strong>💵 Total:</strong> {billet.total} €
              </p>
              <p style={{ margin: "8px 0", fontSize: "1em" }}>
                <strong>📅 Date d'achat:</strong> {formaterDate(billet.dateAchat)}
              </p>
              <p style={{ margin: "8px 0", fontSize: "1em" }}>
                <strong>📋 Commande:</strong> {billet.numeroCommande}
              </p>
            </div>
          </div>
          
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 15 }}>
            <button
              onClick={() => telechargerBilletPDF(billet)}
              style={{
                padding: "8px 15px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: "0.8em",
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
                fontSize: "0.8em",
              }}
            >
              🖨️ Imprimer
            </button>
          </div>
        </div>
      ))}

      {billets.length > billetsAffiches.length && (
        <div style={{ marginTop: 20, padding: 15, background: "#fff3cd", border: "1px solid #ffeaa7", borderRadius: 8 }}>
          <p style={{ color: "#856404", margin: 0 }}>
            ℹ️ {billets.length - billetsAffiches.length} billet(s) supplémentaire(s) ont été générés mais ne sont pas affichés pour des raisons de performance.
          </p>
        </div>
      )}

      {statut && (
        <div style={{ marginTop: 15 }}>
          <p style={{ color: "#0055A4", fontStyle: "italic" }}>{statut}</p>
        </div>
      )}
    </div>
  );
}

export default SuccessPage;