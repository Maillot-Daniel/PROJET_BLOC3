package com.olympics.tickets.backend.controller;

import com.olympics.tickets.backend.service.TicketService;
import com.stripe.model.checkout.Session;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stripe")
@RequiredArgsConstructor
public class StripeWebhookController {

    private final TicketService ticketService;

    @PostMapping("/webhook")
    public String handleStripeWebhook(@RequestBody Session session) {
        try {
            ticketService.processSuccessfulPayment(session);
            return "Webhook processed successfully";
        } catch (Exception e) {
            e.printStackTrace();
            return "Error processing webhook: " + e.getMessage();
        }
    }
}
