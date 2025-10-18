package com.olympics.tickets.backend.service;

import org.springframework.stereotype.Service;
import java.util.List;
import java.util.ArrayList; // ✅ IMPORT AJOUTÉ SI NÉCESSAIRE

@Service
public class PaymentService {

    private final EmailService emailService;

    public PaymentService(EmailService emailService) {
        this.emailService = emailService;
    }

    // ✅ CORRECTION : UTILISER LA BONNE MÉTHODE
    public void processPaymentSuccess(String customerEmail, List<Object> tickets) {
        System.out.println("💰 Paiement réussi pour: " + customerEmail);

        // Utiliser la méthode qui existe dans EmailService
        emailService.sendTicketsEmail(customerEmail, tickets);
    }

    // ✅ VERSION ALTERNATIVE SI VOUS N'AVEZ PAS DE TICKETS
    public void processPaymentSuccess(String customerEmail) {
        System.out.println("💰 Paiement réussi pour: " + customerEmail);

        // Créer une liste vide ou utiliser une autre méthode
        List<Object> emptyTickets = new ArrayList<>();
        emailService.sendTicketsEmail(customerEmail, emptyTickets);
    }
}