package com.olympics.tickets.backend.service;

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

    public String generateTicketKey() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }

    public String hashKey(String key) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(key.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors du hashage", e);
        }
    }

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

    @Transactional
    public boolean validateSecureTicket(String primaryKey, String secondaryKey, String signature) {
        try {
            String combinedKey = primaryKey + secondaryKey;

            // Vérifier la signature
            String expectedSignature = generateHMAC(combinedKey);
            if (!expectedSignature.equals(signature)) {
                return false;
            }

            // Vérifier le hash
            String hashedKey = hashKey(combinedKey);
            Optional<Ticket> ticketOpt = ticketRepository.findByHashedKey(hashedKey);

            if (ticketOpt.isPresent()) {
                Ticket ticket = ticketOpt.get();

                if (ticket.isValidForValidation()) {
                    ticket.markAsUsed();
                    ticketRepository.save(ticket);
                    return true;
                }
            }

            return false;

        } catch (Exception e) {
            return false;
        }
    }
}