package com.olympics.tickets.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class TicketDTO {
    private Long id;
    private String ticketNumber;
    private String qrCodeUrl;
    private Long eventId;
    private String eventTitle;
    private Long userId;
    private Long offerTypeId;
    private LocalDateTime purchaseDate;
    private Boolean validated;
    private Boolean used;
    private Integer quantity;
    private BigDecimal price;
}
