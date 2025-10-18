import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import QRCode from "qrcode";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

function SuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [qrCodeData, setQrCodeData] = useState(null);
  const [orderNumber, setOrderNumber] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  // 🔹 Remplace ici par ton adresse Mailtrap
  const MAILTRAP_EMAIL = "ton_mailtrap_id@inbox.mailtrap.io";

  // ✅ Récupération utilisateur depuis localStorage
  const getCurrentUser = () => {
    try {
      const userData = JSON.parse(
        localStorage.getItem("user_data") || localStorage.getItem("user") || "null"
      );
      return userData && userData.email ? userData : { email: MAILTRAP_EMAIL, name: "Test User" };
    } catch {
      return { email: MAILTRAP_EMAIL, name: "Test User" };
    }
  };

  const currentUser = getCurrentUser();
  const customerEmail = currentUser?.email || MAILTRAP_EMAIL;

  // ✅ Sauvegarde ticket
  const saveTicketToStorage = (ticketData) => {
    try {
      const tickets = [ticketData]; // stocke juste ce billet
      localStorage.setItem("oly_tickets", JSON.stringify(tickets));
      localStorage.setItem("last_user_email", customerEmail);
    } catch (error) {
      console.error("Erreur sauvegarde billet:", error);
    }
  };

  // ✅ Génération QR code
  const generateQRCodeForTicket = async (orderNumber) => {
    try {
      const qrContent = {
        orderId: orderNumber,
        timestamp: Date.now(),
        customer: customerEmail,
      };
      const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrContent), { width: 300 });
      return qrCodeImage;
    } catch (error) {
      console.error("Erreur génération QR Code:", error);
      return null;
    }
  };

  // ✅ Télécharger en PDF
  const downloadPDF = async () => {
    const ticketElement = document.getElementById("ticket-pdf");
    if (!ticketElement) return;

    const canvas = await html2canvas(ticketElement);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`ticket-${orderNumber}.pdf`);
  };

  useEffect(() => {
    const generateTicket = async () => {
      setStatus("Création de votre billet...");

      const newOrderNumber =
        "OLY-" + Date.now() + "-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      setOrderNumber(newOrderNumber);

      const qrResult = await generateQRCodeForTicket(newOrderNumber);
      setQrCodeData(qrResult);

      const totalAmount = "50.00"; // ⚡ À remplacer par montant réel
      const purchaseDateISO = new Date().toISOString();

      const ticketData = {
        id: newOrderNumber,
        orderNumber: newOrderNumber,
        sessionId: sessionId || "direct-" + Date.now(),
        qrCode: qrResult,
        status: "active",
        customer: { email: customerEmail, name: currentUser?.name || "Client" },
        purchaseDate: purchaseDateISO,
        total: totalAmount,
        items: [{ eventTitle: "Jeux Olympiques Paris 2024", offerName: "Billet Standard", quantity: 1, priceUnit: totalAmount }],
      };

      saveTicketToStorage(ticketData);

      // ✅ Envoi email
      try {
        const API_URL = "https://projet-bloc3.onrender.com";
        const response = await fetch(`${API_URL}/api/email/send-ticket`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            toEmail: customerEmail,
            orderNumber: newOrderNumber,
            qrCodeData: qrResult,
            total: totalAmount,
            purchaseDate: purchaseDateISO,
          }),
        });

        const data = await response.json();
        console.log("📩 Réponse serveur email:", data);

        if (response.ok) setEmailSent(true);
      } catch (error) {
        console.error("❌ Erreur envoi email:", error);
      }

      setLoading(false);
      setStatus("Billet créé avec succès !");
    };

    generateTicket();
  }, []);

  const formatDate = (isoString) => {
    if (!isoString) return "Date non disponible";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Date invalide";
    return date.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: 50 }}>
        <h2>{status}</h2>
        <p>⏳ Veuillez patienter...</p>
      </div>
    );

  return (
    <div style={{ textAlign: "center", padding: 30 }}>
      <h1>🎉 Paiement réussi !</h1>
      {emailSent && <p>📧 Billet envoyé à {customerEmail}</p>}
      {orderNumber && <p>N° de commande: {orderNumber}</p>}

      {qrCodeData && (
        <div id="ticket-pdf" style={{ border: "2px solid #000", padding: 20, display: "inline-block" }}>
          <h2>Votre Billet Numérique</h2>
          <img src={qrCodeData} alt="QR Code" width={250} />
          <p>Présentez ce QR code à l'entrée</p>
          <p>Date d'achat: {formatDate(new Date().toISOString())}</p>
          <p>Total: 50.00 €</p>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <button onClick={downloadPDF} style={{ padding: 10, margin: 5 }}>
          🖨️ Télécharger PDF
        </button>
      </div>
    </div>
  );
}

export default SuccessPage;
