import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import QRCode from 'qrcode';

function SuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [qrCodeData, setQrCodeData] = useState(null);
  const [orderNumber, setOrderNumber] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("test@example.com");
  const navigate = useNavigate();

  // ✅ ENVOYER LE BILLET PAR EMAIL
  const sendTicketByEmail = async (email, orderNum, qrCode) => {
    try {
      setStatus("📧 Envoi de votre billet par email...");
      
      const response = await fetch('http://localhost:8080/api/email/send-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toEmail: email,
          orderNumber: orderNum,
          qrCodeData: qrCode
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setEmailSent(true);
        setStatus("✅ Billet envoyé ! Vérifiez Mailtrap");
        console.log('✅ [EMAIL] Billet envoyé avec succès à:', email);
        return true;
      } else {
        setStatus("❌ Erreur envoi email - Voir les logs");
        console.error('❌ [EMAIL] Erreur envoi:', result.error);
        return false;
      }
    } catch (error) {
      setStatus("❌ Erreur connexion serveur email");
      console.error('❌ [EMAIL] Erreur:', error);
      return false;
    }
  };

  // ✅ GÉNÉRATION AUTOMATIQUE
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

        // Sauvegarde
        const existingTickets = JSON.parse(localStorage.getItem('olympics_tickets') || '[]');
        if (!existingTickets.some(ticket => ticket.sessionId === finalSessionId)) {
          const ticketData = {
            id: newOrderNumber,
            orderNumber: newOrderNumber,
            sessionId: finalSessionId,
            qrCode: qrCodeImage,
            finalKey: finalKey,
            status: 'active',
            customer: { email: customerEmail }
          };
          localStorage.setItem('olympics_tickets', JSON.stringify([...existingTickets, ticketData]));
        }

        setQrCodeData(qrCodeImage);
        setOrderNumber(newOrderNumber);
        setStatus("✅ Génération réussie !");

        // ✅ ENVOI EMAIL AUTOMATIQUE
        await sendTicketByEmail(customerEmail, newOrderNumber, qrCodeImage);

      } catch (error) {
        console.error('❌ [SUCCESS] Erreur:', error);
        setStatus("❌ Erreur génération");
      } finally {
        setLoading(false);
      }
    };

    generateTicket();
  }, [sessionId, customerEmail]);

  // ... (le reste du code d'affichage) ...

  return (
    <div style={{ padding: "30px 20px", maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
      
      {/* EN-TÊTE AVEC INDICATEUR EMAIL */}
      <div style={{ marginBottom: "30px" }}>
        <div style={{ fontSize: "60px", marginBottom: "10px" }}>🎉</div>
        <h1 style={{ color: "#16a34a", fontSize: "2.5rem", marginBottom: "10px" }}>
          Paiement Réussi !
        </h1>
        
        {emailSent && (
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
              Vérifiez votre boîte Mailtrap et les pièces jointes
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

      {/* ... (le reste identique) ... */}

    </div>
  );
}

export default SuccessPage;