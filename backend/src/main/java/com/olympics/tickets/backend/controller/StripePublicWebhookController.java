package com.olympics.tickets.backend.controller;

import com.olympics.tickets.backend.service.TicketService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/public")
@RequiredArgsConstructor
@Slf4j
public class StripePublicWebhookController {

    private final TicketService ticketService;
    private final Environment env;

    // ✅ MÉTHODE GET POUR DEBUG - Quand quelqu'un visite l'URL dans un navigateur
    @GetMapping("/stripe-webhook")
    public ResponseEntity<String> handleGetWebhook(HttpServletRequest request) {
        log.info("⚠️  APPEL GET DÉTECTÉ - Méthode: {}, URI: {}",
                request.getMethod(), request.getRequestURI());

        String endpointSecret = env.getProperty("STRIPE_WEBHOOK_SECRET");
        boolean hasWebhookSecret = endpointSecret != null && !endpointSecret.isEmpty();

        return ResponseEntity.ok(
                "<html>" +
                        "<head><title>Stripe Webhook Endpoint</title></head>" +
                        "<body style='font-family: Arial, sans-serif; padding: 20px;'>" +
                        "<h1>🎯 Stripe Webhook Endpoint</h1>" +
                        "<div style='background: #f0f8ff; padding: 15px; border-radius: 8px;'>" +
                        "<p><strong>✅ Ce endpoint fonctionne !</strong></p>" +
                        "<p>📨 <strong>URL:</strong> " + request.getRequestURL() + "</p>" +
                        "<p>🔧 <strong>Statut:</strong> <span style='color: green;'>OPÉRATIONNEL</span></p>" +
                        "<p>🛡️ <strong>CSRF:</strong> <span style='color: green;'>DÉSACTIVÉ</span></p>" +
                        "<p>🔐 <strong>Sécurité:</strong> <span style='color: green;'>AUCUNE - Webhook public</span></p>" +
                        "<p>🔑 <strong>Webhook Secret:</strong> <span style='color: " + (hasWebhookSecret ? "green" : "red") + ";'>" +
                        (hasWebhookSecret ? "CONFIGURÉ (" + endpointSecret.length() + " chars)" : "NON CONFIGURÉ") + "</span></p>" +
                        "</div>" +
                        "<div style='margin-top: 20px; background: #fff3cd; padding: 15px; border-radius: 8px;'>" +
                        "<p><strong>⚠️  Attention:</strong> Cette page répond aux requêtes GET (navigation).</p>" +
                        "<p>Stripe appellera cette URL en <strong>POST</strong> avec les événements de paiement.</p>" +
                        "</div>" +
                        "</body>" +
                        "</html>"
        );
    }

    // ✅ MÉTHODE POST - Pour les webhooks Stripe réels
    @PostMapping("/stripe-webhook")
    public ResponseEntity<String> handlePublicWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "Stripe-Signature", required = false) String sigHeader,
            HttpServletRequest request) {

        log.info("🎯 PUBLIC WEBHOOK APPELE - Méthode: {}, URI: {}",
                request.getMethod(), request.getRequestURI());
        log.info("📨 Stripe-Signature: {}", sigHeader != null ? "PRÉSENT (" + sigHeader.length() + " chars)" : "ABSENT");
        log.info("📦 Payload reçu ({} caractères)", payload.length());

        // ✅ DEBUG: Afficher les premiers caractères du payload
        if (payload.length() > 0) {
            log.info("📝 Payload début: {}", payload.substring(0, Math.min(200, payload.length())));
        }

        String endpointSecret = env.getProperty("STRIPE_WEBHOOK_SECRET");

        if (endpointSecret == null || endpointSecret.isEmpty()) {
            log.error("❌ STRIPE_WEBHOOK_SECRET NON CONFIGURÉE");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Configuration webhook manquante");
        }

        log.info("✅ Webhook secret trouvé ({} caractères)", endpointSecret.length());

        // ✅ Vérifier que la signature est présente
        if (sigHeader == null || sigHeader.isEmpty()) {
            log.error("❌ Stripe-Signature header manquant");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Stripe-Signature header manquant");
        }

        try {
            Event stripeEvent = Webhook.constructEvent(payload, sigHeader, endpointSecret);
            log.info("✅ Événement Stripe validé: {}", stripeEvent.getType());

            if ("checkout.session.completed".equals(stripeEvent.getType())) {
                Session session = (Session) stripeEvent.getDataObjectDeserializer()
                        .getObject()
                        .orElse(null);

                if (session != null) {
                    log.info("💰 Session payée: {} - Montant: {} - Email: {}",
                            session.getId(), session.getAmountTotal(),
                            session.getCustomerEmail() != null ? session.getCustomerEmail() : "N/A");

                    // ✅ Traitement du paiement
                    ticketService.processSuccessfulPayment(session);
                    log.info("✅ Paiement traité avec succès pour: {}", session.getId());
                } else {
                    log.warn("⚠️ Session null dans l'événement checkout.session.completed");
                }
            } else {
                log.info("📨 Événement ignoré (non critique): {}", stripeEvent.getType());
            }

            return ResponseEntity.ok("✅ Webhook public traité avec succès");

        } catch (SignatureVerificationException e) {
            log.error("❌ Signature webhook invalide: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Signature invalide");
        } catch (Exception e) {
            log.error("❌ Erreur lors du traitement du webhook: {}", e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Erreur de traitement: " + e.getMessage());
        }
    }

    // ✅ MÉTHODE OPTIONS - Pour les preflight CORS
    @RequestMapping(value = "/stripe-webhook", method = RequestMethod.OPTIONS)
    public ResponseEntity<String> handleOptions() {
        log.info("🔄 OPTIONS request reçue");
        return ResponseEntity.ok().build();
    }
}