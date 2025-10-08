package com.olympics.tickets.backend.service;

import com.olympics.tickets.backend.entity.Ticket;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final PdfGenerator pdfGenerator;

    // Envoi d'un email avec pièce jointe
    public void sendEmailWithAttachment(String email, String subject, String body, byte[] attachment, String filename) {
        // Ici tu mets ton code réel pour envoyer un email
        // Exemple : JavaMailSender ou autre service
    }

    // Envoi des tickets à un utilisateur
    public void sendTicketsEmail(String email, List<Ticket> tickets) {
        for (Ticket ticket : tickets) {
            byte[] pdfBytes = pdfGenerator.generateTicketPdf(ticket, ticket.getEvent(), ticket.getUser());
            String subject = "Vos billets - " + ticket.getEvent().getTitle();
            String body = "Bonjour " + ticket.getUser().getName() + ",\n\nMerci pour votre achat. Vos billets sont en pièce jointe.";
            String filename = "billets_" + ticket.getTicketNumber() + ".pdf";

            sendEmailWithAttachment(email, subject, body, pdfBytes, filename);
        }
    }
}
