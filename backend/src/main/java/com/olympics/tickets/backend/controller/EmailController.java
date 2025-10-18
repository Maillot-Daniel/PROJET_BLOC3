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
        System.out.println("✅ EmailController initialisé");
    }

    // 🔧 TEST DE CONFIGURATION
    @GetMapping("/test-config")
    public ResponseEntity<?> testEmailConfig() {
        System.out.println("🧪 Appel test configuration email");
        String result = emailService.quickTest();
        return ResponseEntity.ok(Map.of("message", result));
    }

    // 🎫 ENVOI DE BILLET
    @PostMapping("/send-ticket")
    public ResponseEntity<?> sendTicket(@RequestBody Map<String, Object> request) {
        try {
            System.out.println("📧 REQUÊTE REÇUE - Send Ticket:");
            System.out.println("   Données: " + request);

            String customerEmail = (String) request.get("customerEmail");
            String orderNumber = (String) request.get("orderNumber");
            Map<String, Object> ticketData = (Map<String, Object>) request.get("ticketData");

            String qrCodeBase64 = null;
            if (ticketData != null) {
                qrCodeBase64 = (String) ticketData.get("qrCode");
                System.out.println("   📦 Order: " + orderNumber);
                System.out.println("   📧 Email: " + customerEmail);
                System.out.println("   🖼️  QR Code: " + (qrCodeBase64 != null ? "Présent" : "Absent"));
            }

            if (customerEmail == null || orderNumber == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Email et numéro de commande requis"
                ));
            }

            boolean success = emailService.sendOlympicsTicket(customerEmail, orderNumber, qrCodeBase64, ticketData);

            return ResponseEntity.ok(Map.of(
                    "success", success,
                    "message", success ? "Email envoyé avec succès" : "Échec envoi email",
                    "customerEmail", customerEmail,
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

    // 🩹 ENDPOINT DE SANTÉ
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        return ResponseEntity.ok(Map.of(
                "status", "OK",
                "service", "Email Service",
                "timestamp", System.currentTimeMillis()
        ));
    }
}