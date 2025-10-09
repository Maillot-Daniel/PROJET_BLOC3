package com.olympics.tickets.backend.service;

import org.springframework.stereotype.Service;
import java.util.List;
import com.olympics.tickets.backend.entity.Ticket;

@Service
public class EmailService {

    // Méthode 1
    public void sendEmail(String to, String subject, String text) {
        logEmail("BASIC", to, subject, "No attachment");
    }

    // Méthode 2 - Pour TicketService
    public void sendEmailWithAttachment(String to, String subject, String text,
                                        byte[] attachment, String filename) {
        logEmail("ATTACHMENT", to, subject, "File: " + filename + " (" + attachment.length + " bytes)");
    }

    // Méthode 3 - Pour PaymentService
    public void sendTicketsEmail(String customerEmail, List<Ticket> tickets) {
        System.out.println("✉️ [TICKETS EMAIL] To: " + customerEmail +
                " | Tickets: " + tickets.size());
    }

    // Méthode 4
    public void sendTicketConfirmation(String to, String customerName,
                                       String eventName, String ticketDetails) {
        String subject = "Confirmation - " + eventName;
        String text = "Bonjour " + customerName + ", billet confirmé pour " + eventName;
        sendEmail(to, subject, text);
    }

    private void logEmail(String type, String to, String subject, String details) {
        System.out.println("✉️ [" + type + " EMAIL]");
        System.out.println("   To: " + to);
        System.out.println("   Subject: " + subject);
        System.out.println("   Details: " + details);
        System.out.println("   ────────────────────────");
    }
}