package com.olympics.tickets.backend.service;

import com.olympics.tickets.backend.entity.*;
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
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
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

    // ✅ CORRECTION CRITIQUE : Méthode processSuccessfulPayment
    @Transactional
    public void processSuccessfulPayment(Session session) {
        System.out.println("🎫🔴🔴🔴 DÉBUT processSuccessfulPayment 🔴🔴🔴");
        System.out.println("💰 Session ID: " + session.getId());
        System.out.println("📧 Customer Email: " + session.getCustomerEmail());
        System.out.println("💶 Amount Total: " + session.getAmountTotal());
        System.out.println("💳 Currency: " + session.getCurrency());

        try {
            // ✅ CRÉATION D'UN TICKET SIMPLE POUR TEST
            createSimpleDebugTicket(session);

            System.out.println("🎫🟢🟢🟢 processSuccessfulPayment TERMINÉ AVEC SUCCÈS 🟢🟢🟢");

        } catch (Exception e) {
            System.out.println("🎫🔴🔴🔴 ERREUR DANS processSuccessfulPayment: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Échec du traitement du paiement: " + e.getMessage(), e);
        }
    }

    // ✅ NOUVELLE MÉTHODE : Création ticket debug simple
    private void createSimpleDebugTicket(Session session) {
        System.out.println("🎫 Création ticket debug...");

        try {
            // 1. COMPTER LES TICKETS AVANT
            long countBefore = ticketRepository.count();
            System.out.println("📊 Nombre de tickets en base AVANT: " + countBefore);

            // 2. CRÉER UN TICKET BASIQUE
            Ticket ticket = new Ticket();
            ticket.setTicketNumber("DEBUG-" + System.currentTimeMillis());
            ticket.setPurchaseDate(LocalDateTime.now());
            ticket.setQuantity(1);
            ticket.setPrice(BigDecimal.valueOf(session.getAmountTotal() / 100.0));
            ticket.setValidated(true);
            ticket.setUsed(false);

            System.out.println("🎫 Ticket créé en mémoire: " + ticket.getTicketNumber());
            System.out.println("💰 Prix: " + ticket.getPrice());
            System.out.println("📅 Date: " + ticket.getPurchaseDate());

            // 3. SAUVEGARDER
            Ticket savedTicket = ticketRepository.save(ticket);
            System.out.println("💾 Ticket sauvegardé avec ID: " + savedTicket.getId());

            // 4. COMPTER LES TICKETS APRÈS
            long countAfter = ticketRepository.count();
            System.out.println("📊 Nombre de tickets en base APRÈS: " + countAfter);
            System.out.println("✅ Tickets ajoutés: " + (countAfter - countBefore));

            // 5. VÉRIFIER QUE LE TICKET EXISTE
            Optional<Ticket> verifiedTicket = ticketRepository.findById(savedTicket.getId());
            if (verifiedTicket.isPresent()) {
                System.out.println("🎫✅ TICKET CONFIRMÉ EN BASE: " + verifiedTicket.get().getTicketNumber());
            } else {
                System.out.println("🎫❌ TICKET NON RETROUVÉ EN BASE!");
            }

        } catch (Exception e) {
            System.out.println("🎫❌ ERREUR création ticket debug: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    // ✅ MÉTHODE TEMPORAIRE : Récupérer les items du panier
    private List<CartItem> getCartItemsFromSessionId(String sessionId) {
        System.out.println("⚠️ Méthode getCartItemsFromSessionId non implémentée");
        return List.of();
    }
}