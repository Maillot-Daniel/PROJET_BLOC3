package com.olympics.tickets.backend.service;

import com.olympics.tickets.backend.dto.EventSalesDTO;
import com.olympics.tickets.backend.entity.OurUsers;
import com.olympics.tickets.backend.entity.Ticket;
import com.olympics.tickets.backend.repository.UsersRepository;
import com.olympics.tickets.backend.repository.TicketRepository;
import com.stripe.model.checkout.Session;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UsersRepository usersRepository;
    private final PaymentService paymentService;
    private final EmailService emailService;

    @Transactional
    public void processSuccessfulPayment(Session session) {
        log.info("💰 Traitement paiement réussi: {}", session.getId());

        try {
            // 1. Récupérer l'email du client depuis Stripe
            String customerEmail = session.getCustomerEmail();
            if (customerEmail == null || customerEmail.isEmpty()) {
                log.error("❌ Email client manquant dans session Stripe");
                return;
            }

            log.info("📧 Client: {}", customerEmail);
            log.info("💰 Montant: {}", session.getAmountTotal());

            // 2. Récupérer l'utilisateur
            Optional<OurUsers> userOptional = usersRepository.findByEmail(customerEmail);
            if (userOptional.isEmpty()) {
                log.error("❌ Utilisateur non trouvé: {}", customerEmail);
                return;
            }
            OurUsers user = userOptional.get();

            // 3. Créer les tickets
            List<Ticket> tickets = createTicketsFromSession(session, user);

            // 4. Préparer les données pour l'email
            List<Object> ticketsForEmail = prepareTicketsForEmail(tickets, session);

            // 5. ✅ ENVOI EMAIL AUTOMATIQUE
            paymentService.processPaymentSuccess(customerEmail, ticketsForEmail);

            log.info("✅ Paiement traité - {} tickets créés, email envoyé", tickets.size());

        } catch (Exception e) {
            log.error("❌ Erreur traitement paiement: {}", e.getMessage(), e);
        }
    }

    private List<Ticket> createTicketsFromSession(Session session, OurUsers user) {
        List<Ticket> tickets = new ArrayList<>();

        // Créer un ticket de test
        Ticket ticket = Ticket.builder()
                .ticketNumber("TKT-" + System.currentTimeMillis() + "-" + new Random().nextInt(1000))
                .eventId(1L)
                .userId(user.getId())
                .offerTypeId(1L)
                .quantity(1)
                .price(new java.math.BigDecimal("50.00"))
                .purchaseDate(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .validated(false)
                .used(false)
                .build();

        tickets.add(ticket);
        return ticketRepository.saveAll(tickets);
    }

    private List<Object> prepareTicketsForEmail(List<Ticket> tickets, Session session) {
        List<Object> ticketsForEmail = new ArrayList<>();

        for (Ticket ticket : tickets) {
            try {
                String qrCode = generateQRCodeForTicket(ticket);

                Map<String, Object> ticketData = new HashMap<>();
                ticketData.put("orderNumber", ticket.getTicketNumber());
                ticketData.put("qrCode", qrCode);
                ticketData.put("purchaseDate", ticket.getPurchaseDate().toString());
                ticketData.put("total", String.valueOf(session.getAmountTotal() / 100.0));
                ticketData.put("eventTitle", "Événement Olympique");

                ticketsForEmail.add(ticketData);

            } catch (Exception e) {
                log.error("❌ Erreur préparation ticket: {}", e.getMessage());
            }
        }

        return ticketsForEmail;
    }

    private String generateQRCodeForTicket(Ticket ticket) {
        try {
            // Simuler un QR Code base64
            return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
        } catch (Exception e) {
            log.error("❌ Erreur génération QR Code: {}", e.getMessage());
            return null;
        }
    }

    // 📊 MÉTHODES D'ANALYSE POUR ADMIN
    public List<EventSalesDTO> getSalesByEvent() {
        log.info("📈 Récupération des ventes par événement");

        // Utiliser la méthode de votre repository
        List<Object[]> results = ticketRepository.countSalesGroupedByOffer();
        List<EventSalesDTO> sales = new ArrayList<>();

        for (Object[] result : results) {
            Long offerTypeId = (Long) result[0];
            Long count = (Long) result[1];

            // Simuler des données d'événement basées sur l'offerTypeId
            String eventTitle = getEventTitleFromOfferType(offerTypeId);
            String eventType = getEventTypeFromOfferType(offerTypeId);
            Double revenue = count * 100.0; // Prix moyen simulé

            sales.add(new EventSalesDTO(offerTypeId, eventTitle, eventType, count, revenue));
        }

        // Si pas de données, retourner des données simulées
        if (sales.isEmpty()) {
            sales.add(new EventSalesDTO(1L, "Cérémonie d'Ouverture", "Cérémonie", 150L, 45000.0));
            sales.add(new EventSalesDTO(2L, "Finale Athlétisme 100m", "Athlétisme", 89L, 26700.0));
            sales.add(new EventSalesDTO(3L, "Finale Natation", "Natation", 120L, 36000.0));
        }

        return sales;
    }

    private String getEventTitleFromOfferType(Long offerTypeId) {
        Map<Long, String> eventTitles = Map.of(
                1L, "Cérémonie d'Ouverture",
                2L, "Finale Athlétisme 100m",
                3L, "Finale Natation",
                4L, "Basketball Finale"
        );
        return eventTitles.getOrDefault(offerTypeId, "Événement " + offerTypeId);
    }

    private String getEventTypeFromOfferType(Long offerTypeId) {
        Map<Long, String> eventTypes = Map.of(
                1L, "Cérémonie",
                2L, "Athlétisme",
                3L, "Natation",
                4L, "Basketball"
        );
        return eventTypes.getOrDefault(offerTypeId, "Sport");
    }

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        // Utiliser les méthodes du repository
        stats.put("totalTickets", ticketRepository.count());
        stats.put("validatedTickets", ticketRepository.countByValidatedTrue());
        stats.put("usedTickets", ticketRepository.countByUsedTrue());
        stats.put("dailyRevenue", ticketRepository.getDailyRevenue());

        // Données simulées pour la démo
        stats.put("mostPopularEvent", "Cérémonie d'Ouverture");
        stats.put("salesByMonth", Map.of("Janvier", 45000.0, "Février", 52000.0, "Mars", 33200.0));

        return stats;
    }

    // Méthodes pour le controller
    public Ticket createDebugTicket(Session session) {
        Ticket ticket = Ticket.builder()
                .ticketNumber("DEBUG-" + System.currentTimeMillis())
                .eventId(1L)
                .userId(1L)
                .offerTypeId(1L)
                .quantity(1)
                .price(new java.math.BigDecimal("50.00"))
                .purchaseDate(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .validated(false)
                .used(false)
                .build();

        return ticketRepository.save(ticket);
    }

    public List<Ticket> getUserTickets(Long userId) {
        return ticketRepository.findByUserId(userId);
    }

    public List<Ticket> getUserActiveTickets(Long userId) {
        return ticketRepository.findByUserIdAndUsedFalse(userId);
    }

    public Ticket validateTicket(String validationData) {
        log.info("Validation du ticket: {}", validationData);
        // Implémentez votre logique de validation ici
        return null;
    }

    public boolean cancelTicket(Long ticketId, Long userId) {
        log.info("Annulation du ticket {} pour l'utilisateur {}", ticketId, userId);
        // Implémentez votre logique d'annulation ici
        return true;
    }

    public int cleanupExpiredTickets() {
        // Implémentez votre logique de nettoyage ici
        return 0;
    }

    // ✅ MÉTHODE POUR LES STATISTIQUES
    public TicketStatistics getTicketStatistics() {
        long totalTickets = ticketRepository.count();
        long validatedTickets = ticketRepository.countByValidatedTrue();
        long usedTickets = ticketRepository.countByUsedTrue();
        double totalRevenue = 130200.0; // Simulé pour l'instant

        return new TicketStatistics(totalTickets, validatedTickets, usedTickets, totalRevenue);
    }

    // ✅ NOUVELLE MÉTHODE : Ventes par type d'offre
    public List<Object[]> countSalesGroupedByOffer() {
        return ticketRepository.countSalesGroupedByOffer();
    }
}