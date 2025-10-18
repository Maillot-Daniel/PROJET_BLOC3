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
import java.util.Map;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:no-reply@olympics2024.com}")
    private String fromEmail;

    @Value("${spring.mail.host:not-configured}")
    private String mailHost;

    @Value("${spring.mail.port:587}")
    private String mailPort;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
        System.out.println("=".repeat(50));
        System.out.println("✅ EmailService initialisé");
        System.out.println("📧 Host: " + mailHost);
        System.out.println("📧 Port: " + mailPort);
        System.out.println("📧 From: " + fromEmail);

        if ("not-configured".equals(mailHost)) {
            System.out.println("❌ CONFIGURATION MANQUANTE - Vérifiez les variables dans Render:");
            System.out.println("   - SPRING_MAIL_HOST=sandbox.smtp.mailtrap.io");
            System.out.println("   - SPRING_MAIL_PORT=2525");
            System.out.println("   - SPRING_MAIL_USERNAME=d0c004224e85f3");
            System.out.println("   - SPRING_MAIL_PASSWORD=votre_mot_de_passe_mailtrap");
        } else {
            System.out.println("🎯 MAILTRAP CONFIGURÉ - Prêt à envoyer des emails");
        }
        System.out.println("=".repeat(50));
    }

    public boolean sendTicket(String toEmail, String orderNumber, String qrCodeBase64, Map<String, Object> ticketData) {
        // Vérifier configuration
        if ("not-configured".equals(mailHost)) {
            System.out.println("❌ BLOCAGE: Configuration mail manquante dans Render");
            return false;
        }

        try {
            System.out.println("🚀 ENVOI EMAIL à: " + toEmail);
            System.out.println("   📦 Commande: " + orderNumber);
            System.out.println("   🖼️  QR Code: " + (qrCodeBase64 != null ? "Oui" : "Non"));

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("🎫 Votre billet Jeux Olympiques #" + orderNumber);

            // Récupérer les données du billet
            String purchaseDate = ticketData != null ? (String) ticketData.get("purchaseDate") : "Date inconnue";
            String total = ticketData != null ? (String) ticketData.get("total") : "0.00";

            String htmlContent = createEmailTemplate(orderNumber, purchaseDate, total);
            helper.setText(htmlContent, true);

            // Ajouter QR Code
            if (qrCodeBase64 != null && qrCodeBase64.startsWith("data:image")) {
                try {
                    String base64Data = qrCodeBase64.split(",")[1];
                    byte[] qrCodeBytes = Base64.getDecoder().decode(base64Data);
                    helper.addAttachment("billet-olympiques-" + orderNumber + ".png",
                            new ByteArrayResource(qrCodeBytes), "image/png");
                    System.out.println("   📎 QR Code joint");
                } catch (Exception e) {
                    System.out.println("   ⚠️  QR Code non joint: " + e.getMessage());
                }
            }

            mailSender.send(message);
            System.out.println("✅ EMAIL ENVOYÉ avec succès à: " + toEmail);
            System.out.println("🔗 Vérifiez: https://mailtrap.io/inboxes");
            return true;

        } catch (Exception e) {
            System.err.println("❌ ERREUR ENVOI EMAIL: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    private String createEmailTemplate(String orderNumber, String purchaseDate, String total) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; background: #f8fafc; margin: 0; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
                    .content { padding: 30px; }
                    .ticket-info { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
                    .footer { background: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin: 0; font-size: 28px;">🎉 Votre billet Olympiques !</h1>
                        <h2 style="margin: 10px 0 0 0; font-weight: 300;">Commande #%s</h2>
                    </div>
                    
                    <div class="content">
                        <h2>Bonjour,</h2>
                        <p>Votre commande a été confirmée avec succès. Voici le récapitulatif :</p>
                        
                        <div class="ticket-info">
                            <h3 style="color: #1e40af; margin-top: 0;">📋 Détails de votre billet</h3>
                            <p><strong>🎯 Événement:</strong> Jeux Olympiques Paris 2024</p>
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
            """.formatted(orderNumber, purchaseDate, total);
    }

    public String quickTest() {
        if ("not-configured".equals(mailHost)) {
            return "❌ Configuration mail manquante. Vérifiez les variables dans Render.";
        }

        try {
            System.out.println("🧪 TEST MAILTRAP en cours...");

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message);
            helper.setFrom(fromEmail);
            helper.setTo("test@example.com");
            helper.setSubject("🧪 Test Mailtrap - Olympiques 2024");
            helper.setText("""
                Ceci est un test de configuration Mailtrap.
                
                ✅ Si vous recevez cet email, la configuration est correcte!
                
                Serveur: %s:%s
                Timestamp: %s
                """.formatted(mailHost, mailPort, System.currentTimeMillis()));

            mailSender.send(message);
            return "✅ Test réussi ! Vérifiez Mailtrap: https://mailtrap.io/inboxes";

        } catch (Exception e) {
            return "❌ Test échoué: " + e.getMessage();
        }
    }

    public boolean sendOlympicsTicket(String customerEmail, String orderNumber, String qrCodeBase64, Map<String, Object> ticketData) {
        return sendTicket(customerEmail, orderNumber, qrCodeBase64, ticketData);
    }
}