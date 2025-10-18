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
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketService {

    private final TicketRepository ticketRepository;
    private final EventRepository eventRepository;
    private final UsersRepository usersRepository;
    private final SecurityAndQrService securityService;
    private final EmailService emailService;

    // ---------------- Paiement et création de ticket ----------------

    @Transactional
    public void processSuccessfulPayment(Session session) {
        log.info("🎫 Début du traitement du paiement pour la session: {}", session.getId());

        try {
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

        } catch (Exception e) {
            log.error("❌ Erreur lors du traitement du paiement Stripe", e);
            throw new RuntimeException("Échec du traitement du paiement: " + e.getMessage(), e);
        }
    }

    private Ticket createSecureTicketFromSession(Session session, Long userId, Long eventId,
                                                 Long offerTypeId, Integer quantity) {

        if (!eventRepository.existsById(eventId))
            throw new IllegalArgumentException("Événement introuvable: " + eventId);

        if (!usersRepository.existsById(userId))
            throw new IllegalArgumentException("Utilisateur introuvable: " + userId);

        var eventOptional = eventRepository.findById(eventId);
        if (eventOptional.isPresent()) {
            var event = eventOptional.get();
            if (event.getRemainingTickets() < quantity) {
                throw new IllegalStateException(String.format(
                        "Stock insuffisant. Demande: %d, Disponible: %d", quantity, event.getRemainingTickets()));
            }
            event.setRemainingTickets(event.getRemainingTickets() - quantity);
            eventRepository.save(event);
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
        String qrCodePath = securityService.generateQrCodeFile(qrData);
        ticket.setQrCodeUrl(qrCodePath);

        return ticketRepository.save(ticket);
    }

    @Transactional
    public Ticket createDebugTicket(Session session) {
        Ticket ticket = Ticket.builder()
                .ticketNumber("DEBUG-" + System.currentTimeMillis())
                .eventId(1L)
                .userId(1L)
                .offerTypeId(1L)
                .purchaseDate(LocalDateTime.now())
                .quantity(1)
                .price(BigDecimal.valueOf(session.getAmountTotal() / 100.0))
                .validated(true)
                .used(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .primaryKey("DEBUG-" + session.getId())
                .secondaryKey("DEBUG-SECONDARY")
                .hashedKey("DEBUG-HASH")
                .signature("DEBUG-SIGNATURE")
                .qrCodeUrl("")
                .build();
        return ticketRepository.save(ticket);
    }

    // ---------------- Méthodes utilitaires ----------------

    private String getPrimaryKeyFromSession(Session session) {
        return session.getPaymentIntent() != null ? session.getPaymentIntent() : session.getId();
    }

    private Long extractLongFromMetadata(java.util.Map<String, String> metadata, String key) {
        if (metadata != null && metadata.get(key) != null) {
            try { return Long.parseLong(metadata.get(key)); }
            catch (NumberFormatException e) { throw new IllegalArgumentException("Métadonnée invalide: " + key); }
        }
        throw new IllegalArgumentException("Métadonnée manquante: " + key);
    }

    private Integer extractIntegerFromMetadata(java.util.Map<String, String> metadata, String key, Integer defaultValue) {
        if (metadata != null && metadata.get(key) != null) {
            try { return Integer.parseInt(metadata.get(key)); } catch (NumberFormatException e) { }
        }
        return defaultValue;
    }

    private void sendConfirmationEmail(Ticket ticket, Long userId) {
        String userEmail = usersRepository.findById(userId)
                .map(u -> u.getEmail())
                .orElse("utilisateur-inconnu@example.com");
        log.info("📧 Email de confirmation envoyé à {} pour le ticket: {}", userEmail, ticket.getTicketNumber());
        // emailService.sendTicketConfirmation(userEmail, ticket); // Décommenter pour l'envoi réel
    }

    // ---------------- Gestion des tickets ----------------

    public List<Ticket> getUserTickets(Long userId) {
        if (!usersRepository.existsById(userId))
            throw new IllegalArgumentException("Utilisateur introuvable: " + userId);
        return ticketRepository.findByUserId(userId);
    }

    public List<Ticket> getUserActiveTickets(Long userId) {
        if (!usersRepository.existsById(userId))
            throw new IllegalArgumentException("Utilisateur introuvable: " + userId);
        return ticketRepository.findByUserIdAndUsedFalse(userId);
    }

    @Transactional
    public Ticket validateTicket(String validationData) {
        String[] parts = validationData.split("\\|");
        if (parts.length != 2)
            throw new IllegalArgumentException("Données invalides: primaryKey|signature attendu");

        String primaryKey = parts[0];
        String signature = parts[1];

        Ticket ticket = ticketRepository.findByPrimaryKey(primaryKey)
                .orElseThrow(() -> new IllegalArgumentException("Ticket non trouvé pour la clé: " + primaryKey));

        if (!securityService.verifySignature(ticket.getHashedKey(), signature))
            throw new SecurityException("Signature invalide");

        if (!ticket.isValidForValidation())
            throw new IllegalStateException("Ticket non valide pour validation");

        ticket.markAsUsed();
        return ticketRepository.save(ticket);
    }

    @Transactional
    public boolean cancelTicket(Long ticketId, Long userId) {
        Optional<Ticket> optTicket = ticketRepository.findById(ticketId);
        if (optTicket.isEmpty()) return false;

        Ticket ticket = optTicket.get();
        if (!ticket.getUserId().equals(userId))
            throw new SecurityException("Non autorisé à annuler ce ticket");

        if (!ticket.canBeCancelled())
            throw new IllegalStateException("Ticket ne peut pas être annulé");

        var eventOpt = eventRepository.findById(ticket.getEventId());
        eventOpt.ifPresent(event -> {
            event.setRemainingTickets(event.getRemainingTickets() + ticket.getQuantity());
            eventRepository.save(event);
        });

        ticket.markAsUsed();
        ticket.setValidated(true);
        return true;
    }

    public TicketStatistics getTicketStatistics() {
        long totalTickets = ticketRepository.countAllTickets();
        long usedToday = ticketRepository.countUsedToday();
        BigDecimal dailyRevenue = ticketRepository.getDailyRevenue();
        return new TicketStatistics(totalTickets, usedToday, dailyRevenue != null ? dailyRevenue : BigDecimal.ZERO);
    }

    @Transactional
    public int cleanupExpiredTickets() {
        LocalDateTime expiryDate = LocalDateTime.now().minusMonths(1);
        List<Ticket> expiredTickets = ticketRepository.findExpiredTickets(expiryDate);

        expiredTickets.forEach(ticket -> {
            eventRepository.findById(ticket.getEventId()).ifPresent(event -> {
                event.setRemainingTickets(event.getRemainingTickets() + ticket.getQuantity());
                eventRepository.save(event);
            });
        });

        ticketRepository.deleteAll(expiredTickets);
        return expiredTickets.size();
    }

    // ---------------- Classe interne pour statistiques ----------------

    public static class TicketStatistics {
        private final long totalTickets;
        private final long usedToday;
        private final BigDecimal dailyRevenue;

        public TicketStatistics(long totalTickets, long usedToday, BigDecimal dailyRevenue) {
            this.totalTickets = totalTickets;
            this.usedToday = usedToday;
            this.dailyRevenue = dailyRevenue;
        }

        public long getTotalTickets() { return totalTickets; }
        public long getUsedToday() { return usedToday; }
        public BigDecimal getDailyRevenue() { return dailyRevenue; }
    }
}