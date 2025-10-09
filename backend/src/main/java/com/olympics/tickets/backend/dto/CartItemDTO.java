package com.olympics.tickets.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class CartItemDTO {
    private Long id;

    @NotNull
    private Long eventId;

    private String eventTitle;

    private Integer offerTypeId;

    private String offerTypeName;

    @Min(1)
    private Integer quantity;

    private BigDecimal unitPrice;

    private BigDecimal totalPrice;

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getEventId() {
        return eventId;
    }

    public void setEventId(Long eventId) {
        this.eventId = eventId;
    }

    public String getEventTitle() {
        return eventTitle;
    }

    public void setEventTitle(String eventTitle) {
        this.eventTitle = eventTitle;
    }

    public Integer getOfferTypeId() {
        return offerTypeId;
    }

    public void setOfferTypeId(Integer offerTypeId) {
        this.offerTypeId = offerTypeId;
    }

    public String getOfferTypeName() {
        return offerTypeName;
    }

    public void setOfferTypeName(String offerTypeName) {
        this.offerTypeName = offerTypeName;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public BigDecimal getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(BigDecimal totalPrice) {
        this.totalPrice = totalPrice;
    }

    // Méthode pour obtenir le nom du type d'offre
    public String getOfferType() {
        return this.offerTypeName != null ? this.offerTypeName : "Standard";
    }

    public boolean isTotalPriceValid() {
        if (this.unitPrice == null || this.quantity == null || this.quantity <= 0) {
            return false;
        }
        BigDecimal calculatedTotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
        return calculatedTotal.compareTo(totalPrice) == 0;
    }
}