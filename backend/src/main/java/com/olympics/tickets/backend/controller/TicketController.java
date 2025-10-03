package com.olympics.tickets.backend.controller;

import com.olympics.tickets.backend.entity.Ticket;
import com.olympics.tickets.backend.service.TicketService;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @PostMapping
    public Ticket createTicket(
            @RequestParam Long userId,
            @RequestParam Long eventId,
            @RequestParam Integer offerTypeId,  // Changé de String à Integer
            @RequestParam Integer quantity,
            @RequestParam BigDecimal price) {
        return ticketService.createTicket(userId, eventId, offerTypeId, quantity, price);
    }

    @GetMapping("/user/{userId}")
    public List<Ticket> getUserTickets(@PathVariable Long userId) {
        return ticketService.getUserTickets(userId);
    }
}