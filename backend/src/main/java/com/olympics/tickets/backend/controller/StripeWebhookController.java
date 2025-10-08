package com.olympics.tickets.backend.controller;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/webhook")
public class WebhookController {

    private static final Logger logger = LoggerFactory.getLogger(WebhookController.class);

    @Value("${stripe.webhook.secret}")
    private String webhookSecret;

    @PostMapping
    public ResponseEntity<String> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "Stripe-Signature", required = false) String sigHeader) {

        logger.info("🔔 Webhook reçu (longueur: {})", payload.length());

        // Mode développement sans vérification
        if ("whsec_skip_verification_for_now".equals(webhookSecret)) {
            logger.warn("⚠️ Webhook verification disabled - for development only");
            return processWebhookWithoutVerification(payload);
        }

        // Mode production avec vérification
        try {
            Event event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
            return processWebhookEvent(event);
        } catch (SignatureVerificationException e) {
            logger.error("❌ Signature webhook invalide", e);
            return ResponseEntity.badRequest().body("{\"error\": \"Invalid signature\"}");
        } catch (Exception e) {
            logger.error("❌ Erreur webhook", e);
            return ResponseEntity.badRequest().body("{\"error\": \"Webhook processing failed\"}");
        }
    }

    private ResponseEntity<String> processWebhookWithoutVerification(String payload) {
        try {
            JsonObject json = JsonParser.parseString(payload).getAsJsonObject();
            String eventType = json.get("type").getAsString();

            logger.info("Webhook event (unverified): {}", eventType);

            // Traiter les événements sans vérification
            if ("payment_intent.succeeded".equals(eventType)) {
                handlePaymentSuccess(json);
            } else if ("payment_intent.payment_failed".equals(eventType)) {
                handlePaymentFailure(json);
            } else {
                logger.info("Événement non traité: {}", eventType);
            }

            return ResponseEntity.ok("{\"status\": \"received\", \"verified\": false}");
        } catch (Exception e) {
            logger.error("Erreur traitement webhook non vérifié", e);
            return ResponseEntity.ok("{\"status\": \"received_but_failed\", \"verified\": false}");
        }
    }

    private ResponseEntity<String> processWebhookEvent(Event event) {
        try {
            String eventType = event.getType();
            logger.info("Webhook event (verified): {}", eventType);

            // Traiter les événements avec vérification
            if ("payment_intent.succeeded".equals(eventType)) {
                PaymentIntent paymentIntent = (PaymentIntent) event.getData().getObject();
                handlePaymentSuccess(paymentIntent);
            } else if ("payment_intent.payment_failed".equals(eventType)) {
                PaymentIntent paymentIntent = (PaymentIntent) event.getData().getObject();
                handlePaymentFailure(paymentIntent);
            } else {
                logger.info("Événement vérifié non traité: {}", eventType);
            }

            return ResponseEntity.ok("{\"status\": \"processed\", \"verified\": true}");
        } catch (Exception e) {
            logger.error("Erreur traitement webhook vérifié", e);
            return ResponseEntity.status(500).body("{\"error\": \"Event processing failed\"}");
        }
    }

    private void handlePaymentSuccess(JsonObject json) {
        try {
            JsonObject data = json.getAsJsonObject("data").getAsJsonObject("object");
            String paymentIntentId = data.get("id").getAsString();
            Long amount = data.get("amount").getAsLong();

            logger.info("✅ Paiement réussi (non vérifié): {} - {}€",
                    paymentIntentId, amount / 100.0);

            // Ici, mettre à jour votre base de données
            // paymentService.markAsPaid(paymentIntentId);

        } catch (Exception e) {
            logger.error("Erreur traitement paiement réussi (non vérifié)", e);
        }
    }

    private void handlePaymentSuccess(PaymentIntent paymentIntent) {
        try {
            logger.info("✅ Paiement réussi (vérifié): {} - {}€",
                    paymentIntent.getId(), paymentIntent.getAmount() / 100.0);

            // Ici, mettre à jour votre base de données
            // paymentService.markAsPaid(paymentIntent.getId());

        } catch (Exception e) {
            logger.error("Erreur traitement paiement réussi (vérifié)", e);
        }
    }

    private void handlePaymentFailure(JsonObject json) {
        try {
            JsonObject data = json.getAsJsonObject("data").getAsJsonObject("object");
            String paymentIntentId = data.get("id").getAsString();

            logger.warn("❌ Paiement échoué (non vérifié): {}", paymentIntentId);

            // Ici, gérer l'échec du paiement
            // paymentService.markAsFailed(paymentIntentId);

        } catch (Exception e) {
            logger.error("Erreur traitement paiement échoué (non vérifié)", e);
        }
    }

    private void handlePaymentFailure(PaymentIntent paymentIntent) {
        try {
            logger.warn("❌ Paiement échoué (vérifié): {}", paymentIntent.getId());

            // Ici, gérer l'échec du paiement
            // paymentService.markAsFailed(paymentIntent.getId());

        } catch (Exception e) {
            logger.error("Erreur traitement paiement échoué (vérifié)", e);
        }
    }
}