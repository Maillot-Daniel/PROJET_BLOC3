package com.olympics.tickets.backend.service;

import lombok.Data;

@Data
public class TicketStatistics {
    private long totalTickets;
    private long validatedTickets;
    private long usedTickets;
    private double totalRevenue;

    public TicketStatistics() {
        this.totalTickets = 0;
        this.validatedTickets = 0;
        this.usedTickets = 0;
        this.totalRevenue = 0.0;
    }

    public TicketStatistics(long totalTickets, long validatedTickets, long usedTickets, double totalRevenue) {
        this.totalTickets = totalTickets;
        this.validatedTickets = validatedTickets;
        this.usedTickets = usedTickets;
        this.totalRevenue = totalRevenue;
    }
}