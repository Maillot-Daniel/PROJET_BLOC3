package com.olympics.tickets.backend.service;

import com.olympics.tickets.backend.entity.*;
import com.olympics.tickets.backend.repository.EventRepository;
import com.olympics.tickets.backend.repository.TicketRepository;
import com.olympics.tickets.backend.repository.UsersRepository;
import com.stripe.model.checkout.Session;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final EventRepository eventRepository;
    private final UsersRepository usersRepository;
    private final EmailService emailService;
    private final PdfGenerator pdfGenerator;

    @Transactional
    public Ticket createTicket(Long userId, Long eventId, Integer quantity, OfferType offerType, java.math.BigDecimal price) {
        OurUsers user = usersRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable : " + userId));
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Événement introuvable : " + eventId));

        if (event.getRemainingTickets() < quantity) {
            throw new IllegalStateException("Stock insuffisant pour l'événement : " + eventId);
        }

        event.setRemainingTickets(event.getRemainingTickets() - quantity);
        eventRepository.save(event);

        Ticket ticket = Ticket.builder()
                .ticketNumber(UUID.randomUUID().toString())
                .event(event)
                .user(user)
                .quantity(quantity)
                .offerType(offerType)
                .purchaseDate(LocalDateTime.now())
                .validated(false)
                .price(price)
                .build();

        return ticketRepository.save(ticket);
    }

    public List<Ticket> getUserTickets(Long userId) {
        OurUsers user = usersRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable : " + userId));
        return ticketRepository.findByUser(user);
    }

    // Méthode Stripe webhook
    @Transactional
    public void processSuccessfulPayment(Session session) throws Exception {
        String customerEmail = session.getCustomerEmail();
        String sessionId = session.getId();

        // TODO: Récupérer les infos du panier liées au sessionId ou stockées en base
        List<CartItem> cartItems = getCartItemsFromSessionId(sessionId);

        for (CartItem item : cartItems) {
            Event event = item.getEvent();
            OurUsers user = usersRepository.findByEmail(customerEmail)
                    .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));

            if (event.getRemainingTickets() < item.getQuantity()) {
                throw new IllegalStateException("Stock insuffisant pour l'événement : " + event.getTitle());
            }

            event.setRemainingTickets(event.getRemainingTickets() - item.getQuantity());
            eventRepository.save(event);

            Ticket ticket = Ticket.builder()
                    .ticketNumber(UUID.randomUUID().toString())
                    .event(event)
                    .user(user)
                    .quantity(item.getQuantity())
                    .offerType(item.getOfferType())
                    .purchaseDate(LocalDateTime.now())
                    .validated(true)
                    .price(item.getUnitPrice())
                    .build();

            ticketRepository.save(ticket);

            byte[] pdfBytes = pdfGenerator.generateTicketPdf(ticket, event, user);
            emailService.sendEmailWithAttachment(customerEmail,
                    "Vos billets - " + event.getTitle(),
                    "Merci pour votre achat ! Vos billets sont en pièce jointe.",
                    pdfBytes,
                    "billets_" + ticket.getTicketNumber() + ".pdf");
        }
    }

    // Méthode fictive pour récupérer le panier depuis sessionId (à implémenter)
    private List<CartItem> getCartItemsFromSessionId(String sessionId) {
        // TODO: remplacer par récupération réelle depuis base ou cache
        return List.of();
    }
}
