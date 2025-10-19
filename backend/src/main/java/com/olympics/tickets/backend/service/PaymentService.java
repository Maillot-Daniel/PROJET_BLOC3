package com.olympics.tickets.backend.service;

import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;

@Service
public class PaymentService {

    private final EmailService emailService;

    public PaymentService(EmailService emailService) {
        this.emailService = emailService;
        System.out.println("✅ PaymentService initialisé avec email fixe");
    }

    public void processPaymentSuccess(String customerEmail, List<Object> tickets) {
        System.out.println("💰 Paiement réussi pour: " + customerEmail);
        System.out.println("🎫 Nombre de tickets à envoyer: " + (tickets != null ? tickets.size() : 0));

        if (tickets == null || tickets.isEmpty()) {
            System.out.println("⚠️ Aucun ticket à envoyer");
            sendConfirmationEmail(customerEmail);
            return;
        }

        // Envoyer un email pour chaque ticket
        int successCount = 0;
        for (Object ticketObj : tickets) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> ticketData = (Map<String, Object>) ticketObj;

                String orderNumber = (String) ticketData.get("orderNumber");
                String qrCodeBase64 = (String) ticketData.get("qrCode");

                System.out.println("📧 Envoi billet #" + orderNumber + " (client: " + customerEmail + ")");

                // ✅ EmailService utilise déjà l'email fixe automatiquement
                boolean sent = emailService.sendTicket(customerEmail, orderNumber, qrCodeBase64, ticketData);

                if (sent) {
                    successCount++;
                    System.out.println("✅ Email envoyé: " + orderNumber);
                } else {
                    System.err.println("❌ Échec envoi: " + orderNumber);
                }

            } catch (Exception e) {
                System.err.println("❌ Erreur envoi ticket: " + e.getMessage());
            }
        }

        System.out.println("📊 Résultat: " + successCount + "/" + tickets.size() + " emails envoyés vers Mailtrap");
    }

    private void sendConfirmationEmail(String customerEmail) {
        try {
            Map<String, Object> simpleData = Map.of(
                    "purchaseDate", new java.util.Date().toString(),
                    "total", "0.00",
                    "eventTitle", "Événement Olympique"
            );

            boolean sent = emailService.sendTicket(customerEmail,
                    "CONF-" + System.currentTimeMillis(), null, simpleData);

            System.out.println("📧 Email confirmation: " + (sent ? "✅" : "❌"));

        } catch (Exception e) {
            System.err.println("❌ Erreur email confirmation: " + e.getMessage());
        }
    }
}