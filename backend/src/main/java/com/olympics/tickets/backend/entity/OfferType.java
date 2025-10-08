package com.olympics.tickets.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "offer_types")
public class OfferType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private Double price;

    // Constructeurs
    public OfferType() {}

    public OfferType(String name, Double price) {
        this.name = name;
        this.price = price;
    }

    // Getters et Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
}
