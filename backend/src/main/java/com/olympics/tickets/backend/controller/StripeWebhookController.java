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
@RequestMapping("/api/stripe")
@RequiredArgsConstructor
@Slf4j
public class StripeWebhookController {

    private final TicketService ticketService;
    private final Environment env;

    @PostMapping({"/webhook", "/webhook/"})
    public ResponseEntity<String> handleWebhook(@RequestBody String payload,
                                                @RequestHeader("Stripe-Signature") String sigHeader) {

        // ✅ Récupérer UNIQUEMENT depuis les variables d'environnement
        String endpointSecret = env.getProperty("STRIPE_WEBHOOK_SECRET");

        if (endpointSecret == null || endpointSecret.isEmpty()) {
            log.error("❌ STRIPE_WEBHOOK_SECRET non configuré dans les variables d'environnement");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Configuration webhook manquante");
        }

        log.info("🔔 Webhook Stripe reçu");

        Event stripeEvent;

        try {
            stripeEvent = Webhook.constructEvent(payload, sigHeader, endpointSecret);
        } catch (SignatureVerificationException e) {
            log.error("❌ Signature invalide");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Signature invalide");
        } catch (Exception e) {
            log.error("❌ Erreur payload");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Payload invalide");
        }

        if ("checkout.session.completed".equals(stripeEvent.getType())) {
            Session session = (Session) stripeEvent.getDataObjectDeserializer()
                    .getObject()
                    .orElse(null);
            if (session != null) {
                try {
                    ticketService.processSuccessfulPayment(session);
                    log.info("✅ Paiement traité pour session: {}", session.getId());
                } catch (Exception e) {
                    log.error("❌ Erreur traitement paiement: {}", e.getMessage());
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body("Erreur traitement paiement");
                }
            }
        }

        return ResponseEntity.ok("✅ Webhook reçu");
    }
}