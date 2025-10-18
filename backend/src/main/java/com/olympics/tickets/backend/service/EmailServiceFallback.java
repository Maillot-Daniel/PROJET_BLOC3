package com.olympics.tickets.backend.service;

import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@Primary // ✅ CE SERVICE SERA UTILISÉ SI EmailService N'EST PAS DISPONIBLE
public class EmailServiceFallback {

    public EmailServiceFallback() {
        System.out.println("🔄 EmailServiceFallback initialisé - Mode simulation");
    }

    public boolean sendTicket(String toEmail, String orderNumber, String qrCodeBase64) {
        System.out.println("📧 [SIMULATION] Email envoyé à: " + toEmail + " - Commande: " + orderNumber);
        return true; // Simulation réussie
    }

    public String quickTest() {
        System.out.println("🧪 [SIMULATION] Test Mailtrap simulé");
        return "✅ Test simulé - Service email non configuré en production";
    }

    public boolean sendOlympicsTicket(String customerEmail, String orderNumber, String qrCodeBase64) {
        System.out.println("🎫 [SIMULATION] Billet Olympiques pour: " + customerEmail);
        return true;
    }

    public void sendTicketsEmail(String customerEmail, List<Object> tickets) {
        System.out.println("📧 [SIMULATION] Envoi de " + tickets.size() + " billets à: " + customerEmail);
    }
}