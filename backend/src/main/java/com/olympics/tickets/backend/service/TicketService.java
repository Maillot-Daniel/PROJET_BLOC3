package com.olympics.tickets.backend.service;

import com.olympics.tickets.backend.dto.EventSalesDTO;
import com.olympics.tickets.backend.entity.Order;
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
import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UsersRepository usersRepository;
    private final PaymentService paymentService;
    private final EmailService emailService;
    private final OrderService orderService;

    @Transactional
    public void processSuccessfulPayment(Session session) {
        log.info("💰 Traitement paiement réussi: {}", session.getId());

        try {
            String customerEmail = session.getCustomerEmail();
            if (customerEmail == null || customerEmail.isEmpty()) {
                log.error("❌ Email client manquant dans session Stripe");
                return;
            }

            log.info("📧 Client: {}", customerEmail);
            log.info("💰 Montant: {}", session.getAmountTotal());

            Optional<OurUsers> userOptional = usersRepository.findByEmail(customerEmail);
            if (userOptional.isEmpty()) {
                log.error("❌ Utilisateur non trouvé: {}", customerEmail);
                return;
            }
            OurUsers user = userOptional.get();

            List<Map<String, Object>> cartItems = extractCartItemsFromSession(session);
            Order order = orderService.createOrderFromStripeSession(session, cartItems);

            List<Ticket> tickets = createTicketsFromSession(session, user);
            List<Object> ticketsForEmail = prepareTicketsForEmail(tickets, session);
            paymentService.processPaymentSuccess(customerEmail, ticketsForEmail);

            log.info("✅ Paiement traité - Commande: {}, Tickets: {}", order.getOrderNumber(), tickets.size());

        } catch (Exception e) {
            log.error("❌ Erreur traitement paiement: {}", e.getMessage(), e);
        }
    }

    private List<Map<String, Object>> extractCartItemsFromSession(Session session) {
        List<Map<String, Object>> cartItems = new ArrayList<>();
        Map<String, Object> item = new HashMap<>();
        item.put("eventId", 1L);
        item.put("eventTitle", "Événement Olympique");
        item.put("offerTypeId", 1L);
        item.put("offerTypeName", "Standard");
        item.put("quantity", 1);
        item.put("priceUnit", session.getAmountTotal() / 100.0);
        cartItems.add(item);
        return cartItems;
    }

    private List<Ticket> createTicketsFromSession(Session session, OurUsers user) {
        List<Ticket> tickets = new ArrayList<>();
        Ticket ticket = Ticket.builder()
                .ticketNumber("TKT-" + System.currentTimeMillis() + "-" + new Random().nextInt(1000))
                .eventId(1L)
                .userId(user.getId())
                .offerTypeId(1L)
                .quantity(1)
                .price(new BigDecimal("50.00"))
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
            return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
        } catch (Exception e) {
            log.error("❌ Erreur génération QR Code: {}", e.getMessage());
            return null;
        }
    }

    public List<EventSalesDTO> getSalesByEvent() {
        log.info("📈 Récupération des ventes par événement depuis les commandes");
        return orderService.getSalesByOfferType();
    }

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> orderStats = orderService.getSalesStats();
        Map<String, Object> stats = new HashMap<>();
        stats.putAll(orderStats);
        stats.put("totalTickets", ticketRepository.count());
        stats.put("validatedTickets", ticketRepository.countByValidatedTrue());
        stats.put("usedTickets", ticketRepository.countByUsedTrue());
        stats.put("recentOrders", orderService.getRecentOrders(5));
        return stats;
    }

    public Ticket createDebugTicket(Session session) {
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

    public List<Ticket> getUserTickets(Long userId) {
        return ticketRepository.findByUserId(userId);
    }

    public List<Ticket> getUserActiveTickets(Long userId) {
        return ticketRepository.findByUserIdAndUsedFalse(userId);
    }

    public Ticket validateTicket(String validationData) {
        log.info("Validation du ticket: {}", validationData);
        return null;
    }

    public boolean cancelTicket(Long ticketId, Long userId) {
        log.info("Annulation du ticket {} pour l'utilisateur {}", ticketId, userId);
        return true;
    }

    public int cleanupExpiredTickets() {
        return 0;
    }

    public TicketStatistics getTicketStatistics() {
        long totalTickets = ticketRepository.count();
        long validatedTickets = ticketRepository.countByValidatedTrue();
        long usedTickets = ticketRepository.countByUsedTrue();
        double totalRevenue = 130200.0;
        return new TicketStatistics(totalTickets, validatedTickets, usedTickets, totalRevenue);
    }

    public List<Object[]> countSalesGroupedByOffer() {
        return ticketRepository.countSalesGroupedByOffer();
    }
}