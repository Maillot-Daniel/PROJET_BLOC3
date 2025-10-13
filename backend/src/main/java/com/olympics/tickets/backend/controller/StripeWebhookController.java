package com.olympics.tickets.backend.controller;

import com.olympics.tickets.backend.service.TicketService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/api/stripe")
@RequiredArgsConstructor
public class StripeWebhookController {

    private static final Logger log = LoggerFactory.getLogger(StripeWebhookController.class);

    private final TicketService ticketService;

    @Value("${stripe.webhook.secret}")
    private String endpointSecret;

    @PostMapping("/webhook")
    public ResponseEntity<String> handleStripeWebhook(HttpServletRequest request,
                                                      @RequestHeader("Stripe-Signature") String sigHeader) {
        String payload;
        try {
            payload = new String(request.getInputStream().readAllBytes());
        } catch (IOException e) {
            log.error("Impossible de lire le payload Stripe", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Cannot read payload");
        }

        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, endpointSecret);
        } catch (SignatureVerificationException e) {
            log.warn("Signature Stripe invalide : {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid signature");
        }

        log.info("Événement Stripe reçu : {}", event.getType());

        if ("checkout.session.completed".equals(event.getType())) {
            Session session = (Session) event.getDataObjectDeserializer()
                    .getObject()
                    .orElse(null);

            if (session != null) {
                log.info("Paiement réussi pour la session ID={}", session.getId());
                try {
                    ticketService.processSuccessfulPayment(session);
                    log.info("Tickets créés avec succès pour {}", session.getCustomerDetails().getEmail());
                } catch (Exception e) {
                    log.error("Erreur lors du traitement du paiement Stripe", e);
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body("Failed to process payment");
                }
            } else {
                log.warn("Session Stripe introuvable dans le payload");
            }
        }

        return ResponseEntity.ok("Webhook reçu avec succès");
    }
}
