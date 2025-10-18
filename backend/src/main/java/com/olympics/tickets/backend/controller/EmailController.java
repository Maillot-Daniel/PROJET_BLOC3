package com.olympics.tickets.backend.controller;

import com.olympics.tickets.backend.service.EmailService;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/email")
@CrossOrigin(origins = "http://localhost:3000")
public class EmailController {

    private final EmailService emailService;

    public EmailController(EmailService emailService) {
        this.emailService = emailService;
    }

    // ✅ TEST MAILTRAP
    @GetMapping("/test")
    public Map<String, Object> testMailtrap() {
        String result = emailService.quickTest(); // ✅ MÉTHODE EXISTE MAINTENANT

        Map<String, Object> response = new HashMap<>();
        response.put("success", result.startsWith("✅"));
        response.put("message", result);
        response.put("sandboxUrl", "https://mailtrap.io/inboxes");

        return response;
    }

    // ✅ ENVOYER UN BILLET
    @PostMapping("/send-ticket")
    public Map<String, Object> sendTicket(@RequestBody TicketRequest request) {
        boolean success = emailService.sendOlympicsTicket( // ✅ MÉTHODE EXISTE MAINTENANT
                request.getCustomerEmail(),
                request.getOrderNumber(),
                request.getQrCodeData()
        );

        Map<String, Object> response = new HashMap<>();
        response.put("success", success);
        response.put("message", success ? "Billet envoyé !" : "Erreur d'envoi");
        response.put("customerEmail", request.getCustomerEmail());
        response.put("orderNumber", request.getOrderNumber());
        response.put("sandboxUrl", "https://mailtrap.io/inboxes");

        return response;
    }

    public static class TicketRequest {
        private String customerEmail;
        private String orderNumber;
        private String qrCodeData;

        public String getCustomerEmail() { return customerEmail; }
        public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }
        public String getOrderNumber() { return orderNumber; }
        public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }
        public String getQrCodeData() { return qrCodeData; }
        public void setQrCodeData(String qrCodeData) { this.qrCodeData = qrCodeData; }
    }
}