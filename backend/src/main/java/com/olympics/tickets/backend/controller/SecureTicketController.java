package com.olympics.tickets.backend.controller;

import com.olympics.tickets.backend.dto.DailySalesResponse;
import com.olympics.tickets.backend.dto.SecureTicketResponse;
import com.olympics.tickets.backend.dto.TicketValidationResponse;
import com.olympics.tickets.backend.dto.OfferSalesDTO;
import com.olympics.tickets.backend.entity.Ticket;
import com.olympics.tickets.backend.service.SecureTicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/secure-tickets")
@RequiredArgsConstructor
public class SecureTicketController {

    private final SecureTicketService secureTicketService;

    /**
     * Valide un ticket automatiquement
     */
    @PostMapping("/validate")
    public ResponseEntity<TicketValidationResponse> validateTicket(@RequestParam String validationData) {
        Ticket ticket = secureTicketService.validateTicket(validationData);

        TicketValidationResponse response = new TicketValidationResponse(
                true,
                ticket.getTicketNumber(),
                ticket.getPrimaryKey(),
                ticket.getSecondaryKey()
        );

        return ResponseEntity.ok(response);
    }

    /**
     * Valide un ticket manuellement (ex: admin)
     */
    @PostMapping("/validate/manual")
    public ResponseEntity<TicketValidationResponse> validateTicketManual(
            @RequestParam String ticketNumber,
            @RequestParam String primaryKey,
            @RequestParam String signature) {

        Ticket ticket = secureTicketService.validateSecureTicketManual(primaryKey, signature, signature);

        TicketValidationResponse response = new TicketValidationResponse(
                true,
                ticket.getTicketNumber(),
                ticket.getPrimaryKey(),
                ticket.getSecondaryKey()
        );

        return ResponseEntity.ok(response);
    }

    /**
     * Récupère les ventes journalières
     */
    @GetMapping("/daily-sales")
    public ResponseEntity<DailySalesResponse> getDailySales() {
        BigDecimal dailySales = secureTicketService.getDailySales();
        DailySalesResponse response = new DailySalesResponse(dailySales);
        return ResponseEntity.ok(response);
    }

    /**
     * Vérifie le statut d’un ticket
     */
    @GetMapping("/status")
    public ResponseEntity<TicketValidationResponse> checkTicketStatus(@RequestParam String primaryKey) {
        Ticket ticket = secureTicketService.getTicketByPrimaryKey(primaryKey);
        String status = ticket.getUsed() ? "USED" : !ticket.getValidated() ? "INVALID" : "VALID";

        TicketValidationResponse response = new TicketValidationResponse(
                "VALID".equals(status),
                ticket.getTicketNumber(),
                ticket.getPrimaryKey(),
                ticket.getSecondaryKey()
        );

        return ResponseEntity.ok(response);
    }

    /**
     * Liste les tickets sécurisés d’un utilisateur
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<SecureTicketResponse>> getUserTickets(@PathVariable Long userId) {
        List<Ticket> tickets = secureTicketService.getUserTickets(userId);

        List<SecureTicketResponse> response = tickets.stream().map(ticket -> new SecureTicketResponse(
                ticket.getTicketNumber(),
                ticket.getQrCodeUrl(),
                ticket.getPrimaryKey(),
                ticket.getEvent().getTitle(),
                ticket.getPurchaseDate()
        )).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    /**
     * ✅ Endpoint ADMIN : récupère les ventes par offre
     */
    @GetMapping("/admin/sales-by-offer")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<OfferSalesDTO>> getSalesByOffer() {
        List<Object[]> rows = secureTicketService.countSalesGroupedByOffer();
        List<OfferSalesDTO> response = rows.stream()
                .map(r -> new OfferSalesDTO(
                        ((Number) r[0]).longValue(),
                        ((Number) r[1]).longValue()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }
}
