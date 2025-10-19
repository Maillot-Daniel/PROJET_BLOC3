package com.olympics.tickets.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private OurUsers user;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    @Column(name = "total_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalPrice;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    @Builder.Default
    private String status = "PENDING";

    // ✅ CHAMPS AJOUTÉS
    @Column(name = "order_number", unique = true)
    private String orderNumber;

    @Column(name = "stripe_session_id")
    private String stripeSessionId;

    @Column(name = "customer_email")
    private String customerEmail;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (orderNumber == null) {
            orderNumber = "CMD-" + System.currentTimeMillis() + "-" +
                    (int)(Math.random() * 1000);
        }
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void markAsPaid(String stripeSessionId) {
        this.status = "PAID";
        this.stripeSessionId = stripeSessionId;
        this.updatedAt = LocalDateTime.now();
    }
}