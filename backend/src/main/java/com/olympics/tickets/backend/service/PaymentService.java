package com.olympics.tickets.backend.service;

import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;

@Service
public class PaymentService {

    private final EmailService emailService;

    public PaymentService(EmailService emailService) {
        this.emailService = emailService;
    }

    /**
     * ⚡ Méthode principale pour traiter un paiement réussi
     * @param customerEmail Email du client
     * @param tickets Liste de tickets (chaque ticket est un Map<String,Object>)
     */
    public void processPaymentSuccess(String customerEmail, List<Object> tickets) {
        System.out.println("💰 Paiement réussi pour: " + customerEmail);

        if (tickets == null || tickets.isEmpty()) {
            System.out.println("⚠️ Aucun ticket à envoyer pour cet utilisateur");
            return;
        }

        // Parcourir chaque ticket et envoyer l'email via EmailService
        for (Object t : tickets) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> ticketData = (Map<String, Object>) t;

                String orderNumber = (String) ticketData.get("orderNumber");
                String qrCodeBase64 = (String) ticketData.get("qrCode");

                boolean sent = emailService.sendOlympicsTicket(customerEmail, orderNumber, qrCodeBase64, ticketData);
                System.out.println("📧 Envoi email billet #" + orderNumber + " : " + (sent ? "✅ Réussi" : "❌ Échec"));

            } catch (Exception e) {
                System.err.println("❌ Erreur envoi ticket pour " + customerEmail + ": " + e.getMessage());
                e.printStackTrace();
            }
        }
    }

    /**
     * ⚡ Méthode alternative pour paiement sans tickets
     */
    public void processPaymentSuccess(String customerEmail) {
        System.out.println("💰 Paiement réussi pour: " + customerEmail + " (pas de tickets à envoyer)");
    }
}
