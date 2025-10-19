package com.olympics.tickets.backend.controller;

import com.olympics.tickets.backend.entity.Ticket;
import com.olympics.tickets.backend.service.TicketService;
import com.olympics.tickets.backend.service.TicketStatistics; // ✅ IMPORT CORRECT
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    // ---------------- Création / debug ----------------

    @PostMapping("/debug")
    public ResponseEntity<Ticket> createDebugTicket(@RequestParam String sessionId) {
        com.stripe.model.checkout.Session session = new com.stripe.model.checkout.Session();
        session.setId(sessionId);
        Ticket ticket = ticketService.createDebugTicket(session);
        return ResponseEntity.ok(ticket);
    }

    // ---------------- Récupération des tickets ----------------

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Ticket>> getUserTickets(@PathVariable Long userId) {
        List<Ticket> tickets = ticketService.getUserTickets(userId);
        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/user/{userId}/active")
    public ResponseEntity<List<Ticket>> getUserActiveTickets(@PathVariable Long userId) {
        List<Ticket> tickets = ticketService.getUserActiveTickets(userId);
        return ResponseEntity.ok(tickets);
    }

    // ---------------- Validation du ticket ----------------

    @PostMapping("/validate")
    public ResponseEntity<Ticket> validateTicket(@RequestParam String validationData) {
        Ticket validatedTicket = ticketService.validateTicket(validationData);
        return ResponseEntity.ok(validatedTicket);
    }

    // ---------------- Annulation / remboursement ----------------

    @PostMapping("/cancel")
    public ResponseEntity<Boolean> cancelTicket(@RequestParam Long ticketId, @RequestParam Long userId) {
        boolean result = ticketService.cancelTicket(ticketId, userId);
        return ResponseEntity.ok(result);
    }

    // ---------------- Statistiques (CORRIGÉ) ----------------

    @GetMapping("/stats")
    public ResponseEntity<TicketStatistics> getStatistics() {
        TicketStatistics stats = ticketService.getTicketStatistics();
        return ResponseEntity.ok(stats);
    }

    // ---------------- Nettoyage des tickets expirés ----------------

    @DeleteMapping("/cleanup")
    public ResponseEntity<Integer> cleanupExpiredTickets() {
        int cleaned = ticketService.cleanupExpiredTickets();
        return ResponseEntity.ok(cleaned);
    }
}