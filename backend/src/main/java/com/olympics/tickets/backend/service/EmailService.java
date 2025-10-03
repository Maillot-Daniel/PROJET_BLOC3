package com.olympics.tickets.backend.service;

import jakarta.mail.*;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context; // Importation correcte pour Thymeleaf
import org.thymeleaf.TemplateEngine;
import com.olympics.tickets.backend.entity.Ticket; // Importation de la classe Ticket

import java.util.List;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;



    @Value("${spring.mail.username}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender, TemplateEngine templateEngine) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
    }

    public void sendTicketsEmail(String toEmail, List<Ticket> tickets) {
        // Utilisation de Thymeleaf pour gérer les variables dans le modèle
        Context context = new Context();
        context.setVariable("tickets", tickets);

        // Traitement du modèle Thymeleaf
        String htmlContent = templateEngine.process("ticket-email", context);

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");

        try {
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Vos billets d'événement");
            helper.setText(htmlContent, true);

            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send email", e);
        }
    }
}
