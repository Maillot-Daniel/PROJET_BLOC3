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

  const debugStockageLocal = useCallback(() => {
    console.log("🔍 DEBUG Stockage Local:");
    console.log("🛒 panier_olympiques:", localStorage.getItem("panier_olympiques"));
    console.log("🎫 oly_billets:", localStorage.getItem(CLE_STOCKAGE));
    console.log("🔗 sessionId:", sessionId);
    
    // Debug détaillé du panier
    try {
      const panier = JSON.parse(localStorage.getItem("panier_olympiques") || "[]");
      console.log("📊 CONTENU DU PANIER:", panier);
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
      const URL_API = "https://projet-bloc3.onrender.com";
      const reponse = await fetch(`${URL_API}/api/paiements/session/${sessionId}`);
      
      console.log("📡 Réponse Stripe status:", reponse.status);
      
      if (reponse.ok) {
        const donneesSession = await reponse.json();
        console.log("✅ Données session Stripe:", donneesSession);
        
        let totalReel = "0.00";
        if (donneesSession.amount_total) {
          totalReel = (donneesSession.amount_total / 100).toFixed(2);
          console.log("💰 Montant total (amount_total):", donneesSession.amount_total, "→", totalReel + "€");
        } else if (donneesSession.amount) {
          totalReel = (donneesSession.amount / 100).toFixed(2);
          console.log("💰 Montant (amount):", donneesSession.amount, "→", totalReel + "€");
        } else if (donneesSession.total) {
          totalReel = donneesSession.total;
          console.log("💰 Total:", totalReel + "€");
        } else {
          console.log("⚠️ Aucun montant trouvé dans la session Stripe");
        }
        
        // Debug email client
        if (donneesSession.customer_details && donneesSession.customer_details.email) {
          console.log("📧 Email client:", donneesSession.customer_details.email);
        } else {
          console.log("📧 Aucun email client trouvé");
        }
        
        setTotalStripe(totalReel);
        return donneesSession;
      } else {
        console.error("❌ Erreur réponse Stripe:", reponse.status, reponse.statusText);
      }
    } catch (erreur) {
      console.error("❌ Erreur récupération session Stripe:", erreur);
    }
    return null;
  }, []);

  const genererQRCodePourEvenement = useCallback(async (numeroCommande, evenement) => {
    console.log(`🎫 Génération QR Code pour événement:`, {
      numeroCommande,
      evenement: evenement.eventTitle || evenement.nom,
      id: evenement.eventId || evenement.id
    });
    
    try {
      const contenuQR = {
        idCommande: numeroCommande,
        idEvenement: evenement.eventId || evenement.id || 0,
        titreEvenement: evenement.eventTitle || evenement.nom || "Événement Olympique",
        dateEvenement: evenement.eventDate || evenement.date || "2024",
        lieuEvenement: evenement.eventLocation || evenement.lieu || "Paris",
        typeOffre: evenement.offerType || evenement.type || "Standard",
        quantite: evenement.quantite || evenement.quantity || 1,
        prix: evenement.prix || evenement.price || evenement.prixUnitaire || 50.0,
        horodatage: Date.now(),
        devise: "EUR",
      };
      
      console.log("🔐 Contenu QR Code généré:", contenuQR);
      
      const imageQRCode = await QRCode.toDataURL(JSON.stringify(contenuQR), {
        width: 200,
        margin: 2,
        color: { dark: "#0055A4", light: "#FFFFFF" },
      });
      
      console.log("✅ QR Code généré avec succès");
      return imageQRCode;
    } catch (erreur) {
      console.error("❌ Erreur génération QR Code:", erreur);
      return null;
    }
  }, []);

  const sauvegarderBilletsStockage = useCallback((nouveauxBillets) => {
    console.log("💾 Sauvegarde des billets dans le stockage local:", nouveauxBillets);
    try {
      const billetsExistants = JSON.parse(localStorage.getItem(CLE_STOCKAGE) || "[]");
      console.log("📁 Billets existants:", billetsExistants.length);
      
      const billetsMisesAJour = [...billetsExistants, ...nouveauxBillets];
      localStorage.setItem(CLE_STOCKAGE, JSON.stringify(billetsMisesAJour));
      
      console.log("✅ Billets sauvegardés. Total maintenant:", billetsMisesAJour.length);
      console.log("📋 Détails billets sauvegardés:", billetsMisesAJour.map(b => ({
        id: b.id,
        titre: b.titreEvenement,
        quantite: b.quantite,
        prix: b.prix
      })));
    } catch (erreur) {
      console.error("❌ Erreur sauvegarde billets:", erreur);
    }
  }, []);

  const creerBilletsTest = useCallback(async (numeroCommande) => {
    console.log("🧪 Création de billets de test avec numéro:", numeroCommande);
    
    const evenementsTest = [
      { eventId: 1, eventTitle: "Cérémonie d'Ouverture", eventDate: "26 Juillet 2024", eventLocation: "Stade de France", offerType: "Standard", quantite: 2, prix: 150.0 },
      { eventId: 2, eventTitle: "Finale Athlétisme 100m", eventDate: "3 Août 2024", eventLocation: "Stade de France", offerType: "VIP", quantite: 1, prix: 300.0 },
    ];
    
    const billetsGeneres = [];
    const dateAchatISO = new Date().toISOString();

    console.log("📝 Événements test configurés:", evenementsTest);

    for (const evenement of evenementsTest) {
      console.log(`🔄 Génération billet pour: ${evenement.eventTitle}`);
      const qrCode = await genererQRCodePourEvenement(numeroCommande, evenement);
      const billet = {
        id: `${numeroCommande}-${evenement.eventId}`,
        numeroCommande,
        idEvenement: evenement.eventId,
        titreEvenement: evenement.eventTitle,
        dateEvenement: evenement.eventDate,
        lieuEvenement: evenement.eventLocation,
        typeOffre: evenement.offerType,
        quantite: evenement.quantite,
        prix: evenement.prix,
        total: (evenement.prix * evenement.quantite).toFixed(2),
        qrCode,
        dateAchat: dateAchatISO,
        statut: "actif",
      };
      billetsGeneres.push(billet);
      console.log(`✅ Billet créé: ${billet.titreEvenement} - ${billet.quantite}x ${billet.prix}€ = ${billet.total}€`);
    }
    
    console.log("🎉 Tous les billets test générés:", billetsGeneres.length);
    return billetsGeneres;
  }, [genererQRCodePourEvenement]);

  const genererBillets = useCallback(async () => {
    console.log("🚀 DÉBUT - Génération des billets");
    setStatut("Création de vos billets...");
    
    // Debug complet
    debugStockageLocal();
    
    try {
      const panier = JSON.parse(localStorage.getItem("panier_olympiques") || "[]");
      console.log("🛒 Panier récupéré:", panier);
      console.log("📦 Nombre d'articles dans le panier:", panier.length);
      
      let billetsGeneres = [];
      const numeroCommande = "OLY-" + Date.now() + "-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const dateAchatISO = new Date().toISOString();

      console.log("📇 Numéro de commande généré:", numeroCommande);
      console.log("📅 Date d'achat:", dateAchatISO);

      if (sessionId) {
        console.log("🔗 Session ID détecté, récupération données Stripe...");
        await recupererSessionStripe(sessionId);
      } else {
        console.log("⚠️ Aucun Session ID, utilisation données locales");
      }

      if (panier.length === 0) {
        console.log("🛒 Panier vide, création de billets test");
        billetsGeneres = await creerBilletsTest(numeroCommande);
        setTotalStripe("600.00");
        console.log("💰 Total test défini à: 600.00€");
      } else {
        console.log("🛒 Panier contient des articles, création billets réels");
        let totalCalculé = 0;
        
        for (const article of panier) {
          console.log("📋 Traitement article:", {
            nom: article.eventTitle || article.nom,
            prix: article.prix || article.price,
            quantite: article.quantite || article.quantity,
            type: article.offerType || article.type
          });
          
          const qrCode = await genererQRCodePourEvenement(numeroCommande, article);
          const prixUnitaire = article.prix || article.price || article.prixUnitaire || 50.0;
          const quantite = article.quantite || article.quantity || 1;
          const totalArticle = prixUnitaire * quantite;
          totalCalculé += totalArticle;
          
          const billet = {
            id: `${numeroCommande}-${article.eventId || article.id || Date.now()}`,
            numeroCommande,
            idEvenement: article.eventId || article.id || 0,
            titreEvenement: article.eventTitle || article.nom || "Événement Olympique",
            dateEvenement: article.eventDate || article.date || "2024",
            lieuEvenement: article.eventLocation || article.lieu || "Paris",
            typeOffre: article.offerType || article.type || "Standard",
            quantite: quantite,
            prix: prixUnitaire,
            total: totalArticle.toFixed(2),
            qrCode,
            dateAchat: dateAchatISO,
            statut: "actif",
          };
          billetsGeneres.push(billet);
          console.log(`✅ Billet créé: ${billet.titreEvenement} - ${billet.quantite}x ${billet.prix}€ = ${billet.total}€`);
        }
        
        console.log("🧮 Total calculé des billets:", totalCalculé.toFixed(2) + "€");
      }

      console.log("🎫 Tous les billets générés:", billetsGeneres);
      console.log("📊 Résumé commande:", {
        nombreBillets: billetsGeneres.length,
        numeroCommande: numeroCommande,
        totalStripe: totalStripe,
        totalBillets: billetsGeneres.reduce((sum, b) => sum + parseFloat(b.total), 0).toFixed(2)
      });

      setBillets(billetsGeneres);
      sauvegarderBilletsStockage(billetsGeneres);
      
      // Nettoyage du panier
      localStorage.removeItem("panier_olympiques");
      console.log("🗑️ Panier nettoyé");
      
      setChargement(false);
      setStatut("Billets créés avec succès !");
      console.log("✅ PROCESSUS TERMINÉ - Billets prêts");
      
    } catch (erreur) {
      console.error("❌ Erreur création billets:", erreur);
      setStatut("Erreur lors de la création des billets");
      setChargement(false);
    }
  }, [sessionId, recupererSessionStripe, genererQRCodePourEvenement, creerBilletsTest, sauvegarderBilletsStockage, debugStockageLocal]);

  const telechargerBilletPDF = async (billet) => {
    console.log("📄 Téléchargement PDF pour billet:", billet.titreEvenement);
    const elementBillet = document.getElementById(`billet-${billet.id}`);
    if (!elementBillet) {
      console.error("❌ Élément billet non trouvé pour PDF");
      return;
    }
    
    try {
      setStatut(`Génération PDF pour ${billet.titreEvenement}...`);
      console.log("🔄 Conversion en canvas...");
      
      const canvas = await html2canvas(elementBillet, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL("image/png");
      
      console.log("📝 Création PDF...");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`billet-${billet.titreEvenement}-${billet.numeroCommande}.pdf`);
      
      setStatut("PDF téléchargé !");
      console.log("✅ PDF téléchargé avec succès");
      
      setTimeout(() => setStatut(""), 2000);
    } catch (erreur) {
      console.error("❌ Erreur génération PDF:", erreur);
      setStatut("Erreur lors du téléchargement");
    }
  };

  const imprimerBillet = (billet) => {
    console.log("🖨️ Impression billet:", billet.titreEvenement);
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
          console.log("✅ Impression terminée");
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
    genererBillets();
    
    return () => {
      console.log("🧹 SuccessPage démonté");
    };
  }, [genererBillets]);

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
  
  return (
    <div style={{ textAlign: "center", padding: 30, maxWidth: 800, margin: "0 auto" }}>
      <div style={{ background: "linear-gradient(135deg, #0055A4 0%, #EF4135 100%)", color: "white", padding: 30, borderRadius: 15, marginBottom: 30 }}>
        <h1 style={{ margin: 0, fontSize: "2.5em" }}>🎉 Paiement Réussi !</h1>
        <p style={{ fontSize: "1.2em", marginTop: 10, opacity: 0.9 }}>
          Vous avez {billets.length} type{billets.length > 1 ? "s" : ""} de billet{billets.length > 1 ? "s" : ""}
        </p>
        <p style={{ fontSize: "1.1em", marginTop: 5 }}>
          <strong>
            💰 Total payé: {totalStripe !== "0.00" ? totalStripe : billets.reduce((sum, b) => sum + parseFloat(b.total), 0).toFixed(2)} €
          </strong>
        </p>
      </div>

      {billets.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3>
            Numéro de commande: <span style={{ color: "#0055A4" }}>{billets[0].numeroCommande}</span>
          </h3>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 30, flexWrap: "wrap" }}>
        <button
          onClick={() => billets.forEach(telechargerBilletPDF)}
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
          onClick={() => billets.forEach(imprimerBillet)}
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

      {billets.map((billet) => (
        <div key={billet.id} style={{ marginBottom: 30 }}>
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

      {statut && (
        <div style={{ marginTop: 15 }}>
          <p style={{ color: "#0055A4", fontStyle: "italic" }}>{statut}</p>
        </div>
      )}
    </div>
  );
}

export default SuccessPage;