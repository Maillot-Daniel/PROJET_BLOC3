package com.olympics.tickets.backend.service;

import com.olympics.tickets.backend.dto.TicketRequest;
import com.olympics.tickets.backend.entity.OurUsers;
import com.olympics.tickets.backend.entity.Ticket;
import com.olympics.tickets.backend.repository.TicketRepository;
import com.olympics.tickets.backend.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UsersRepository usersRepository;
    private final EmailService emailService;

    private final String FIXED_TEST_EMAIL = "d0c004224e85f3@inbox.mailtrap.io";

    // ======================== NOUVELLE MÉTHODE ========================
    @Transactional
    public Ticket createTicketAndSendEmail(TicketRequest request) {
        try {
            Optional<OurUsers> userOptional = usersRepository.findById(request.getUserId());
            OurUsers user = userOptional.orElse(null);

            Ticket ticket = Ticket.builder()
                    .ticketNumber(generateTicketNumber())
                    .eventId(request.getEventId())
                    .userId(user != null ? user.getId() : null)
                    .offerTypeId(request.getOfferTypeId().longValue())
                    .quantity(request.getQuantity())
                    .price(request.getPrice())
                    .purchaseDate(LocalDateTime.now())
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .validated(false)
                    .used(false)
                    .build();

            ticket = ticketRepository.save(ticket);
            log.info("Ticket créé et sauvegardé: {}", ticket.getTicketNumber());

            Map<String, Object> ticketData = new HashMap<>();
            ticketData.put("ticketNumber", ticket.getTicketNumber());
            ticketData.put("eventId", ticket.getEventId());
            ticketData.put("quantity", ticket.getQuantity());
            ticketData.put("price", ticket.getPrice());
            ticketData.put("purchaseDate", ticket.getPurchaseDate().toString());
            ticketData.put("qrCode", generateQRCode(ticket));

            boolean emailSent = emailService.sendTicket(
                    FIXED_TEST_EMAIL,
                    ticket.getTicketNumber(),
                    ticketData.get("qrCode").toString(),
                    ticketData
            );

            if (emailSent) {
                log.info("Email de ticket envoyé avec succès pour ticket {}", ticket.getTicketNumber());
            } else {
                log.error("Échec envoi email pour ticket {}", ticket.getTicketNumber());
            }

            return ticket;

        } catch (Exception e) {
            log.error("Erreur création et envoi ticket: {}", e.getMessage(), e);
            throw new RuntimeException("Impossible de créer le ticket");
        }
    }

    // ======================== MÉTHODE DEBUG ========================
    public Ticket createDebugTicket(com.stripe.model.checkout.Session session) {
        Ticket ticket = Ticket.builder()
                .ticketNumber("DEBUG-" + System.currentTimeMillis())
                .eventId(1L)
                .userId(1L)
                .offerTypeId(1L)
                .quantity(1)
                .price(new BigDecimal("50.00"))
                .purchaseDate(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .validated(false)
                .used(false)
                .build();
        return ticketRepository.save(ticket);
    }

    // ======================== MÉTHODE POUR LE DASHBOARD ========================
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalTickets", ticketRepository.count());
        stats.put("validatedTickets", ticketRepository.countByValidatedTrue());
        stats.put("usedTickets", ticketRepository.countByUsedTrue());
        return stats;
    }

    // ======================== TRAITEMENT PAIEMENT ========================
    @Transactional
    public void processSuccessfulPayment(com.stripe.model.checkout.Session session) {
        log.info("Paiement réussi pour session {}", session.getId());
        // Ici tu peux ajouter la logique pour créer ticket + envoyer email
    }

    // ======================== UTILITAIRES ========================
    private String generateQRCode(Ticket ticket) {
        return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
    }

    private String generateTicketNumber() {
        return "TKT-" + System.currentTimeMillis() + "-" + new Random().nextInt(1000);
    }

    // ======================== RÉCUPÉRATION TICKETS ========================
    public List<Ticket> getUserTickets(Long userId) {
        return ticketRepository.findByUserId(userId);
    }

    public List<Ticket> getUserActiveTickets(Long userId) {
        return ticketRepository.findByUserIdAndUsedFalse(userId);
    }

    // ======================== VALIDATION / ANNULATION ========================
    public Ticket validateTicket(String validationData) {
        log.info("Validation du ticket: {}", validationData);
        return null;
    }

    public boolean cancelTicket(Long ticketId, Long userId) {
        log.info("Annulation du ticket {} pour l'utilisateur {}", ticketId, userId);
        return true;
    }

    // ======================== NETTOYAGE ========================
    public int cleanupExpiredTickets() {
        return 0;
    }

    // ======================== STATISTIQUES ========================
    public TicketStatistics getTicketStatistics() {
        long totalTickets = ticketRepository.count();
        long validatedTickets = ticketRepository.countByValidatedTrue();
        long usedTickets = ticketRepository.countByUsedTrue();
        double totalRevenue = 130200.0;
        return new TicketStatistics(totalTickets, validatedTickets, usedTickets, totalRevenue);
    }

    public static class TicketStatistics {
        public long totalTickets;
        public long validatedTickets;
        public long usedTickets;
        public double totalRevenue;

        public TicketStatistics(long totalTickets, long validatedTickets, long usedTickets, double totalRevenue) {
            this.totalTickets = totalTickets;
            this.validatedTickets = validatedTickets;
            this.usedTickets = usedTickets;
            this.totalRevenue = totalRevenue;
        }
    }
}
