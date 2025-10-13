package com.olympics.tickets.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketValidationResponse {
    private boolean valid;
    private String message;
    private String ticketNumber;
    private String eventTitle;

    // Constructeur pour les réponses simples
    public TicketValidationResponse(boolean valid, String message) {
        this.valid = valid;
        this.message = message;
    }
}