import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import QRCode from 'qrcode';
import { useAuth } from '../../context/AuthContext';

function SuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [qrCodeData, setQrCodeData] = useState(null);
  const [orderNumber, setOrderNumber] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // ✅ Utiliser l'email de l'utilisateur connecté
  const customerEmail = user?.email || "test@example.com";

  // ✅ ENVOYER LE BILLET PAR EMAIL - CORRIGÉ
  const sendTicketByEmail = async (email, orderNum, qrCode) => {
    try {
      setStatus("📧 Envoi de votre billet par email...");
      
      const API_URL = 'https://projet-bloc3.onrender.com';
      console.log('🔗 URL API utilisée:', `${API_URL}/api/email/send-ticket`);
      
      const response = await fetch(`${API_URL}/api/email/send-ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toEmail: email,
          orderNumber: orderNum,
          qrCodeData: qrCode,
          customerEmail: email
        })
      });

      console.log('📨 Statut réponse:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur HTTP:', response.status, errorText);
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      // ✅ Gestion robuste de la réponse
      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.log('⚠️ Réponse non-JSON, considérée comme succès');
        result = { success: true };
      }

      console.log('📩 Réponse serveur:', result);
      
      // ✅ Vérification plus flexible
      if (result.success === true || result.success === undefined) {
        setEmailSent(true);
        setStatus("✅ Billet envoyé ! Vérifiez vos emails");
        console.log('✅ [EMAIL] Email marqué comme envoyé');
        return true;
      } else {
        setStatus("❌ Erreur envoi email");
        console.error('❌ [EMAIL] Erreur envoi:', result.error);
        return false;
      }
    } catch (error) {
      setStatus("❌ Erreur connexion serveur email");
      console.error('❌ [EMAIL] Erreur:', error.message);
      return false;
    }
  };

  // ✅ GÉNÉRATION AUTOMATIQUE - CORRIGÉ
  useEffect(() => {
    const generateTicket = async () => {
      console.log('🚀 [SUCCESS] Début génération du billet...');
      
      let finalSessionId = sessionId || 'test_' + Date.now();

      try {
        setStatus("🎫 Création de votre billet sécurisé...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const newOrderNumber = 'OLY-' + Date.now();
        const firstKey = 'key1-' + Math.random().toString(36).substring(2, 10);
        const secondKey = 'key2-' + Math.random().toString(36).substring(2, 10);
        const finalKey = firstKey + secondKey;

        const qrContent = {
          orderId: newOrderNumber,
          sessionId: finalSessionId,
          finalKey: finalKey,
          purchaseDate: new Date().toISOString(),
          type: 'olympics_ticket_2024',
          event: "Jeux Olympiques Paris 2024",
          timestamp: Date.now()
        };

        const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrContent), {
          width: 300,
          margin: 2,
          color: { dark: '#1e40af', light: '#ffffff' }
        });

        // ✅ Structure complète du billet
        const purchaseDate = new Date().toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        // ✅ Sauvegarde robuste dans localStorage
        const ticketData = {
          id: newOrderNumber,
          orderNumber: newOrderNumber,
          sessionId: finalSessionId,
          qrCode: qrCodeImage,
          finalKey: finalKey,
          status: 'active',
          customer: { 
            email: customerEmail,
            name: user?.name || "Client"
          },
          purchaseDate: purchaseDate,
          total: "0.00",
          items: [
            {
              eventTitle: "Jeux Olympiques Paris 2024",
              offerName: "Billet Standard",
              quantity: 1,
              priceUnit: "0.00"
            }
          ]
        };

        // ✅ Sauvegarde sécurisée
        try {
          const existingTickets = JSON.parse(localStorage.getItem('olympics_tickets') || '[]');
          const updatedTickets = [...existingTickets, ticketData];
          localStorage.setItem('olympics_tickets', JSON.stringify(updatedTickets));
          console.log('💾 [SUCCESS] Billet sauvegardé:', ticketData.orderNumber);
          console.log('📋 Total billets dans localStorage:', updatedTickets.length);
        } catch (storageError) {
          console.error('❌ [SUCCESS] Erreur sauvegarde localStorage:', storageError);
        }

        setQrCodeData(qrCodeImage);
        setOrderNumber(newOrderNumber);
        setStatus("✅ Génération réussie !");

        // ✅ ENVOI EMAIL AUTOMATIQUE
        console.log('📤 Tentative envoi email à:', customerEmail);
        await sendTicketByEmail(customerEmail, newOrderNumber, qrCodeImage);

      } catch (error) {
        console.error('❌ [SUCCESS] Erreur:', error);
        setStatus("❌ Erreur génération");
      } finally {
        setLoading(false);
      }
    };

    // ✅ Vérifier que l'utilisateur est connecté
    if (!user) {
      console.log('🔐 [SUCCESS] Utilisateur non connecté, redirection...');
      navigate('/login');
      return;
    }

    generateTicket();
  }, [sessionId, customerEmail, user, navigate]);

  // ✅ TÉLÉCHARGER LE QR CODE
  const downloadQRCode = () => {
    if (qrCodeData) {
      const link = document.createElement('a');
      link.href = qrCodeData;
      link.download = `billet-olympiques-${orderNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // ✅ RETOUR À L'ACCUEIL
  const goToHome = () => {
    navigate("/");
  };

  // ✅ VERS MES BILLETS
  const goToMyTickets = () => {
    navigate("/my-tickets");
  };

  if (loading) {
    return (
      <div style={{ 
        padding: "50px 20px", 
        textAlign: "center",
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center"
      }}>
        <div style={{ fontSize: "80px", marginBottom: "20px" }}>⏳</div>
        <h2 style={{ color: "#1e40af", marginBottom: "20px" }}>Préparation de votre billet...</h2>
        <p style={{ fontSize: "18px", color: "#6b7280" }}>{status}</p>
        <div style={{ 
          width: "200px", 
          height: "4px", 
          backgroundColor: "#e5e7eb", 
          borderRadius: "2px",
          marginTop: "20px",
          overflow: "hidden"
        }}>
          <div style={{
            width: "100%",
            height: "100%",
            backgroundColor: "#3b82f6",
            animation: "loading 2s ease-in-out infinite"
          }}></div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "30px 20px", maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
      
      {/* EN-TÊTE AVEC INDICATEUR EMAIL */}
      <div style={{ marginBottom: "30px" }}>
        <div style={{ fontSize: "60px", marginBottom: "10px" }}>🎉</div>
        <h1 style={{ color: "#16a34a", fontSize: "2.5rem", marginBottom: "10px" }}>
          Paiement Réussi !
        </h1>
        
        {emailSent ? (
          <div style={{ 
            backgroundColor: "#dcfce7", 
            padding: "15px", 
            borderRadius: "10px", 
            margin: "15px 0",
            border: "2px solid #16a34a"
          }}>
            <h3 style={{ color: "#166534", margin: "0 0 10px 0" }}>
              📧 Billet envoyé à {customerEmail}
            </h3>
            <p style={{ color: "#166534", margin: 0, fontSize: "14px" }}>
              Vérifiez votre boîte email
            </p>
          </div>
        ) : (
          <div style={{ 
            backgroundColor: "#fef3c7", 
            padding: "15px", 
            borderRadius: "10px", 
            margin: "15px 0",
            border: "2px solid #f59e0b"
          }}>
            <h3 style={{ color: "#92400e", margin: "0 0 10px 0" }}>
              ⚠️ Email non envoyé
            </h3>
            <p style={{ color: "#92400e", margin: 0, fontSize: "14px" }}>
              Votre billet a été généré mais l'email n'a pas pu être envoyé
            </p>
          </div>
        )}
        
        {orderNumber && (
          <div style={{ 
            backgroundColor: "#dbeafe", 
            padding: "12px 20px", 
            borderRadius: "8px", 
            display: "inline-block",
            marginTop: "10px"
          }}>
            <p style={{ margin: 0, fontWeight: "bold", color: "#1e40af" }}>
              N° de commande: <span style={{ fontFamily: "monospace" }}>{orderNumber}</span>
            </p>
          </div>
        )}
      </div>

      {/* QR CODE */}
      {qrCodeData && (
        <div style={{ 
          backgroundColor: "white", 
          padding: "30px", 
          borderRadius: "15px", 
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          marginBottom: "30px",
          border: "2px solid #e5e7eb"
        }}>
          <h2 style={{ color: "#1f2937", marginBottom: "20px" }}>Votre Billet Numérique</h2>
          
          <div style={{ 
            display: "inline-block", 
            padding: "20px", 
            backgroundColor: "white", 
            borderRadius: "10px",
            border: "2px dashed #d1d5db"
          }}>
            <img 
              src={qrCodeData} 
              alt="QR Code du billet" 
              style={{ 
                width: "250px", 
                height: "250px",
                display: "block",
                margin: "0 auto"
              }}
            />
          </div>
          
          <p style={{ 
            color: "#6b7280", 
            fontSize: "14px", 
            marginTop: "15px",
            fontStyle: "italic"
          }}>
            Ce QR code est votre billet d'entrée. Gardez-le précieusement.
          </p>
        </div>
      )}

      {/* BOUTONS D'ACTION */}
      <div style={{ 
        display: "flex", 
        gap: "15px", 
        justifyContent: "center",
        flexWrap: "wrap",
        marginBottom: "30px"
      }}>
        {qrCodeData && (
          <button
            onClick={downloadQRCode}
            style={{
              padding: "12px 24px",
              backgroundColor: "#1e40af",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold",
              transition: "background-color 0.2s"
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = "#1e3a8a"}
            onMouseOut={(e) => e.target.style.backgroundColor = "#1e40af"}
          >
            📥 Télécharger le QR Code
          </button>
        )}
        
        <button
          onClick={goToMyTickets}
          style={{
            padding: "12px 24px",
            backgroundColor: "#059669",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
            transition: "background-color 0.2s"
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = "#047857"}
          onMouseOut={(e) => e.target.style.backgroundColor = "#059669"}
        >
          🎫 Voir Mes Billets
        </button>
        
        <button
          onClick={goToHome}
          style={{
            padding: "12px 24px",
            backgroundColor: "#6b7280",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
            transition: "background-color 0.2s"
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = "#4b5563"}
          onMouseOut={(e) => e.target.style.backgroundColor = "#6b7280"}
        >
          🏠 Retour à l'Accueil
        </button>
      </div>

      {/* INFORMATIONS DE SÉCURITÉ */}
      <div style={{ 
        backgroundColor: "#fef3c7",
        padding: "20px",
        borderRadius: "10px",
        border: "1px solid #f59e0b",
        textAlign: "left"
      }}>
        <h3 style={{ color: "#92400e", marginBottom: "10px" }}>🛡️ Informations importantes</h3>
        <ul style={{ color: "#92400e", margin: 0, paddingLeft: "20px" }}>
          <li>Conservez ce QR code en lieu sûr</li>
          <li>Présentez-le à l'entrée de l'événement</li>
          <li>Ne le partagez avec personne</li>
          <li>Une copie a été envoyée par email</li>
        </ul>
      </div>

      {/* Style pour l'animation de loading */}
      <style>
        {`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(0%); }
            100% { transform: translateX(100%); }
          }
        `}
      </style>
    </div>
  );
}

export default SuccessPage;