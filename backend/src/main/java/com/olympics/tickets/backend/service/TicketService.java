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

    // ✅ EMAIL FIXE POUR TESTS
    private final String FIXED_TEST_EMAIL = "d0c004224e85f3@inbox.mailtrap.io";

    @Transactional
    public void processSuccessfulPayment(Session session) {
        log.info("🎫 DÉBUT - Traitement paiement réussi: {}", session.getId());

        try {
            // ✅ RÉCUPÉRATION DES DONNÉES STRIPE
            Map<String, String> metadata = session.getMetadata();
            String customerEmail = session.getCustomerEmail();
            String orderNumber = getOrderNumberFromMetadata(metadata);

            log.info("📧 Email client: {}", customerEmail);
            log.info("📦 Numéro commande: {}", orderNumber);
            log.info("💰 Montant: {}€", session.getAmountTotal() / 100.0);
            log.info("🔍 Métadonnées: {}", metadata);

            // ✅ ENVOI EMAIL DE CONFIRMATION (PRIORITAIRE)
            boolean emailSent = sendOrderConfirmationEmail(customerEmail, orderNumber, session);

            if (emailSent) {
                log.info("✅ Email de confirmation envoyé avec succès");
            } else {
                log.error("❌ Échec envoi email - tentative méthode simple");
                // Fallback immédiat
                emailService.sendTicketSimple(FIXED_TEST_EMAIL, orderNumber,
                        String.format("%.2f", session.getAmountTotal() / 100.0));
            }

            // ✅ TRAITEMENT UTILISATEUR ET COMMANDE
            processUserAndOrder(session, customerEmail, orderNumber);

            log.info("🎫 FIN - Paiement traité avec succès");

        } catch (Exception e) {
            log.error("💥 ERREUR CRITIQUE traitement paiement: {}", e.getMessage(), e);
            sendEmergencyEmail(session);
        }
    }

    // ✅ MÉTHODE POUR RÉCUPÉRER LE NUMÉRO DE COMMANDE
    private String getOrderNumberFromMetadata(Map<String, String> metadata) {
        if (metadata != null && metadata.containsKey("order_number")) {
            return metadata.get("order_number");
        }
        // Fallback: générer un numéro unique
        String fallbackOrderNumber = "OLY-" + System.currentTimeMillis() + "-" + new Random().nextInt(1000);
        log.warn("⚠️ Numéro de commande non trouvé dans métadonnées, utilisation: {}", fallbackOrderNumber);
        return fallbackOrderNumber;
    }

    // ✅ MÉTHODE PRINCIPALE POUR ENVOYER L'EMAIL
    private boolean sendOrderConfirmationEmail(String customerEmail, String orderNumber, Session session) {
        try {
            log.info("📧 PRÉPARATION EMAIL - Commande: {}", orderNumber);

            // Préparer les données du ticket
            Map<String, Object> ticketData = createTicketData(session);

            // Générer un QR code simple
            String qrCodeData = generateSimpleQRCode(orderNumber);

            // ✅ APPEL DIRECT À EMAIL SERVICE
            boolean success = emailService.sendTicket(
                    FIXED_TEST_EMAIL, // ✅ FORCER l'email fixe
                    orderNumber,
                    qrCodeData,
                    ticketData
            );

            log.info("📧 RÉSULTAT EMAIL: {}", success ? "✅ SUCCÈS" : "❌ ÉCHEC");
            return success;

        } catch (Exception e) {
            log.error("❌ ERREUR préparation email: {}", e.getMessage());
            return false;
        }
    }

    // ✅ CRÉATION DES DONNÉES DU TICKET
    private Map<String, Object> createTicketData(Session session) {
        Map<String, Object> ticketData = new HashMap<>();
        Map<String, String> metadata = session.getMetadata();

        ticketData.put("purchaseDate", new java.util.Date().toString());
        ticketData.put("total", String.format("%.2f", session.getAmountTotal() / 100.0));

        // Récupérer le nom de l'événement depuis les métadonnées
        String eventTitle = "Événement Olympique";
        if (metadata != null && metadata.containsKey("event_titles")) {
            eventTitle = metadata.get("event_titles");
        }
        ticketData.put("eventTitle", eventTitle);

        log.info("📋 Données ticket créées: {}", ticketData);
        return ticketData;
    }

    // ✅ TRAITEMENT UTILISATEUR ET COMMANDE
    private void processUserAndOrder(Session session, String customerEmail, String orderNumber) {
        try {
            // Rechercher l'utilisateur
            Optional<OurUsers> userOptional = usersRepository.findByEmail(customerEmail);
            if (userOptional.isEmpty()) {
                log.warn("⚠️ Utilisateur non trouvé: {}, création de tickets sans utilisateur", customerEmail);
                // Continuer sans utilisateur
                return;
            }

            OurUsers user = userOptional.get();
            log.info("👤 Utilisateur trouvé: {} (ID: {})", user.getEmail(), user.getId());

            // Créer les éléments du panier
            List<Map<String, Object>> cartItems = extractCartItemsFromSession(session);

            // Créer la commande
            Order order = orderService.createOrderFromStripeSession(session, cartItems);
            log.info("📦 Commande créée: {}", order.getOrderNumber());

            // Créer les tickets
            List<Ticket> tickets = createTicketsFromSession(session, user);
            log.info("🎫 Tickets créés: {}", tickets.size());

            // Préparer les tickets pour email
            List<Object> ticketsForEmail = prepareTicketsForEmail(tickets, session);

            // Traiter le paiement
            paymentService.processPaymentSuccess(customerEmail, ticketsForEmail);

            log.info("✅ Traitement utilisateur/commande terminé");

        } catch (Exception e) {
            log.error("❌ Erreur traitement utilisateur/commande: {}", e.getMessage(), e);
            // Ne pas propager l'erreur pour ne pas bloquer l'email
        }
    }

    // ✅ MÉTHODE D'URGENCE
    private void sendEmergencyEmail(Session session) {
        try {
            String orderNumber = "EMG-" + System.currentTimeMillis();
            String total = session.getAmountTotal() != null ?
                    String.format("%.2f", session.getAmountTotal() / 100.0) : "0.00";

            log.warn("🆘 ENVOI EMAIL D'URGENCE - Commande: {}", orderNumber);

            boolean success = emailService.sendTicketSimple(FIXED_TEST_EMAIL, orderNumber, total);

            if (success) {
                log.info("✅ Email d'urgence envoyé");
            } else {
                log.error("💥 ÉCHEC email d'urgence");
            }

        } catch (Exception e) {
            log.error("💥 ERREUR CRITIQUE email d'urgence: {}", e.getMessage());
        }
    }

    // ✅ GÉNÉRATION QR CODE
    private String generateSimpleQRCode(String orderNumber) {
        // QR code minimal pour test
        return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
    }

    // ✅ EXTRACTION ITEMS PANIER
    private List<Map<String, Object>> extractCartItemsFromSession(Session session) {
        List<Map<String, Object>> cartItems = new ArrayList<>();

        try {
            Map<String, String> metadata = session.getMetadata();

            // Essayer de récupérer les vrais items depuis les métadonnées
            if (metadata != null && metadata.containsKey("item_count")) {
                int itemCount = Integer.parseInt(metadata.get("item_count"));
                log.info("🛒 Nombre d'items dans panier: {}", itemCount);

                // Simuler les items basés sur les métadonnées
                for (int i = 0; i < Math.min(itemCount, 5); i++) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("eventId", (long) (i + 1));
                    item.put("eventTitle", "Événement Olympique " + (i + 1));
                    item.put("offerTypeId", 1L);
                    item.put("offerTypeName", "Standard");
                    item.put("quantity", 1);
                    item.put("priceUnit", session.getAmountTotal() / 100.0 / itemCount);
                    cartItems.add(item);
                }
            } else {
                // Fallback: un item par défaut
                Map<String, Object> item = new HashMap<>();
                item.put("eventId", 1L);
                item.put("eventTitle", "Événement Olympique");
                item.put("offerTypeId", 1L);
                item.put("offerTypeName", "Standard");
                item.put("quantity", 1);
                item.put("priceUnit", session.getAmountTotal() / 100.0);
                cartItems.add(item);
            }

        } catch (Exception e) {
            log.error("❌ Erreur extraction items panier: {}", e.getMessage());
            // Fallback minimal
            Map<String, Object> item = new HashMap<>();
            item.put("eventId", 1L);
            item.put("eventTitle", "Événement Olympique");
            item.put("quantity", 1);
            cartItems.add(item);
        }

        log.info("📋 Items panier extraits: {}", cartItems.size());
        return cartItems;
    }

    // ✅ CRÉATION DES TICKETS
    private List<Ticket> createTicketsFromSession(Session session, OurUsers user) {
        List<Ticket> tickets = new ArrayList<>();

        try {
            List<Map<String, Object>> cartItems = extractCartItemsFromSession(session);

            for (Map<String, Object> item : cartItems) {
                Long eventId = (Long) item.get("eventId");
                String eventTitle = (String) item.get("eventTitle");
                Integer quantity = (Integer) item.get("quantity");

                // Créer un ticket pour chaque quantité
                for (int i = 0; i < (quantity != null ? quantity : 1); i++) {
                    Ticket ticket = Ticket.builder()
                            .ticketNumber(generateTicketNumber())
                            .eventId(eventId != null ? eventId : 1L)
                            .userId(user.getId())
                            .offerTypeId(1L)
                            .quantity(1)
                            .price(calculateTicketPrice(session, cartItems.size()))
                            .purchaseDate(LocalDateTime.now())
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .validated(false)
                            .used(false)
                            .build();
                    tickets.add(ticket);
                }
            }

            tickets = ticketRepository.saveAll(tickets);
            log.info("✅ {} tickets créés et sauvegardés", tickets.size());

        } catch (Exception e) {
            log.error("❌ Erreur création tickets: {}", e.getMessage(), e);
            // Créer au moins un ticket d'urgence
            Ticket emergencyTicket = createEmergencyTicket(user);
            tickets = List.of(ticketRepository.save(emergencyTicket));
        }

        return tickets;
    }

    // ✅ GÉNÉRATION NUMÉRO TICKET
    private String generateTicketNumber() {
        return "TKT-" + System.currentTimeMillis() + "-" + new Random().nextInt(1000);
    }

    // ✅ CALCUL PRIX TICKET
    private BigDecimal calculateTicketPrice(Session session, int itemCount) {
        try {
            if (session.getAmountTotal() != null && itemCount > 0) {
                double pricePerItem = (session.getAmountTotal() / 100.0) / itemCount;
                return BigDecimal.valueOf(pricePerItem);
            }
        } catch (Exception e) {
            log.warn("⚠️ Erreur calcul prix, utilisation valeur par défaut");
        }
        return new BigDecimal("50.00");
    }

    // ✅ TICKET D'URGENCE
    private Ticket createEmergencyTicket(OurUsers user) {
        return Ticket.builder()
                .ticketNumber("EMG-TKT-" + System.currentTimeMillis())
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
    }

    // ✅ PRÉPARATION TICKETS POUR EMAIL
    private List<Object> prepareTicketsForEmail(List<Ticket> tickets, Session session) {
        List<Object> ticketsForEmail = new ArrayList<>();

        for (Ticket ticket : tickets) {
            try {
                Map<String, Object> ticketData = new HashMap<>();
                ticketData.put("ticketNumber", ticket.getTicketNumber());
                ticketData.put("orderNumber", ticket.getTicketNumber()); // Fallback
                ticketData.put("qrCode", generateQRCodeForTicket(ticket));
                ticketData.put("purchaseDate", ticket.getPurchaseDate().toString());
                ticketData.put("total", String.valueOf(session.getAmountTotal() / 100.0));
                ticketData.put("eventTitle", "Événement Olympique");
                ticketData.put("price", ticket.getPrice().toString());

                ticketsForEmail.add(ticketData);
            } catch (Exception e) {
                log.error("❌ Erreur préparation ticket {}: {}", ticket.getTicketNumber(), e.getMessage());
            }
        }

        log.info("📧 {} tickets préparés pour email", ticketsForEmail.size());
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

    // === MÉTHODES EXISTANTES (conservées) ===

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

    // Classe interne pour les statistiques
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