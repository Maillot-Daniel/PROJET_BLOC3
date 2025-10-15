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
@RequestMapping("/api/stripe")
@RequiredArgsConstructor
@Slf4j
public class StripeWebhookController {

    private final TicketService ticketService;
    private final Environment env;

    @PostMapping(value = {"/webhook", "/webhook/"})
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader,
            HttpServletRequest request) { // ✅ Ajout pour debug

        // ✅ LOGS DE DÉBUG CRITIQUES
        log.info("🎯 WEBHOOK STRIPE APPELE - Méthode: {}, URI: {}",
                request.getMethod(), request.getRequestURI());
        log.info("📨 Headers reçus: Stripe-Signature={} ({} chars)",
                sigHeader != null ? "PRÉSENT" : "ABSENT",
                sigHeader != null ? sigHeader.length() : 0);
        log.info("📦 Payload taille: {} caractères", payload.length());

        // ✅ Récupération SECURISÉE de la clé webhook
        String endpointSecret = env.getProperty("STRIPE_WEBHOOK_SECRET");

        if (endpointSecret == null || endpointSecret.isEmpty()) {
            log.error("❌ CRITIQUE: STRIPE_WEBHOOK_SECRET non configuré dans les variables d'environnement");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Configuration webhook manquante");
        }

        log.info("✅ Webhook secret trouvé ({} caractères)", endpointSecret.length());

        Event stripeEvent;

        try {
            // ✅ VALIDATION DE LA SIGNATURE STRIPE
            stripeEvent = Webhook.constructEvent(payload, sigHeader, endpointSecret);
            log.info("✅ Événement Stripe validé: {}", stripeEvent.getType());

            // ✅ TRAITEMENT DE L'ÉVÉNEMENT
            if ("checkout.session.completed".equals(stripeEvent.getType())) {
                Session session = (Session) stripeEvent.getDataObjectDeserializer()
                        .getObject()
                        .orElse(null);

                if (session != null) {
                    log.info("💰 Session payée détectée - ID: {}, Montant: {}, Email: {}",
                            session.getId(), session.getAmountTotal(), session.getCustomerEmail());

                    // ✅ TRAITEMENT DU PAIEMENT
                    ticketService.processSuccessfulPayment(session);
                    log.info("🎫 Paiement traité avec succès pour la session: {}", session.getId());
                } else {
                    log.warn("⚠️ Session null dans l'événement checkout.session.completed");
                }
            } else {
                log.info("📨 Événement ignoré (non critique): {}", stripeEvent.getType());
            }

            return ResponseEntity.ok("✅ Webhook traité avec succès");

        } catch (SignatureVerificationException e) {
            log.error("❌ ERREUR SIGNATURE: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Signature webhook invalide");
        } catch (Exception e) {
            log.error("❌ ERREUR TRAITEMENT: {}", e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Erreur lors du traitement du webhook: " + e.getMessage());
        }
    }
}