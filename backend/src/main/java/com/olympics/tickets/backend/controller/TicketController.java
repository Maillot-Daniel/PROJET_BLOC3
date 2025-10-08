package com.olympics.tickets.backend.controller;

import com.olympics.tickets.backend.entity.OfferType;
import com.olympics.tickets.backend.entity.Ticket;
import com.olympics.tickets.backend.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @PostMapping("/create")
    public Ticket createTicket(@RequestParam Long userId,
                               @RequestParam Long eventId,
                               @RequestParam Integer quantity,
                               @RequestParam OfferType offerType,
                               @RequestParam BigDecimal price) {
        return ticketService.createTicket(userId, eventId, quantity, offerType, price);
    }

    @GetMapping("/user/{userId}")
    public List<Ticket> getUserTickets(@PathVariable Long userId) {
        return ticketService.getUserTickets(userId);
    }
}
