package com.olympics.tickets.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;

import jakarta.mail.internet.MimeMessage;
import java.util.Base64;
import java.util.Map;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    // ✅ EMAIL FIXE POUR MAILTRAP
    private final String FIXED_TEST_EMAIL = "d0c004224e85f3@inbox.mailtrap.io";

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
        System.out.println("✅ EmailService initialisé - Email fixe: " + FIXED_TEST_EMAIL);
    }

    // 🔥 MÉTHODE PRINCIPALE CORRIGÉE
    public boolean sendTicket(String toEmail, String orderNumber, String qrCodeBase64, Map<String, Object> ticketData) {
        System.out.println("🚀 ENVOI EMAIL - Début sendTicket");

        try {
            // ✅ FORCER L'EMAIL FIXE POUR TOUS LES ENVOIS
            String destinationEmail = FIXED_TEST_EMAIL;
            System.out.println("📧 Destination FORCÉE: " + destinationEmail);
            System.out.println("📦 Commande: " + orderNumber);
            System.out.println("💰 Données ticket: " + ticketData);

            MimeMessage message = mailSender.createMimeMessage();

            // ✅ CORRECTION : Encodage UTF-8 explicite
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "Billetterie Olympiques");
            helper.setTo(destinationEmail);

            // ✅ CORRECTION : Sujet simple
            helper.setSubject("Billet Olympiques #" + orderNumber);

            // ✅ CORRECTION : Template HTML simple
            String total = ticketData != null ? (String) ticketData.get("total") : "0.00";
            String purchaseDate = ticketData != null ? (String) ticketData.get("purchaseDate") : new java.util.Date().toString();
            String eventTitle = ticketData != null ? (String) ticketData.get("eventTitle") : "Evenement Olympique";

            String htmlContent = createSafeEmailTemplate(orderNumber, total, purchaseDate, eventTitle, toEmail);
            helper.setText(htmlContent, true);

            // ✅ CORRECTION : QR Code optionnel
            if (qrCodeBase64 != null && qrCodeBase64.startsWith("data:image")) {
                try {
                    String base64Data = qrCodeBase64.split(",")[1];
                    byte[] qrCodeBytes = Base64.getDecoder().decode(base64Data);
                    helper.addAttachment("qrcode-" + orderNumber + ".png",
                            new ByteArrayResource(qrCodeBytes), "image/png");
                    System.out.println("📎 QR Code joint");
                } catch (Exception e) {
                    System.out.println("⚠️ QR Code non joint: " + e.getMessage());
                    // Continuer sans QR code
                }
            } else {
                System.out.println("ℹ️ Pas de QR code fourni");
            }

            mailSender.send(message);
            System.out.println("✅ EMAIL ENVOYE avec succes à: " + destinationEmail);
            return true;

        } catch (Exception e) {
            System.err.println("❌ ERREUR CRITIQUE sendTicket: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    // ✅ TEMPLATE SÉCURISÉ sans caractères problématiques
    private String createSafeEmailTemplate(String orderNumber, String total, String purchaseDate, String eventTitle, String clientEmail) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        line-height: 1.6; 
                        color: #333; 
                        max-width: 600px; 
                        margin: 0 auto; 
                        padding: 20px;
                    }
                    .header { 
                        background: #0055A4; 
                        color: white; 
                        padding: 20px; 
                        text-align: center; 
                        border-radius: 10px 10px 0 0;
                    }
                    .content { 
                        padding: 20px; 
                        background: #f8f9fa; 
                        border-radius: 0 0 10px 10px;
                    }
                    .ticket-info { 
                        background: white; 
                        padding: 15px; 
                        border-radius: 8px; 
                        margin: 15px 0; 
                        border-left: 4px solid #0055A4;
                    }
                    .footer { 
                        text-align: center; 
                        margin-top: 20px; 
                        color: #666; 
                        font-size: 14px;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1 style="margin: 0; font-size: 24px;">Votre billet Olympiques</h1>
                    <p style="margin: 10px 0 0 0; font-size: 16px;">Commande #%s</p>
                </div>
                
                <div class="content">
                    <h2>Bonjour,</h2>
                    <p>Votre commande a ete confirmee avec succes.</p>
                    
                    <div class="ticket-info">
                        <h3 style="color: #0055A4; margin-top: 0;">Details de votre billet</h3>
                        <p><strong>Evenement:</strong> %s</p>
                        <p><strong>Date d'achat:</strong> %s</p>
                        <p><strong>Total:</strong> %s EUR</p>
                        <p><strong>Statut:</strong> <span style="color: #28a745; font-weight: bold;">Confirme</span></p>
                    </div>
                    
                    <p><strong>Votre QR Code est en piece jointe.</strong> Presentez-le a l'entree.</p>
                    <p>Conservez bien cet email.</p>
                    
                    <div class="footer">
                        <p>Cordialement,<br><strong>L'equipe des Jeux Olympiques Paris 2024</strong></p>
                        <p>Email: billetterie@olympics2024.com</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(orderNumber, eventTitle, purchaseDate, total);
    }

    // 🔧 MÉTHODE DE TEST SIMPLE
    public boolean sendEmail(String to, String subject, String htmlContent) {
        try {
            System.out.println("📧 Envoi email simple - Début");
            System.out.println("   A: " + to);
            System.out.println("   Sujet: " + subject);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "Billetterie Olympiques");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            System.out.println("✅ Email simple envoye avec succes");
            return true;

        } catch (Exception e) {
            System.err.println("❌ Erreur envoi email simple: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    // 🚨 MÉTHODE DE SECOURS
    public boolean sendTicketEmergency(String toEmail, String orderNumber, Map<String, Object> ticketData) {
        try {
            System.out.println("🚨 MODE SECOURS - Simulation");
            System.out.println("📧 A: " + toEmail);
            System.out.println("📦 Commande: " + orderNumber);
            System.out.println("💰 Total: " + ticketData.get("total"));

            // Simuler un envoi réussi
            Thread.sleep(1000);

            System.out.println("✅ EMAIL SIMULE - Commande " + orderNumber + " traitee");
            return true;

        } catch (Exception e) {
            System.err.println("❌ Erreur mode secours: " + e.getMessage());
            return false;
        }
    }

    // 🧪 TEST DE CONFIGURATION
    public String quickTest() {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "Test Olympiques");
            helper.setTo(FIXED_TEST_EMAIL);
            helper.setSubject("Test Configuration Mailtrap");
            helper.setText("""
                <h2>Test de configuration Mailtrap</h2>
                <p>Si vous recevez cet email, la configuration est correcte!</p>
                <ul>
                    <li><strong>Serveur:</strong> sandbox.smtp.mailtrap.io</li>
                    <li><strong>Port:</strong> 2525</li>
                    <li><strong>Email fixe:</strong> %s</li>
                    <li><strong>Timestamp:</strong> %s</li>
                </ul>
                <p>Statut: ✅ OPERATIONNEL</p>
                """.formatted(FIXED_TEST_EMAIL, System.currentTimeMillis()), true);

            mailSender.send(message);
            return "✅ Test SMTP reussi ! Verifiez Mailtrap.";

        } catch (Exception e) {
            return "❌ Test SMTP echoue: " + e.getMessage();
        }
    }

    // 🎯 MÉTHODE ULTRA-SIMPLE POUR TESTS
    public boolean sendTicketSimple(String toEmail, String orderNumber, String total) {
        try {
            System.out.println("🎯 MODE ULTRA-SIMPLE");
            System.out.println("📧 Envoi à: " + FIXED_TEST_EMAIL);
            System.out.println("📦 Commande: " + orderNumber);
            System.out.println("💰 Total: " + total);

            return sendEmail(
                    FIXED_TEST_EMAIL,
                    "Commande " + orderNumber,
                    "<h1>Commande Confirmee</h1><p>Numero: " + orderNumber + "</p><p>Total: " + total + " EUR</p><p>Merci pour votre achat!</p>"
            );

        } catch (Exception e) {
            System.err.println("❌ Erreur mode simple: " + e.getMessage());
            return false;
        }
    }
}