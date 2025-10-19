package com.olympics.tickets.backend.dto;

import lombok.Data;

@Data
public class EventSalesDTO {
    private Long eventId;
    private String eventTitle;
    private String eventType;
    private Long ticketsSold;
    private Double totalRevenue;
    private Double averageTicketPrice;

    public EventSalesDTO(Long eventId, String eventTitle, String eventType,
                         Long ticketsSold, Double totalRevenue) {
        this.eventId = eventId;
        this.eventTitle = eventTitle;
        this.eventType = eventType;
        this.ticketsSold = ticketsSold;
        this.totalRevenue = totalRevenue;
        this.averageTicketPrice = ticketsSold > 0 ? totalRevenue / ticketsSold : 0.0;
    }

    public EventSalesDTO(Long eventId, String eventTitle, String eventType,
                         Long ticketsSold, Double totalRevenue, Double averageTicketPrice) {
        this.eventId = eventId;
        this.eventTitle = eventTitle;
        this.eventType = eventType;
        this.ticketsSold = ticketsSold;
        this.totalRevenue = totalRevenue;
        this.averageTicketPrice = averageTicketPrice;
    }
}