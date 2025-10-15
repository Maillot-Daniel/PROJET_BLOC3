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

@RestController
@RequestMapping("/public")
@RequiredArgsConstructor
@Slf4j
public class StripePublicWebhookController {

    private final TicketService ticketService;
    private final Environment env;

    @PostMapping("/stripe-webhook")
    public ResponseEntity<String> handlePublicWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {

        log.info("🎯 PUBLIC WEBHOOK APPELE - Chemin: /public/stripe-webhook");

        // Récupération de la clé webhook
        String endpointSecret = env.getProperty("STRIPE_WEBHOOK_SECRET");

        if (endpointSecret == null || endpointSecret.isEmpty()) {
            log.error("❌ STRIPE_WEBHOOK_SECRET non configuré");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Configuration webhook manquante");
        }

        log.info("✅ Webhook secret trouvé ({} caractères)", endpointSecret.length());

        try {
            // Validation de la signature Stripe
            Event stripeEvent = Webhook.constructEvent(payload, sigHeader, endpointSecret);
            log.info("✅ Événement Stripe validé: {}", stripeEvent.getType());

            // Traitement des paiements réussis
            if ("checkout.session.completed".equals(stripeEvent.getType())) {
                Session session = (Session) stripeEvent.getDataObjectDeserializer()
                        .getObject()
                        .orElse(null);

                if (session != null) {
                    log.info("💰 Session payée: {} - Montant: {} - Email: {}",
                            session.getId(), session.getAmountTotal(), session.getCustomerEmail());

                    // Traitement du paiement réussi
                    ticketService.processSuccessfulPayment(session);
                    log.info("✅ Paiement traité avec succès pour: {}", session.getId());
                }
            }

            return ResponseEntity.ok("✅ Webhook public traité avec succès");

        } catch (SignatureVerificationException e) {
            log.error("❌ Signature webhook invalide: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Signature invalide");
        } catch (Exception e) {
            log.error("❌ Erreur lors du traitement du webhook: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Erreur de traitement: " + e.getMessage());
        }
    }
}