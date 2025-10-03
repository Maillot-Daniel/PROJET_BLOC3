package com.olympics.tickets.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
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

    // Méthode pour obtenir le nom du type d'offre
    public String getOfferType() {
        return this.offerTypeName != null ? this.offerTypeName : "Standard";
    }

    public boolean isTotalPriceValid() {
        if (this.unitPrice == null || this.quantity <= 0) {
            return false;
        }
        BigDecimal calculatedTotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
        return calculatedTotal.compareTo(totalPrice) == 0;
    }
}