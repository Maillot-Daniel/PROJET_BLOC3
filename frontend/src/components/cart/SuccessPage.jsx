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

  // Récupération utilisateur depuis localStorage
  const getCurrentUser = () => {
    try {
      const userData = JSON.parse(localStorage.getItem("user_data") || localStorage.getItem("user") || "null");
      if (userData && userData.email) return userData;
      return { email: "test@mailtrap.io", name: "Test User" }; // Mailtrap sandbox
    } catch (error) {
      return { email: "test@mailtrap.io", name: "Test User" };
    }
  };

  const currentUser = getCurrentUser();
  const customerEmail = currentUser?.email;

  // Sauvegarde billet
  const saveTicketToStorage = (ticketData) => {
    const tickets = [ticketData];
    localStorage.setItem("oly_tickets", JSON.stringify(tickets));
    localStorage.setItem("last_user_email", customerEmail);
    console.log("💾 Billet sauvegardé:", ticketData);
  };

  // Génération QR Code
  const generateQRCodeForTicket = async (orderData) => {
    const qrContent = {
      orderId: orderData.orderNumber,
      purchaseDate: new Date().toISOString(),
      type: "olympics_ticket_2024",
      customer: customerEmail,
    };
    const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrContent), { width: 300, margin: 2 });
    return qrCodeImage;
  };

  // Télécharger PDF
  const downloadPDF = async () => {
    const element = document.getElementById("ticket-pdf");
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${orderNumber}.pdf`);
  };

  useEffect(() => {
    const generateTicket = async () => {
      setStatus("🎫 Création de votre billet...");
      const newOrderNumber = "OLY-" + Date.now();
      const qrResult = await generateQRCodeForTicket({ orderNumber: newOrderNumber });

      const ticketData = {
        id: newOrderNumber,
        orderNumber: newOrderNumber,
        sessionId: sessionId || "direct-" + Date.now(),
        qrCode: qrResult,
        status: "active",
        customer: { email: customerEmail, name: currentUser?.name || "Client" },
        purchaseDate: new Date().toLocaleString("fr-FR"),
        total: "50.00",
        items: [{ eventTitle: "Jeux Olympiques Paris 2024", offerName: "Billet Standard", quantity: 1, priceUnit: "50.00" }],
      };

      saveTicketToStorage(ticketData);
      setQrCodeData(qrResult);
      setOrderNumber(newOrderNumber);
      setStatus("✅ Billet créé !");
      setLoading(false);

      // Envoi email vers Mailtrap
      try {
        const API_URL = "https://projet-bloc3.onrender.com/api/email/send-ticket";
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toEmail: customerEmail, orderNumber: newOrderNumber, qrCodeData: qrResult, total: "50.00" }),
        });
        if (response.ok) setEmailSent(true);
        else console.error("Erreur serveur email");
      } catch (err) {
        console.error("Erreur envoi email:", err);
      }
    };
    generateTicket();
  }, [customerEmail, currentUser, sessionId]);

  if (loading)
    return (
      <div style={{ padding: 50, textAlign: "center" }}>
        <h2>{status}</h2>
      </div>
    );

  return (
    <div style={{ textAlign: "center", padding: 30 }}>
      <h1>🎉 Paiement réussi !</h1>
      {emailSent && <p>📧 Billet envoyé à {customerEmail}</p>}
      <div id="ticket-pdf" style={{ border: "1px solid #ddd", padding: 20, display: "inline-block" }}>
        <h3>Commande: {orderNumber}</h3>
        <p>Date d'achat: {new Date().toLocaleString("fr-FR")}</p>
        <p>Total: 50.00 €</p>
        <img src={qrCodeData} alt="QR Code billet" style={{ width: 250, height: 250 }} />
      </div>
      <div style={{ marginTop: 20 }}>
        <button onClick={downloadPDF}>📄 Télécharger PDF</button>
      </div>
    </div>
  );
}

export default SuccessPage;
