package com.olympics.tickets.backend.controller;

import com.olympics.tickets.backend.service.TicketService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stripe")
@RequiredArgsConstructor
public class StripeWebhookController {

    private final TicketService ticketService;

    @Value("${stripe.webhook.secret}")
    private String endpointSecret;

    // Accepte /webhook et /webhook/
    @PostMapping({"/webhook", "/webhook/"})
    public ResponseEntity<String> handleWebhook(@RequestBody String payload,
                                                @RequestHeader("Stripe-Signature") String sigHeader) {
        Event stripeEvent;

        try {
            stripeEvent = Webhook.constructEvent(payload, sigHeader, endpointSecret);
        } catch (SignatureVerificationException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("⚠️ Signature mismatch");
        }

        if ("checkout.session.completed".equals(stripeEvent.getType())) {
            Session session = (Session) stripeEvent.getDataObjectDeserializer()
                    .getObject()
                    .orElse(null);
            if (session != null) {
                try {
                    ticketService.processSuccessfulPayment(session);
                } catch (Exception e) {
                    e.printStackTrace();
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body("❌ Failed to process payment");
                }
            }
        }

        return ResponseEntity.ok("✅ Webhook received");
    }
}
