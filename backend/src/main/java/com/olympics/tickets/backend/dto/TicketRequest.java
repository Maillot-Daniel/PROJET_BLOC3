package com.olympics.tickets.backend.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TicketRequest {
    @NotNull
    private Long userId;

    @NotNull
    private Long eventId;

    @NotNull
    @Min(1) @Max(3) // Selon vos IDs d'offerType
    private Integer offerTypeId;

    @NotNull
    @Min(1)
    private Integer quantity;

    @NotNull
    @DecimalMin("0.01")
    private BigDecimal price;
}