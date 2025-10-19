package com.olympics.tickets.backend.controller;

import com.olympics.tickets.backend.dto.EventSalesDTO;
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

    private final TicketService ticketService;

    /**
     * 📊 Ventes par événement (Admin seulement)
     */
    @GetMapping("/sales-by-event")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<EventSalesDTO>> getSalesByEvent() {
        List<EventSalesDTO> sales = ticketService.getSalesByEvent();
        return ResponseEntity.ok(sales);
    }

    /**
     * 📈 Tableau de bord admin
     */
    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = ticketService.getDashboardStats();
        return ResponseEntity.ok(stats);
    }

    /**
     * 📋 Statistiques détaillées
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getDetailedStatistics() {
        List<Object[]> salesByOffer = ticketService.countSalesGroupedByOffer();
        return ResponseEntity.ok(salesByOffer);
    }
}