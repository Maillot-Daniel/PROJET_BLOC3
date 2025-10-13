package com.olympics.tickets.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DailySalesResponse {
    private Long ticketsUsed;
    private Double totalSales;
}