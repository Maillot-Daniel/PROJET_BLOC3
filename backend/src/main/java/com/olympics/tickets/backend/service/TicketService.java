package com.olympics.tickets.backend.service;

import com.olympics.tickets.backend.entity.*;
import com.olympics.tickets.backend.repository.EventRepository;
import com.olympics.tickets.backend.repository.TicketRepository;
import com.olympics.tickets.backend.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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
    public Ticket createTicket(Long userId, Long eventId, Integer quantity, OfferType offerType, BigDecimal price) {
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

    @Transactional
    public void processSuccessfulPayment(Long cartId) throws Exception {
        // Implémentation spécifique à ton projet
    }

    @Transactional
    public void processSuccessfulPayment(com.stripe.model.checkout.Session session) throws Exception {
        // Implémentation spécifique à ton projet
    }
}
