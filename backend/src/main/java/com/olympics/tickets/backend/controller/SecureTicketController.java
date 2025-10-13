package com.olympics.tickets.backend.controller;

import com.olympics.tickets.backend.dto.TicketValidationRequest;
import com.olympics.tickets.backend.dto.TicketValidationResponse;
import com.olympics.tickets.backend.dto.DailySalesResponse;
import com.olympics.tickets.backend.service.SecureTicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/secure-tickets")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SecureTicketController {

    private final SecureTicketService secureTicketService;

    @PostMapping("/validate")
    public ResponseEntity<TicketValidationResponse> validateTicket(
            @RequestBody TicketValidationRequest request) {

        boolean isValid = secureTicketService.validateSecureTicket(
                request.getPrimaryKey(),
                request.getSecondaryKey(),
                request.getSignature()
        );

        if (isValid) {
            return ResponseEntity.ok(new TicketValidationResponse(
                    true, "Ticket validé avec succès"
            ));
        } else {
            return ResponseEntity.badRequest().body(new TicketValidationResponse(
                    false, "Ticket invalide ou déjà utilisé"
            ));
        }
    }

    @GetMapping("/admin/daily-sales")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DailySalesResponse> getDailySales() {
        // Pour l'instant, retournez des données factices
        // Vous implémenterez la vraie logique après
        DailySalesResponse response = new DailySalesResponse(0L, 0.0);
        return ResponseEntity.ok(response);
    }
}