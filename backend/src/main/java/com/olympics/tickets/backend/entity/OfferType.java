package com.olympics.tickets.backend.entity;

import jakarta.persistence.*;
import org.hibernate.Hibernate;

import java.util.Objects;

@Entity
@Table(name = "offer_types",
        uniqueConstraints = @UniqueConstraint(name = "uk_offer_type_name", columnNames = "name"))
public class OfferType {

    @Id
    @Column(nullable = false)
    private Integer id;

    @Column(nullable = false, length = 50)
    private String name;

    // Constructeur par défaut (requis par JPA)
    public OfferType() {
    }

    // Constructeur avec paramètres
    public OfferType(Integer id, String name) {
        this.id = id;
        this.name = name;
    }

    // Getters et Setters
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    // Factory method
    public static OfferType of(Integer id, String name) {
        return new OfferType(id, name);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || Hibernate.getClass(this) != Hibernate.getClass(o)) return false;
        OfferType offerType = (OfferType) o;
        return id != null && Objects.equals(id, offerType.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "OfferType{" +
                "id=" + id +
                ", name='" + name + '\'' +
                '}';
    }
}