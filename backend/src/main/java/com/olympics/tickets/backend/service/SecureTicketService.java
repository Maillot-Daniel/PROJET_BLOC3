package com.olympics.tickets.backend.service;

import com.olympics.tickets.backend.dto.DailySalesResponse;
import com.olympics.tickets.backend.dto.TicketValidationResponse;
import com.olympics.tickets.backend.entity.Ticket;
import com.olympics.tickets.backend.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SecureTicketService {

    private final TicketRepository ticketRepository;

    @Value("${app.hmac.secret:YourDefaultSecretKeyChangeInProduction123!}")
    private String hmacSecret;

    /**
     * Génère une clé de ticket sécurisée
     */
    public String generateTicketKey() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }

    /**
     * Hash une clé avec SHA-256
     */
    public String hashKey(String key) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(key.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors du hashage", e);
        }
    }

    /**
     * Génère une signature HMAC
     */
    public String generateHMAC(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(hmacSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hmac);
        } catch (Exception e) {
            throw new RuntimeException("Erreur génération HMAC", e);
        }
    }

    /**
     * Sécurise un ticket en calculant le hash et la signature
     */
    @Transactional
    public Ticket secureTicket(Ticket ticket) {
        if (ticket.getPrimaryKey() == null || ticket.getSecondaryKey() == null) {
            throw new IllegalArgumentException("Le ticket doit avoir des clés primaire et secondaire");
        }

        String combinedKey = ticket.getPrimaryKey() + ticket.getSecondaryKey();

        // Calculer et assigner le hash et la signature
        ticket.setHashedKey(hashKey(combinedKey));
        ticket.setSignature(generateHMAC(combinedKey));

        // Générer l'URL du QR code
        ticket.setQrCodeUrl(ticket.generateSecureQrCodeUrl());

        return ticketRepository.save(ticket);
    }

    /**
     * Valide un ticket à partir des données QR (primaryKey + signature)
     */
    @Transactional
    public TicketValidationResponse validateSecureTicket(String qrData) {
        try {
            // Vérifier le format des données QR
            if (qrData == null || !qrData.contains("|")) {
                return new TicketValidationResponse(false, "Format de données QR invalide");
            }

            // Extraire primaryKey et signature du QR code
            String[] parts = qrData.split("\\|");
            if (parts.length != 2) {
                return new TicketValidationResponse(false, "Format de données QR incorrect");
            }

            String primaryKey = parts[0].trim();
            String signatureFromQR = parts[1].trim();

            if (primaryKey.isEmpty() || signatureFromQR.isEmpty()) {
                return new TicketValidationResponse(false, "Données QR incomplètes");
            }

            // Chercher le ticket par primaryKey
            Optional<Ticket> ticketOpt = ticketRepository.findByPrimaryKey(primaryKey);
            if (ticketOpt.isEmpty()) {
                return new TicketValidationResponse(false, "Ticket non trouvé");
            }

            Ticket ticket = ticketOpt.get();

            // Vérifier si le ticket est déjà utilisé
            if (ticket.getUsed()) {
                return new TicketValidationResponse(false, "Ticket déjà utilisé");
            }

            // Vérifier la validité générale du ticket
            if (!ticket.isValidForValidation()) {
                return new TicketValidationResponse(false, "Ticket expiré ou invalide");
            }

            // Reconstituer la clé combinée avec la secondaryKey stockée
            String combinedKey = ticket.getPrimaryKey() + ticket.getSecondaryKey();

            // Vérifier la signature
            String expectedSignature = generateHMAC(combinedKey);
            if (!ticket.checkSignature(expectedSignature)) {
                return new TicketValidationResponse(false, "Signature de sécurité invalide");
            }

            // Vérifier que la signature du QR correspond
            if (!signatureFromQR.equals(ticket.getSignature())) {
                return new TicketValidationResponse(false, "Signature QR invalide");
            }

            // Vérifier l'intégrité avec le hash stocké
            String expectedHash = hashKey(combinedKey);
            if (!ticket.checkIntegrity(expectedHash)) {
                return new TicketValidationResponse(false, "Intégrité du ticket compromise");
            }

            // Tout est valide - marquer le ticket comme utilisé
            ticket.markAsUsed();
            Ticket savedTicket = ticketRepository.save(ticket);

            return new TicketValidationResponse(
                    true,
                    "Ticket validé avec succès",
                    savedTicket.getTicketNumber(),
                    savedTicket.getEventTitle()
            );

        } catch (Exception e) {
            return new TicketValidationResponse(false,
                    "Erreur lors de la validation: " + e.getMessage());
        }
    }

    /**
     * Valide un ticket avec les trois composants séparés (pour l'API manuelle)
     */
    @Transactional
    public TicketValidationResponse validateSecureTicketManual(String primaryKey, String secondaryKey, String signature) {
        try {
            if (primaryKey == null || secondaryKey == null || signature == null) {
                return new TicketValidationResponse(false, "Tous les champs doivent être remplis");
            }

            // Chercher le ticket par primaryKey
            Optional<Ticket> ticketOpt = ticketRepository.findByPrimaryKey(primaryKey.trim());
            if (ticketOpt.isEmpty()) {
                return new TicketValidationResponse(false, "Ticket non trouvé");
            }

            Ticket ticket = ticketOpt.get();

            // Vérifications de base
            if (ticket.getUsed()) {
                return new TicketValidationResponse(false, "Ticket déjà utilisé");
            }

            if (!ticket.isValidForValidation()) {
                return new TicketValidationResponse(false, "Ticket expiré ou invalide");
            }

            // Vérifier que la secondaryKey fournie correspond à celle stockée
            if (!secondaryKey.trim().equals(ticket.getSecondaryKey())) {
                return new TicketValidationResponse(false, "Clé secondaire invalide");
            }

            // Vérifier la signature
            String combinedKey = primaryKey.trim() + secondaryKey.trim();
            String expectedSignature = generateHMAC(combinedKey);

            if (!signature.trim().equals(expectedSignature)) {
                return new TicketValidationResponse(false, "Signature invalide");
            }

            // Vérifier l'intégrité
            String expectedHash = hashKey(combinedKey);
            if (!ticket.getHashedKey().equals(expectedHash)) {
                return new TicketValidationResponse(false, "Hash de sécurité invalide");
            }

            // Validation réussie
            ticket.markAsUsed();
            Ticket savedTicket = ticketRepository.save(ticket);

            return new TicketValidationResponse(
                    true,
                    "Ticket validé avec succès",
                    savedTicket.getTicketNumber(),
                    savedTicket.getEventTitle()
            );

        } catch (Exception e) {
            return new TicketValidationResponse(false,
                    "Erreur lors de la validation manuelle: " + e.getMessage());
        }
    }

    /**
     * Récupère les statistiques de ventes journalières
     */
    @Transactional(readOnly = true)
    public DailySalesResponse getDailySales() {
        try {
            LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
            LocalDateTime endOfDay = startOfDay.plusDays(1);

            Long ticketsUsedToday = ticketRepository.countByUsedTrueAndUsedAtBetween(startOfDay, endOfDay);
            Double totalSalesToday = ticketRepository.sumPriceByUsedTrueAndUsedAtBetween(startOfDay, endOfDay);

            return new DailySalesResponse(
                    ticketsUsedToday != null ? ticketsUsedToday : 0L,
                    totalSalesToday != null ? totalSalesToday : 0.0
            );
        } catch (Exception e) {
            // En cas d'erreur, retourner des valeurs par défaut
            return new DailySalesResponse(0L, 0.0);
        }
    }

    /**
     * Crée et sécurise un nouveau ticket complet
     */
    @Transactional
    public Ticket createAndSecureTicket(Ticket ticket) {
        // S'assurer que le ticket a des clés
        if (ticket.getPrimaryKey() == null) {
            ticket.setPrimaryKey(generateTicketKey());
        }
        if (ticket.getSecondaryKey() == null) {
            ticket.setSecondaryKey(generateTicketKey());
        }

        // Sécuriser le ticket
        return secureTicket(ticket);
    }

    /**
     * Vérifie l'état d'un ticket sans le valider
     */
    @Transactional(readOnly = true)
    public TicketValidationResponse checkTicketStatus(String primaryKey) {
        try {
            Optional<Ticket> ticketOpt = ticketRepository.findByPrimaryKey(primaryKey);
            if (ticketOpt.isEmpty()) {
                return new TicketValidationResponse(false, "Ticket non trouvé");
            }

            Ticket ticket = ticketOpt.get();

            if (ticket.getUsed()) {
                return new TicketValidationResponse(false, "Ticket déjà utilisé le " +
                        ticket.getUsedAt().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
            }

            if (!ticket.isValidForValidation()) {
                return new TicketValidationResponse(false, "Ticket non valide pour validation");
            }

            return new TicketValidationResponse(
                    true,
                    "Ticket valide et prêt pour validation",
                    ticket.getTicketNumber(),
                    ticket.getEventTitle()
            );

        } catch (Exception e) {
            return new TicketValidationResponse(false,
                    "Erreur lors de la vérification: " + e.getMessage());
        }
    }
}