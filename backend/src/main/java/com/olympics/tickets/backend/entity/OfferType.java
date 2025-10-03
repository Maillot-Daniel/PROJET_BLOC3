package com.olympics.tickets.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.Hibernate;

import java.util.Objects;

@Entity
@Table(name = "offer_types",
        uniqueConstraints = @UniqueConstraint(name = "uk_offer_type_name", columnNames = "name"))
@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OfferType {

    @Id
    @Column(nullable = false)
    private Integer id;  // 1=SOLO, 2=DUO, 3=FAMILLE

    @Column(nullable = false, length = 50)
    private String name;

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
}