package com.olympics.tickets.backend.controller;

import com.olympics.tickets.backend.dto.TicketValidationRequest;
import com.olympics.tickets.backend.dto.TicketValidationResponse;
import com.olympics.tickets.backend.dto.DailySalesResponse;
import com.olympics.tickets.backend.service.SecureTicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/secure-tickets")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SecureTicketController {

    private final SecureTicketService secureTicketService;

    @PostMapping("/validate")
    public ResponseEntity<TicketValidationResponse> validateTicket(
            @RequestBody Map<String, String> request) {

        String qrData = request.get("qrData");
        if (qrData == null || qrData.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(
                    new TicketValidationResponse(false, "Données QR manquantes")
            );
        }

        TicketValidationResponse response = secureTicketService.validateSecureTicket(qrData);

        if (response.isValid()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/validate-manual")
    public ResponseEntity<TicketValidationResponse> validateTicketManual(
            @RequestBody Map<String, String> request) {

        String primaryKey = request.get("primaryKey");
        String secondaryKey = request.get("secondaryKey");
        String signature = request.get("signature");

        if (primaryKey == null || secondaryKey == null || signature == null) {
            return ResponseEntity.badRequest().body(
                    new TicketValidationResponse(false, "Tous les champs doivent être remplis")
            );
        }

        TicketValidationResponse response = secureTicketService.validateSecureTicketManual(
                primaryKey, secondaryKey, signature
        );

        if (response.isValid()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/admin/daily-sales")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DailySalesResponse> getDailySales() {
        DailySalesResponse response = secureTicketService.getDailySales();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/check-status/{primaryKey}")
    public ResponseEntity<TicketValidationResponse> checkTicketStatus(
            @PathVariable String primaryKey) {
        TicketValidationResponse response = secureTicketService.checkTicketStatus(primaryKey);
        return ResponseEntity.ok(response);
    }
}