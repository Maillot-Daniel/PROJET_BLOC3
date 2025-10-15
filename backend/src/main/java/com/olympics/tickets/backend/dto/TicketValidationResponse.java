package com.olympics.tickets.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketValidationResponse {

    private boolean success;       // Indique si la validation a réussi
    private String ticketNumber;   // Numéro du ticket
    private String primaryKey;     // Clé primaire du ticket
    private String qrCodeUrl;      // URL du QR code du ticket
}
