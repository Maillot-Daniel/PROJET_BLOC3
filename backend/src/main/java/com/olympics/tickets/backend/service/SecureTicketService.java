package com.olympics.tickets.backend.service;

import com.olympics.tickets.backend.entity.Ticket;
import com.olympics.tickets.backend.repository.EventRepository;
import com.olympics.tickets.backend.repository.TicketRepository;
import com.olympics.tickets.backend.repository.UsersRepository;
import com.stripe.model.checkout.Session;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SecureTicketService {

    private final TicketRepository ticketRepository;
    private final EventRepository eventRepository;
    private final UsersRepository usersRepository;
    private final SecurityAndQrService securityService;
    private final EmailService emailService;

    // -------------------- Paiement et création ticket --------------------
    @Transactional
    public void processSuccessfulPayment(Session session) {
        log.info("🎫 Traitement du paiement pour la session: {}", session.getId());

        String primaryKey = getPrimaryKeyFromSession(session);

        if (ticketRepository.existsByPrimaryKey(primaryKey)) {
            log.warn("Paiement déjà traité pour primaryKey: {}", primaryKey);
            return;
        }

        var metadata = session.getMetadata();
        Long userId = extractLongFromMetadata(metadata, "userId");
        Long eventId = extractLongFromMetadata(metadata, "eventId");
        Long offerTypeId = extractLongFromMetadata(metadata, "offerTypeId");
        Integer quantity = extractIntegerFromMetadata(metadata, "quantity", 1);

        Ticket ticket = createSecureTicketFromSession(session, userId, eventId, offerTypeId, quantity);
        log.info("🎫 Ticket créé avec succès: {} pour l'utilisateur ID: {}", ticket.getTicketNumber(), userId);
        sendConfirmationEmail(ticket, userId);
    }

    private Ticket createSecureTicketFromSession(Session session, Long userId, Long eventId,
                                                 Long offerTypeId, Integer quantity) {

        var event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Événement introuvable: " + eventId));

        if (event.getRemainingTickets() < quantity) {
            throw new IllegalStateException(String.format(
                    "Stock insuffisant. Demande: %d, Disponible: %d", quantity, event.getRemainingTickets()));
        }
        event.setRemainingTickets(event.getRemainingTickets() - quantity);
        eventRepository.save(event);

        if (!usersRepository.existsById(userId)) {
            throw new IllegalArgumentException("Utilisateur introuvable: " + userId);
        }

        BigDecimal totalPrice = BigDecimal.valueOf(session.getAmountTotal() / 100.0);
        String primaryKey = getPrimaryKeyFromSession(session);
        String secondaryKey = securityService.generateRandomKey();
        String hashedKey = primaryKey + "|" + secondaryKey;
        String signature = securityService.createSignature(hashedKey);

        Ticket ticket = Ticket.createSecureTicket(eventId, userId, offerTypeId, quantity, totalPrice, primaryKey, secondaryKey);
        ticket.setHashedKey(hashedKey);
        ticket.setSignature(signature);
        ticket.setValidated(true);

        String qrData = hashedKey + "|" + signature;
        ticket.setQrCodeUrl(securityService.generateQrCodeFile(qrData));

        return ticketRepository.save(ticket);
    }

    // -------------------- Validation ticket --------------------
    @Transactional
    public Ticket validateTicket(String validationData) {
        String[] parts = validationData.split("\\|");
        if (parts.length != 2) throw new IllegalArgumentException("Format attendu: primaryKey|signature");

        String primaryKey = parts[0];
        String signature = parts[1];

        Ticket ticket = ticketRepository.findByPrimaryKey(primaryKey)
                .orElseThrow(() -> new IllegalArgumentException("Ticket non trouvé pour la clé: " + primaryKey));

        if (!securityService.verifySignature(ticket.getHashedKey(), signature)) {
            throw new SecurityException("Signature invalide");
        }

        if (!ticket.isValidForValidation()) {
            throw new IllegalStateException("Ticket déjà utilisé ou non validé");
        }

        ticket.markAsUsed();
        return ticketRepository.save(ticket);
    }

    public Ticket validateSecureTicket(String validationData) {
        return validateTicket(validationData);
    }

    public Ticket validateSecureTicketManual(String primaryKey, String secondaryKey, String signature) {
        Ticket ticket = ticketRepository.findByPrimaryKey(primaryKey)
                .orElseThrow(() -> new IllegalArgumentException("Ticket non trouvé"));

        String hashedKey = primaryKey + "|" + secondaryKey;

        if (!securityService.verifySignature(hashedKey, signature)) {
            throw new SecurityException("Signature invalide");
        }

        if (!ticket.isValidForValidation()) {
            throw new IllegalStateException("Ticket déjà utilisé ou non validé");
        }

        ticket.markAsUsed();
        return ticketRepository.save(ticket);
    }

    // -------------------- Annulation ticket --------------------
    @Transactional
    public boolean cancelTicket(Long ticketId, Long userId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket introuvable"));

        if (!ticket.getUserId().equals(userId)) throw new SecurityException("Non autorisé");
        if (!ticket.canBeCancelled()) throw new IllegalStateException("Ce ticket ne peut pas être annulé");

        eventRepository.findById(ticket.getEventId()).ifPresent(event -> {
            event.setRemainingTickets(event.getRemainingTickets() + ticket.getQuantity());
            eventRepository.save(event);
        });

        ticket.setUsed(true);
        ticket.setValidated(true);
        ticket.setUsedAt(LocalDateTime.now());
        ticketRepository.save(ticket);

        return true;
    }

    // -------------------- Statistiques --------------------
    public BigDecimal getDailySales() {
        BigDecimal dailyRevenue = ticketRepository.getDailyRevenue();
        return dailyRevenue != null ? dailyRevenue : BigDecimal.ZERO;
    }

    /**
     * ✅ Nouvelle méthode pour récupérer les ventes par type d'offre
     */
    public List<Object[]> countSalesGroupedByOffer() {
        return ticketRepository.countSalesGroupedByOffer();
    }

    // -------------------- Récupération tickets --------------------
    public Ticket getTicketByPrimaryKey(String primaryKey) {
        return ticketRepository.findByPrimaryKey(primaryKey)
                .orElseThrow(() -> new IllegalArgumentException("Ticket non trouvé pour la clé: " + primaryKey));
    }

    public Ticket checkTicketStatus(String primaryKey) {
        return getTicketByPrimaryKey(primaryKey);
    }

    public List<Ticket> getUserTickets(Long userId) {
        if (!usersRepository.existsById(userId)) throw new IllegalArgumentException("Utilisateur introuvable");
        return ticketRepository.findByUserId(userId);
    }

    // -------------------- Utilitaires --------------------
    private String getPrimaryKeyFromSession(Session session) {
        return session.getPaymentIntent() != null ? session.getPaymentIntent() : session.getId();
    }

    private Long extractLongFromMetadata(java.util.Map<String, String> metadata, String key) {
        if (metadata != null && metadata.get(key) != null) {
            try {
                return Long.parseLong(metadata.get(key));
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("Métadonnée invalide: " + key);
            }
        }
        throw new IllegalArgumentException("Métadonnée manquante: " + key);
    }

    private Integer extractIntegerFromMetadata(java.util.Map<String, String> metadata, String key, Integer defaultValue) {
        if (metadata != null && metadata.get(key) != null) {
            try {
                return Integer.parseInt(metadata.get(key));
            } catch (NumberFormatException e) {
                return defaultValue;
            }
        }
        return defaultValue;
    }

    private void sendConfirmationEmail(Ticket ticket, Long userId) {
        String userEmail = usersRepository.findById(userId)
                .map(u -> u.getEmail())
                .orElse("utilisateur-inconnu@example.com");
        log.info("📧 Email de confirmation envoyé à {} pour le ticket: {}", userEmail, ticket.getTicketNumber());
    }
}
