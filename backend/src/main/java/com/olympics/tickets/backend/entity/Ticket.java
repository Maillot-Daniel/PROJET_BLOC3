package com.olympics.tickets.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ticket")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class Ticket {



    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_number", nullable = false, unique = true)
    private String ticketNumber; // UUID

    @Column(name = "qr_code_url", nullable = false)
    private String qrCodeUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private OurUsers user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "offer_type_id", referencedColumnName = "id", nullable = false)
    private OfferType offerType;

    @Column(name = "purchase_date", nullable = false)
    private LocalDateTime purchaseDate;

    @Column(name = "validated", nullable = false)
    private boolean validated = false;

    @Column(nullable = false)
    private Integer quantity;

    @Column(precision = 38, scale = 2, nullable = false)
    private BigDecimal price;

    // Méthode factory pour créer un nouveau ticket
    public static Ticket createNewTicket(Event event, OurUsers user, OfferType offerType,
                                         Integer quantity, BigDecimal basePrice) {
        return Ticket.builder()
                .ticketNumber(UUID.randomUUID().toString())
                .qrCodeUrl(generateQrCodeUrl())
                .event(event)
                .user(user)
                .offerType(offerType)
                .purchaseDate(LocalDateTime.now())
                .validated(false)
                .quantity(quantity)
                .price(calculateFinalPrice(basePrice, offerType.getName(), quantity))
                .build();
    }

    private static String generateQrCodeUrl() {
        return "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + UUID.randomUUID();
    }

    private static BigDecimal calculateFinalPrice(BigDecimal basePrice, String offerType, Integer quantity) {
        BigDecimal priceMultiplier = switch (offerType.toUpperCase()) {
            case "DUO" -> BigDecimal.valueOf(1.8);
            case "FAMILLE" -> BigDecimal.valueOf(3.2);
            default -> BigDecimal.ONE;
        };
        return basePrice.multiply(priceMultiplier)
                .multiply(BigDecimal.valueOf(quantity));
    }
}