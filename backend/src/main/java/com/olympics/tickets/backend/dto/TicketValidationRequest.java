package com.olympics.tickets.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketValidationRequest {
    private String qrData; // Pour la validation QR
    private String primaryKey; // Pour la validation manuelle
    private String secondaryKey; // Pour la validation manuelle
    private String signature; // Pour la validation manuelle
}