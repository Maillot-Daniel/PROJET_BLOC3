package com.olympics.tickets.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.util.Base64;
import java.util.Map;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    // ✅ EMAIL FIXE POUR MAILTRAP - TOUS LES EMAILS VONT ICI
    private final String FIXED_TEST_EMAIL = "d0c004224e85f3@inbox.mailtrap.io";

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
        System.out.println("✅ EmailService initialisé - Email fixe: " + FIXED_TEST_EMAIL);
    }

    public boolean sendTicket(String toEmail, String orderNumber, String qrCodeBase64, Map<String, Object> ticketData) {
        // ✅ FORCER L'ENVOI VERS L'EMAIL FIXE MAILTRAP
        String destinationEmail = FIXED_TEST_EMAIL;

        System.out.println("🚀 ENVOI EMAIL - Original: " + toEmail + " → Forcé vers: " + destinationEmail);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(destinationEmail); // ✅ TOUJOURS MAILTRAP
            helper.setSubject("🎫 Billet Olympiques #" + orderNumber + " - " + toEmail);

            // Données du ticket
            String purchaseDate = ticketData != null ? (String) ticketData.get("purchaseDate") : "Date inconnue";
            String total = ticketData != null ? (String) ticketData.get("total") : "0.00";
            String eventTitle = ticketData != null ? (String) ticketData.get("eventTitle") : "Événement Olympique";

            String htmlContent = createEmailTemplate(orderNumber, purchaseDate, total, eventTitle, toEmail);
            helper.setText(htmlContent, true);

            // QR Code en pièce jointe
            if (qrCodeBase64 != null && qrCodeBase64.startsWith("data:image")) {
                try {
                    String base64Data = qrCodeBase64.split(",")[1];
                    byte[] qrCodeBytes = Base64.getDecoder().decode(base64Data);
                    helper.addAttachment("billet-olympiques-" + orderNumber + ".png",
                            new ByteArrayResource(qrCodeBytes), "image/png");
                    System.out.println("📎 QR Code joint");
                } catch (Exception e) {
                    System.out.println("⚠️ QR Code non joint: " + e.getMessage());
                }
            }

            mailSender.send(message);
            System.out.println("✅ EMAIL ENVOYÉ vers Mailtrap - Client original: " + toEmail);
            return true;

        } catch (Exception e) {
            System.err.println("❌ ERREUR ENVOI EMAIL: " + e.getMessage());
            return false;
        }
    }

    private String createEmailTemplate(String orderNumber, String purchaseDate, String total, String eventTitle, String originalEmail) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; background: #f8fafc; margin: 0; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #0055A4 0%, #EF4135 100%); color: white; padding: 30px; text-align: center; }
                    .content { padding: 30px; }
                    .ticket-info { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
                    .footer { background: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
                    .debug-info { background: #fff3cd; padding: 10px; border-radius: 6px; margin: 10px 0; font-size: 12px; color: #856404; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin: 0; font-size: 28px;">🎉 Votre billet Olympiques !</h1>
                        <h2 style="margin: 10px 0 0 0; font-weight: 300;">Commande #%s</h2>
                    </div>
                    
                    <div class="content">
                        <div class="debug-info">
                            <strong>🧪 MODE TEST:</strong> Email original: %s
                        </div>
                        
                        <h2>Bonjour,</h2>
                        <p>Votre commande a été confirmée avec succès. Voici le récapitulatif :</p>
                        
                        <div class="ticket-info">
                            <h3 style="color: #1e40af; margin-top: 0;">📋 Détails de votre billet</h3>
                            <p><strong>🎯 Événement:</strong> %s</p>
                            <p><strong>📅 Date d'achat:</strong> %s</p>
                            <p><strong>💰 Total:</strong> %s €</p>
                            <p><strong>✅ Statut:</strong> <span style="color: #10b981; font-weight: bold;">Confirmé</span></p>
                        </div>
                        
                        <p><strong>📎 Votre QR Code est en pièce jointe.</strong> Présentez-le à l'entrée de l'événement.</p>
                        <p>Conservez bien cet email, il fait office de billet.</p>
                    </div>
                    
                    <div class="footer">
                        <p>Cordialement,<br><strong>L'équipe des Jeux Olympiques Paris 2024</strong></p>
                        <p>📧 billetterie@olympics2024.com</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(orderNumber, originalEmail, eventTitle, purchaseDate, total);
    }

    public String quickTest() {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message);
            helper.setFrom(fromEmail);
            helper.setTo(FIXED_TEST_EMAIL);
            helper.setSubject("🧪 Test Mailtrap - Olympiques 2024");
            helper.setText("""
                Ceci est un test de configuration Mailtrap.
                
                ✅ Si vous recevez cet email, la configuration est correcte!
                
                Configuration:
                - Serveur: sandbox.smtp.mailtrap.io
                - Port: 2525
                - Email fixe: %s
                - Timestamp: %s
                """.formatted(FIXED_TEST_EMAIL, System.currentTimeMillis()));

            mailSender.send(message);
            return "✅ Test réussi ! Vérifiez Mailtrap: https://mailtrap.io/inboxes";

        } catch (Exception e) {
            return "❌ Test échoué: " + e.getMessage();
        }
    }
}