package com.olympics.tickets.backend.controller;

import com.olympics.tickets.backend.dto.EventSalesDTO;
import com.olympics.tickets.backend.entity.Order;
import com.olympics.tickets.backend.service.OrderService;
import com.olympics.tickets.backend.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminAnalyticsController {

    private final OrderService orderService;
    private final TicketService ticketService;

    @GetMapping("/sales-by-offer")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<EventSalesDTO>> getSalesByOffer() {
        List<EventSalesDTO> sales = orderService.getSalesByOfferType();
        return ResponseEntity.ok(sales);
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = ticketService.getDashboardStats();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/orders")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Order>> getAllOrders() {
        List<Order> orders = orderService.getRecentOrders(50);
        return ResponseEntity.ok(orders);
    }
}