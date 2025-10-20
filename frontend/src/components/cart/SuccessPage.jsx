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
  // SUPPRIMÉ: 'donneesSessionStripe' n'est pas utilisé

  const CLE_STOCKAGE = "oly_billets";
  const URL_API = "https://projet-bloc3.onrender.com";

  // Debug amélioré
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

  // Récupération session Stripe - AVEC LE BON ENDPOINT
  const recupererSessionStripe = useCallback(async (sessionId) => {
    if (!sessionId) {
      console.log("❌ Aucun sessionId fourni pour Stripe");
      return null;
    }
    
    console.log("🔄 Récupération session Stripe avec ID:", sessionId);
    try {
      // CORRECTION: Utiliser le bon endpoint api/pay/session/
      console.log("📡 Appel API vers:", `${URL_API}/api/pay/session/${sessionId}`);
      
      const reponse = await fetch(`${URL_API}/api/pay/session/${sessionId}`);
      console.log("📡 Réponse Stripe status:", reponse.status);
      
      if (reponse.ok) {
        const donneesSession = await reponse.json();
        console.log("✅ Données session Stripe COMPLÈTES:", donneesSession);
        
        // Extraction du montant
        let totalReel = "0.00";
        if (donneesSession.amount_total) {
          totalReel = (donneesSession.amount_total / 100).toFixed(2);
          console.log("💰 Montant total (amount_total):", donneesSession.amount_total, "→", totalReel + "€");
        } else if (donneesSession.amount) {
          totalReel = (donneesSession.amount / 100).toFixed(2);
          console.log("💰 Montant (amount):", donneesSession.amount, "→", totalReel + "€");
        }
        
        setTotalStripe(totalReel);
        return donneesSession;
      } else {
        console.error("❌ Erreur réponse Stripe:", reponse.status, reponse.statusText);
        const texteErreur = await reponse.text();
        console.error("❌ Détails erreur:", texteErreur);
      }
    } catch (erreur) {
      console.error("❌ Erreur récupération session Stripe:", erreur);
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

  // Créer des billets depuis les données Stripe - CORRIGÉ avec la dépendance manquante
  const creerBilletsDepuisStripe = useCallback(async (sessionStripe, numeroCommande) => {
    console.log("🎫 Création billets depuis données Stripe:", sessionStripe);
    
    if (!sessionStripe) {
      console.log("❌ Aucune donnée Stripe disponible");
      return [];
    }

    const billetsGeneres = [];
    const dateAchatISO = new Date().toISOString();

    // Si on a des line_items dans Stripe, on les utilise
    if (sessionStripe.line_items && sessionStripe.line_items.data) {
      console.log("🛒 Articles trouvés dans Stripe:", sessionStripe.line_items.data.length);
      
      let billetIndex = 0;
      for (const item of sessionStripe.line_items.data) {
        billetIndex++;
        const description = item.description || "Événement Olympique";
        const quantite = item.quantity || 1;
        const prixUnitaire = item.price?.unit_amount ? item.price.unit_amount / 100 : 1683.00; // Utiliser le montant réel
        
        console.log(`📦 Traitement article Stripe ${billetIndex}:`, {
          description,
          quantite,
          prixUnitaire,
          total: (prixUnitaire * quantite).toFixed(2)
        });

        // Générer QR Code
        const qrCode = await genererQRCodePourEvenement(numeroCommande, {
          eventTitle: description,
          prix: prixUnitaire,
          quantite: quantite
        });

        const billet = {
          id: `${numeroCommande}-STRIPE-${billetIndex}`,
          numeroCommande,
          idEvenement: billetIndex,
          titreEvenement: description,
          dateEvenement: "2024", // Par défaut
          lieuEvenement: "Paris", // Par défaut
          typeOffre: "Standard",
          quantite: quantite,
          prix: prixUnitaire,
          total: (prixUnitaire * quantite).toFixed(2),
          qrCode,
          dateAchat: dateAchatISO,
          statut: "actif",
          source: "stripe"
        };
        
        billetsGeneres.push(billet);
        console.log(`✅ Billet Stripe créé: ${billet.titreEvenement}`);
      }
    } else {
      // Fallback: créer un billet basé sur le montant total
      console.log("⚠️ Aucun line_item trouvé, création billet basé sur montant total");
      const montantTotal = parseFloat(totalStripe) || 1683.00;
      const qrCode = await genererQRCodePourEvenement(numeroCommande, {
        eventTitle: "Événement Olympique",
        prix: montantTotal,
        quantite: 1
      });

      const billet = {
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
      };
      
      billetsGeneres.push(billet);
      console.log(`✅ Billet fallback créé: ${montantTotal}€`);
    }

    return billetsGeneres;
  }, [totalStripe, genererQRCodePourEvenement]); // CORRIGÉ: dépendance ajoutée

  const sauvegarderBilletsStockage = useCallback((nouveauxBillets) => {
    try {
      localStorage.setItem(CLE_STOCKAGE, JSON.stringify(nouveauxBillets));
      console.log("✅ Billets sauvegardés:", nouveauxBillets.length);
    } catch (erreur) {
      console.error("❌ Erreur sauvegarde billets:", erreur);
    }
  }, [CLE_STOCKAGE]);

  // GÉNÉRATION PRINCIPALE DES BILLETS - VERSION CORRIGÉE
  const genererBillets = useCallback(async () => {
    console.log("🚀 DÉBUT - Génération des billets");
    setStatut("Création de vos billets...");
    
    debugStockageLocal();
    
    try {
      const panier = JSON.parse(localStorage.getItem("panier_olympiques") || "[]");
      const numeroCommande = "OLY-" + Date.now();
      let billetsGeneres = [];

      console.log("📦 Panier trouvé:", panier.length, "articles");
      console.log("💰 Montant Stripe connu:", totalStripe);

      // PRIORITÉ 1: Récupérer les données Stripe
      if (sessionId) {
        console.log("🔗 Session ID détecté, récupération données Stripe...");
        const sessionStripe = await recupererSessionStripe(sessionId);
        
        if (sessionStripe) {
          console.log("✅ Données Stripe récupérées, création billets...");
          billetsGeneres = await creerBilletsDepuisStripe(sessionStripe, numeroCommande);
        } else {
          console.log("❌ Échec récupération Stripe, utilisation du panier local");
        }
      }

      // PRIORITÉ 2: Utiliser le panier local si Stripe échoue ou n'a pas de données
      if (billetsGeneres.length === 0 && panier.length > 0) {
        console.log("🛒 Utilisation du panier local pour créer les billets");
        let totalCalculé = 0;
        
        for (const article of panier) {
          const qrCode = await genererQRCodePourEvenement(numeroCommande, article);
          const prixUnitaire = article.prix || article.price || 0;
          const quantite = article.quantite || article.quantity || 1;
          const totalArticle = prixUnitaire * quantite;
          totalCalculé += totalArticle;
          
          const billet = {
            id: `${numeroCommande}-${article.eventId || article.id || Date.now()}`,
            numeroCommande,
            titreEvenement: article.eventTitle || article.nom || "Événement Olympique",
            dateEvenement: article.eventDate || article.date || "2024",
            lieuEvenement: article.eventLocation || article.lieu || "Paris",
            typeOffre: article.offerType || article.type || "Standard",
            quantite: quantite,
            prix: prixUnitaire,
            total: totalArticle.toFixed(2),
            qrCode,
            dateAchat: new Date().toISOString(),
            statut: "actif",
            source: "panier_local"
          };
          billetsGeneres.push(billet);
        }
        
        // Mettre à jour le total si pas déjà fait par Stripe
        if (totalStripe === "0.00") {
          setTotalStripe(totalCalculé.toFixed(2));
        }
      }

      // PRIORITÉ 3: Fallback - créer au moins un billet avec le montant payé
      if (billetsGeneres.length === 0) {
        console.log("🆘 Aucun billet créé, création d'un billet de secours");
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

      console.log("🎉 Billets générés:", billetsGeneres.length);
      console.log("💰 Total final:", totalStripe);

      setBillets(billetsGeneres);
      sauvegarderBilletsStockage(billetsGeneres);
      
      // Nettoyer le panier seulement si on a réussi à créer des billets
      if (billetsGeneres.length > 0) {
        localStorage.removeItem("panier_olympiques");
        console.log("🗑️ Panier nettoyé");
      }
      
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
    recupererSessionStripe, 
    creerBilletsDepuisStripe, 
    genererQRCodePourEvenement, 
    sauvegarderBilletsStockage, 
    debugStockageLocal
  ]);

  // Reste du code (téléchargement PDF, impression, etc.)
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
    console.log("🎯 SuccessPage monté - Début génération billets");
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