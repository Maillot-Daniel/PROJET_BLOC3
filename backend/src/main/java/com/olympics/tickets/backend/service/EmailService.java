package com.olympics.tickets.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.util.Base64;
import java.util.List;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:no-reply@olympics2024.com}")
    private String fromEmail;

    @Value("${spring.mail.host:not-configured}")
    private String mailHost;

    // ✅ CONSTRUCTEUR AVEC VÉRIFICATION
    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
        System.out.println("✅ EmailService initialisé");
        System.out.println("📧 Host: " + mailHost);
        System.out.println("📧 From: " + fromEmail);

        // Test de configuration
        if ("not-configured".equals(mailHost)) {
            System.out.println("⚠️ Configuration mail non détectée - Mode simulation activé");
        } else {
            System.out.println("🎯 Configuration mail détectée - Emails réels activés");
        }
    }

    // ✅ ENVOYER UN BILLET
    public boolean sendTicket(String toEmail, String orderNumber, String qrCodeBase64) {
        // Vérifier si la configuration mail est présente
        if ("not-configured".equals(mailHost)) {
            System.out.println("📧 [SIMULATION] Email à: " + toEmail + " - Commande: " + orderNumber);
            return true;
        }

        try {
            System.out.println("📧 [REEL] Envoi billet à: " + toEmail);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("🎫 Votre billet Jeux Olympiques #" + orderNumber);

            String htmlContent = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #1e40af; color: white; padding: 30px; text-align: center;">
                        <h1>🎉 Votre billet Olympiques !</h1>
                    </div>
                    
                    <div style="padding: 20px;">
                        <h2>Bonjour,</h2>
                        <p>Votre commande <strong>%s</strong> a été confirmée.</p>
                        
                        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                            <h3>📋 Détails</h3>
                            <p><strong>Événement:</strong> Jeux Olympiques Paris 2024</p>
                            <p><strong>Date:</strong> 26 Juillet - 11 Août 2024</p>
                            <p><strong>Lieu:</strong> Paris, France</p>
                            <p><strong>Statut:</strong> <span style="color: green;">✅ Confirmé</span></p>
                        </div>
                        
                        <p>Votre QR Code est en pièce jointe.</p>
                    </div>
                </div>
                """.formatted(orderNumber);

            helper.setText(htmlContent, true);

            // Ajouter QR Code
            if (qrCodeBase64 != null && qrCodeBase64.startsWith("data:image")) {
                try {
                    String base64Data = qrCodeBase64.split(",")[1];
                    byte[] qrCodeBytes = Base64.getDecoder().decode(base64Data);
                    helper.addAttachment("billet-" + orderNumber + ".png",
                            new ByteArrayResource(qrCodeBytes), "image/png");
                    System.out.println("📎 QR Code joint");
                } catch (Exception e) {
                    System.out.println("⚠️ QR Code non joint: " + e.getMessage());
                }
            }

            mailSender.send(message);
            System.out.println("✅ Email envoyé avec succès vers Mailtrap");
            return true;

        } catch (Exception e) {
            System.err.println("❌ Erreur envoi email: " + e.getMessage());
            return false;
        }
    }

    // ✅ TEST MAILTRAP
    public String quickTest() {
        if ("not-configured".equals(mailHost)) {
            return "✅ Mode simulation - Configuration mail non détectée";
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message);
            helper.setFrom(fromEmail);
            helper.setTo("test@mailtrap.io");
            helper.setSubject("🧪 Test Mailtrap - Olympiques");
            helper.setText("Configuration réussie ! Vous pouvez envoyer des billets.");

            mailSender.send(message);
            return "✅ Test réussi ! Vérifiez Mailtrap.";
        } catch (Exception e) {
            return "❌ Test échoué: " + e.getMessage();
        }
    }

    public boolean sendOlympicsTicket(String customerEmail, String orderNumber, String qrCodeBase64) {
        return sendTicket(customerEmail, orderNumber, qrCodeBase64);
    }

    public void sendTicketsEmail(String customerEmail, List<Object> tickets) {
        System.out.println("📧 Envoi de " + tickets.size() + " billets à: " + customerEmail);
        sendTicket(customerEmail, "BATCH-" + System.currentTimeMillis(), null);
    }
}