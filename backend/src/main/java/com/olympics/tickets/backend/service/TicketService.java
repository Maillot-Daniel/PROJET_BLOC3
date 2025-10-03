package com.olympics.tickets.backend.service;

import com.olympics.tickets.backend.entity.*;
import com.olympics.tickets.backend.exception.NotFoundException;
import com.olympics.tickets.backend.repository.*;
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
    private final OfferTypeRepository offerTypeRepository;
    private final EventRepository eventRepository;
    private final UsersRepo ourUsersRepository;

    @Transactional
    public Ticket createTicket(Long userId, Long eventId,
                               Integer offerTypeId, Integer quantity,
                               BigDecimal price) {
        // Validation des entités existantes
        OurUsers user = ourUsersRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Utilisateur non trouvé"));

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new NotFoundException("Événement non trouvé"));

        OfferType offerType = offerTypeRepository.findById(offerTypeId)
                .orElseThrow(() -> new NotFoundException("Type d'offre invalide"));

        // Création du ticket
        Ticket ticket = Ticket.builder()
                .user(user)
                .event(event)
                .offerType(offerType)
                .quantity(quantity)
                .price(calculateFinalPrice(price, offerType.getName(), quantity))
                .ticketNumber(UUID.randomUUID().toString())
                .qrCodeUrl(generateQrCodeUrl())
                .purchaseDate(LocalDateTime.now())
                .validated(false)
                .build();

        return ticketRepository.save(ticket);
    }

    public List<Ticket> getUserTickets(Long userId) {
        return ticketRepository.findByUserId(userId);
    }

    public BigDecimal getUserTotalSpending(Long userId) {
        return ticketRepository.findByUserId(userId)
                .stream()
                .map(t -> t.getPrice().multiply(BigDecimal.valueOf(t.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private String generateQrCodeUrl() {
        return "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + UUID.randomUUID();
    }

    private BigDecimal calculateFinalPrice(BigDecimal basePrice, String offerType, Integer quantity) {
        BigDecimal multipliedPrice = switch (offerType.toUpperCase()) {
            case "DUO" -> basePrice.multiply(BigDecimal.valueOf(1.8));
            case "FAMILLE" -> basePrice.multiply(BigDecimal.valueOf(3.2));
            default -> basePrice;
        };
        return multipliedPrice.multiply(BigDecimal.valueOf(quantity));
    }
}