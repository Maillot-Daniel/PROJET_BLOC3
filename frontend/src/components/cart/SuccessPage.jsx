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
  const navigate = useNavigate();

  console.log('🎉 [SUCCESS] Page chargée - sessionId:', sessionId);

  // ✅ GÉNÉRATION AUTOMATIQUE DU QR CODE
  useEffect(() => {
    const generateTicket = async () => {
      console.log('🚀 [SUCCESS] Génération du billet...');
      
      if (!sessionId) {
        console.error('❌ [SUCCESS] Session ID manquant');
        setStatus("❌ Session de paiement invalide");
        setLoading(false);
        return;
      }

      try {
        setStatus("Création de votre billet sécurisé...");
        
        // Générer les clés
        const firstKey = 'key1-' + Math.random().toString(36).substring(2, 15);
        const secondKey = 'key2-' + Math.random().toString(36).substring(2, 15);
        const finalKey = firstKey + secondKey;

        const orderNumber = 'CMD-' + Date.now();
        
        const qrContent = {
          orderId: orderNumber,
          finalKey: finalKey,
          sessionId: sessionId,
          purchaseDate: new Date().toISOString(),
          type: 'olympics_ticket_2024'
        };

        console.log('📝 [SUCCESS] Contenu QR:', qrContent);

        const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrContent), {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        // Sauvegarder
        const ticketData = {
          id: orderNumber,
          orderNumber: orderNumber,
          sessionId: sessionId,
          purchaseDate: new Date().toISOString(),
          qrCode: qrCodeImage,
          finalKey: finalKey,
          status: 'active'
        };

        const existingTickets = JSON.parse(localStorage.getItem('olympics_tickets') || '[]');
        existingTickets.push(ticketData);
        localStorage.setItem('olympics_tickets', JSON.stringify(existingTickets));

        setQrCodeData(qrCodeImage);
        setOrderNumber(orderNumber);
        setStatus("✅ Votre billet est prêt !");
        
        console.log('✅ [SUCCESS] Billet généré et sauvegardé');

      } catch (error) {
        console.error('❌ [SUCCESS] Erreur:', error);
        setStatus("❌ Erreur lors de la génération du billet");
      } finally {
        setLoading(false);
      }
    };

    generateTicket();
  }, [sessionId]);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2>⏳ Traitement en cours...</h2>
        <p>{status}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "30px", maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
      <h2 style={{ color: "#16a34a" }}>🎉 Paiement Réussi !</h2>
      
      <p>Votre paiement a été confirmé. Voici votre billet :</p>

      {orderNumber && (
        <p><strong>N° Commande:</strong> {orderNumber}</p>
      )}

      <div style={{ margin: "20px 0", padding: "20px", backgroundColor: "white", borderRadius: "12px", display: "inline-block" }}>
        {qrCodeData ? (
          <div>
            <img src={qrCodeData} alt="QR Code billet" style={{ width: "300px", height: "300px", borderRadius: "8px" }} />
            <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
              📱 Présentez ce QR Code à l'entrée
            </p>
          </div>
        ) : (
          <p>❌ Impossible de générer le QR Code</p>
        )}
      </div>

      <div style={{ marginTop: "20px" }}>
        <button 
          onClick={() => window.print()} 
          style={{ padding: "10px 20px", margin: "5px", backgroundColor: "#7c3aed", color: "white", border: "none", borderRadius: "8px" }}
        >
          🖨️ Imprimer
        </button>
        <button 
          onClick={() => navigate('/my-tickets')} 
          style={{ padding: "10px 20px", margin: "5px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "8px" }}
        >
          📋 Mes billets
        </button>
      </div>

      {status && (
        <p style={{ marginTop: "15px", color: status.startsWith("❌") ? "#dc2626" : "#16a34a" }}>
          {status}
        </p>
      )}
    </div>
  );
}

export default SuccessPage;