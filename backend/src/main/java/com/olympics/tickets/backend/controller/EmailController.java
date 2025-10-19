package com.olympics.tickets.backend.controller;

import com.olympics.tickets.backend.service.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
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

    // 🎫 ENDPOINT CORRIGÉ - UTILISE L'EMAIL RÉEL DU CLIENT
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

            // ✅ CORRECTION CRITIQUE : Utiliser l'email réel du client
            if (toEmail == null || toEmail.isEmpty()) {
                System.out.println("❌ Email client manquant");
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Email du client requis"
                ));
            }

            System.out.println("   📧 Email client: " + toEmail);
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

            // ✅ ENVOI À L'EMAIL RÉEL DU CLIENT
            boolean success = emailService.sendTicket(toEmail, orderNumber, qrCodeData, ticketData);

            return ResponseEntity.ok(Map.of(
                    "success", success,
                    "message", success ? "Email envoyé avec succès" : "Échec envoi email",
                    "customerEmail", toEmail,
                    "orderNumber", orderNumber
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

    // 🧪 TEST DE COMMANDE RÉELLE
    @PostMapping("/test-commande")
    public ResponseEntity<?> testEmailCommande() {
        System.out.println("🧪 TEST COMMANDE - Début");

        try {
            // Données de test réalistes
            Map<String, Object> testData = new HashMap<>();
            testData.put("email", "d0c004224e85f3@inbox.mailtrap.io");
            testData.put("numeroCommande", "OLY-TEST-12345");
            testData.put("total", "600.00");

            List<Map<String, Object>> billets = new ArrayList<>();

            Map<String, Object> billet1 = new HashMap<>();
            billet1.put("nom", "Cérémonie d'Ouverture");
            billet1.put("prix", 150);
            billet1.put("quantite", 2);
            billet1.put("type", "Standard");
            billet1.put("total", "300.00");
            billets.add(billet1);

            Map<String, Object> billet2 = new HashMap<>();
            billet2.put("nom", "Finale Athlétisme 100m");
            billet2.put("prix", 300);
            billet2.put("quantite", 1);
            billet2.put("type", "VIP");
            billet2.put("total", "300.00");
            billets.add(billet2);

            testData.put("billets", billets);

            System.out.println("📦 Données test: " + testData);

            // Créer le contenu email
            String htmlContent = """
                <h1>Confirmation de commande</h1>
                <p>Numéro de commande: <strong>OLY-TEST-12345</strong></p>
                <p>Total: <strong>600.00€</strong></p>
                <h2>Vos billets:</h2>
                <ul>
                    <li>Cérémonie d'Ouverture - 2x 150€ = 300.00€</li>
                    <li>Finale Athlétisme 100m - 1x 300€ = 300.00€</li>
                </ul>
                <p>Merci pour votre achat !</p>
                """;

            // Utiliser le service email pour envoyer
            boolean success = emailService.sendEmail(
                    "d0c004224e85f3@inbox.mailtrap.io",
                    "Confirmation de commande OLY-TEST-12345",
                    htmlContent
            );

            if (success) {
                System.out.println("✅ Email de test commande envoyé avec succès");
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Email de test commande envoyé avec succès",
                        "orderNumber", "OLY-TEST-12345"
                ));
            } else {
                System.out.println("❌ Échec envoi email de test commande");
                return ResponseEntity.status(500).body(Map.of(
                        "success", false,
                        "message", "Échec envoi email de test commande"
                ));
            }

        } catch (Exception e) {
            System.err.println("❌ ERREUR test commande: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Erreur test commande: " + e.getMessage()
            ));
        }
    }

    // 🩹 ENDPOINT DE SANTÉ
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        return ResponseEntity.ok(Map.of(
                "status", "OK",
                "service", "Email Service - Mailtrap",
                "timestamp", System.currentTimeMillis()
        ));
    }

    // 🔍 ENDPOINT POUR VÉRIFIER LES DONNÉES REÇUES (debug)
    @PostMapping("/debug-request")
    public ResponseEntity<?> debugRequest(@RequestBody Map<String, Object> request) {
        System.out.println("🔍 DEBUG REQUEST - Données reçues:");
        System.out.println("   Headers: " + request.keySet());
        System.out.println("   Values: " + request);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "receivedData", request,
                "timestamp", System.currentTimeMillis()
        ));
    }
}