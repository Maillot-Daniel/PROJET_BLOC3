package com.olympics.tickets.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;

@Entity
@Table(name = "cart_item") // Spécifie explicitement le nom de la table
@Data
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "cart_id") // Correspond à la colonne en base
    private Cart cart;

    @ManyToOne
    @JoinColumn(name = "event_id") // Correspond à la colonne en base
    private Event event;

    @ManyToOne
    @JoinColumn(name = "user_id") // Correspond à la colonne en base
    private OurUsers user;

    @ManyToOne
    @JoinColumn(name = "offer_type", referencedColumnName = "id") // Relation avec offer_types
    private OfferType offerType; // Changé de String à OfferType

    private int quantity;

    @Column(name = "unit_price", precision = 19, scale = 4) // Nom exact de la colonne
    private BigDecimal unitPrice;

    // Champ calculé (optionnel - si vous voulez le gérer en Java plutôt qu'en base)
    @Transient // Indique que ce champ n'est pas persisté
    public BigDecimal getTotalPrice() {
        return unitPrice.multiply(BigDecimal.valueOf(quantity));
    }
}