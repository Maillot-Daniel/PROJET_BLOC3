package com.olympics.tickets.backend.service;

import com.olympics.tickets.backend.entity.Ticket;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final PdfGenerator pdfGenerator;
    private final JavaMailSender mailSender; // Assure-toi de configurer JavaMailSender dans application.properties

    /**
     * Envoi d'un email avec pièce jointe
     */
    public void sendEmailWithAttachment(String email, String subject, String body, byte[] attachment, String filename) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(email);
            helper.setSubject(subject);
            helper.setText(body);
            helper.addAttachment(filename, new jakarta.activation.DataSource() {
                @Override
                public java.io.InputStream getInputStream() {
                    return new java.io.ByteArrayInputStream(attachment);
                }

                @Override
                public java.io.OutputStream getOutputStream() {
                    throw new UnsupportedOperationException("Not implemented");
                }

                @Override
                public String getContentType() {
                    return "application/pdf";
                }

                @Override
                public String getName() {
                    return filename;
                }
            });

            mailSender.send(message);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * Envoi de tous les tickets à un utilisateur
     */
    public void sendTicketsEmail(String email, List<Ticket> tickets) {
        for (Ticket ticket : tickets) {
            byte[] pdfBytes = pdfGenerator.generateTicketPdf(ticket, ticket.getEvent(), ticket.getUser());
            String subject = "Vos billets - " + ticket.getEvent().getTitle();
            String body = "Bonjour " + ticket.getUser().getName() + ",\n\nMerci pour votre achat. Vos billets sont en pièce jointe.";
            String filename = "billet_" + ticket.getTicketNumber() + ".pdf";

            sendEmailWithAttachment(email, subject, body, pdfBytes, filename);
        }
    }
}
