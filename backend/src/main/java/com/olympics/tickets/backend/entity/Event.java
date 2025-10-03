package com.olympics.tickets.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.Where;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "events",
        indexes = {
                @Index(name = "idx_event_date", columnList = "date"),
                @Index(name = "idx_event_location", columnList = "location"),
                @Index(name = "idx_event_price", columnList = "price"),
                @Index(name = "idx_event_remaining_tickets", columnList = "remainingTickets")
        })
@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Where(clause = "deleted = false")
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, length = 1000)
    private String description;

    @Column(nullable = false)
    private LocalDateTime date;

    @Column(nullable = false, length = 100)
    private String location;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "total_tickets", nullable = false)
    private Integer totalTickets;

    @Column(name = "remaining_tickets", nullable = false)
    private Integer remainingTickets;

    @Column(name = "image_url", length = 255)
    private String imageUrl;

    @Column(name = "category", length = 50)
    private String category;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted", nullable = false)
    @Builder.Default
    private Boolean deleted = false;

    @Version
    private Long version;

    // Méthodes utilitaires
    public boolean isSoldOut() {
        return remainingTickets <= 0;
    }

    public boolean isAvailable() {
        return !isSoldOut() && date.isAfter(LocalDateTime.now());
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Event event = (Event) o;
        return Objects.equals(id, event.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    // Méthode pour réserver des tickets
    public void reserveTickets(int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be positive");
        }
        if (remainingTickets < quantity) {
            throw new IllegalStateException("Not enough tickets available");
        }
        remainingTickets -= quantity;
    }

    // Méthode pour annuler une réservation
    public void cancelReservation(int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be positive");
        }
        if (remainingTickets + quantity > totalTickets) {
            throw new IllegalStateException("Cannot cancel more tickets than originally reserved");
        }
        remainingTickets += quantity;
    }
}