package com.olympics.tickets.backend.controller;

import com.olympics.tickets.backend.service.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/email")
@CrossOrigin(origins = "*")
public class EmailController {

    private final EmailService emailService;

    public EmailController(EmailService emailService) {
        this.emailService = emailService;
        System.out.println("✅ EmailController initialisé avec Mailtrap");
    }

    // 🎫 ENDPOINT CORRIGÉ POUR FRONTEND
    @PostMapping("/send-ticket")
    public ResponseEntity<?> sendTicket(@RequestBody Map<String, Object> request) {
        try {
            System.out.println("📧 REQUÊTE REÇUE - Send Ticket:");
            System.out.println("   Données reçues: " + request);

            // Récupération des champs du frontend
            String toEmail = (String) request.get("toEmail");
            String orderNumber = (String) request.get("orderNumber");
            String qrCodeData = (String) request.get("qrCodeData");
            String total = (String) request.get("total");
            String purchaseDate = (String) request.get("purchaseDate");

            // 🔹 FORCER l'email vers Mailtrap
            String mailtrapEmail = "d0c004224e85f3@inbox.mailtrap.io";

            System.out.println("   📧 Email original: " + toEmail);
            System.out.println("   📧 Email forcé vers: " + mailtrapEmail);
            System.out.println("   📦 Commande: " + orderNumber);

            if (orderNumber == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Numéro de commande requis"
                ));
            }

            // Créer les données du ticket
            Map<String, Object> ticketData = Map.of(
                    "purchaseDate", purchaseDate != null ? purchaseDate : new java.util.Date().toString(),
                    "total", total != null ? total : "50.00",
                    "orderNumber", orderNumber
            );

            // Envoyer l'email via Mailtrap
            boolean success = emailService.sendTicket(mailtrapEmail, orderNumber, qrCodeData, ticketData);

            return ResponseEntity.ok(Map.of(
                    "success", success,
                    "message", success ? "Email envoyé avec succès à Mailtrap" : "Échec envoi email",
                    "customerEmail", mailtrapEmail,
                    "orderNumber", orderNumber,
                    "sandboxUrl", "https://mailtrap.io/inboxes"
            ));

        } catch (Exception e) {
            System.err.println("❌ ERREUR CONTROLLER: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Erreur serveur: " + e.getMessage()
            ));
        }
    }

    // 🔧 TEST DE CONFIGURATION MAILTRAP
    @GetMapping("/test-config")
    public ResponseEntity<?> testEmailConfig() {
        System.out.println("🧪 Test configuration Mailtrap");
        String result = emailService.quickTest();
        return ResponseEntity.ok(Map.of("message", result));
    }

    // 🩹 ENDPOINT DE SANTÉ
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        return ResponseEntity.ok(Map.of(
                "status", "OK",
                "service", "Email Service - Mailtrap",
                "timestamp", System.currentTimeMillis(),
                "mailtrapUrl", "https://mailtrap.io/inboxes"
        ));
    }
}