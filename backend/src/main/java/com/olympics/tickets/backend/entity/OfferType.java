package com.olympics.tickets.backend.entity;

import jakarta.persistence.*;
import java.util.Objects;
import org.hibernate.Hibernate;

@Entity
@Table(name = "offer_types",
        uniqueConstraints = @UniqueConstraint(name = "uk_offer_type_name", columnNames = "name"))
public class OfferType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // ← AJOUT IMPORTANT
    @Column(nullable = false)
    private Integer id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false)
    private Integer people;

    @Column(nullable = false)
    private Double multiplier;

    // Constructeurs
    public OfferType() {
    }

    // Constructeur sans ID pour les nouvelles créations
    public OfferType(String name, Integer people, Double multiplier) {
        this.name = name;
        this.people = people;
        this.multiplier = multiplier;
    }

    public OfferType(Integer id, String name, Integer people, Double multiplier) {
        this.id = id;
        this.name = name;
        this.people = people;
        this.multiplier = multiplier;
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

    public Integer getPeople() {
        return people;
    }

    public void setPeople(Integer people) {
        this.people = people;
    }

    public Double getMultiplier() {
        return multiplier;
    }

    public void setMultiplier(Double multiplier) {
        this.multiplier = multiplier;
    }

    // Factory methods
    public static OfferType of(Integer id, String name, Integer people, Double multiplier) {
        return new OfferType(id, name, people, multiplier);
    }

    public static OfferType of(String name, Integer people, Double multiplier) {
        return new OfferType(name, people, multiplier);
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
                ", people=" + people +
                ", multiplier=" + multiplier +
                '}';
    }
}