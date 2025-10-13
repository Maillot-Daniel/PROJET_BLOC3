package com.olympics.tickets.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SecureTicketResponse {
    private String ticketNumber;
    private String qrCodeUrl;
    private String primaryKey;
    private String eventTitle;
    private LocalDateTime purchaseDate;
}