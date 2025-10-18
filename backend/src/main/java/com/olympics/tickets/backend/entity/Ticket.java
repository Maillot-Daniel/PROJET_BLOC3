package com.olympics.tickets.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Entity
@Table(name = "ticket")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_number", nullable = false, unique = true, length = 50)
    private String ticketNumber;

    @Column(name = "qr_code_url", length = 2048)
    private String qrCodeUrl;

    @Column(name = "event_id", nullable = false)
    private Long eventId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "offer_type_id", nullable = false)
    private Long offerTypeId;

    @Column(name = "purchase_date", nullable = false)
    private LocalDateTime purchaseDate;

    @Column(nullable = false)
    @Builder.Default
    private Boolean validated = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean used = false;

    @Column(nullable = false)
    @Builder.Default
    private Integer quantity = 1;

    @Column(name = "price", precision = 10, scale = 2, nullable = false)
    private BigDecimal price;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // --- Clés de sécurité (avant et après achat) ---
    @Column(name = "primary_key", length = 512)
    private String primaryKey;

    @Column(name = "secondary_key", length = 512)
    private String secondaryKey;

    @Column(name = "hashed_key", length = 1024)
    private String hashedKey;

    @Column(name = "signature", length = 512)
    private String signature;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    // --- Relations ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", insertable = false, updatable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private OurUsers user;

    // ---------------- Méthodes utilitaires ----------------

    /**
     * Génère une URL sécurisée ou DataURL QR contenant la clef concaténée
     * entre primaryKey et secondaryKey.
     */
    public String generateSecureQrCodeUrl() {
        if (this.primaryKey != null && this.secondaryKey != null) {
            String finalKey = this.primaryKey + this.secondaryKey; // concaténation simple
            try {
                String encoded = URLEncoder.encode(finalKey, StandardCharsets.UTF_8);
                this.qrCodeUrl = "https://yourdomain.com/api/tickets/validate?data=" + encoded;
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        return this.qrCodeUrl;
    }

    public boolean checkSignature(String sig) {
        return this.signature != null && this.signature.equals(sig);
    }

    public boolean checkIntegrity(String hash) {
        return this.hashedKey != null && this.hashedKey.equals(hash);
    }

    public Event getEvent() {
        return this.event;
    }

    public OurUsers getUser() {
        return this.user;
    }

    public String getEventTitle() {
        return event != null ? event.getTitle() : null;
    }

    public Double getPriceDouble() {
        return price != null ? price.doubleValue() : 0.0;
    }

    // ---------------- Méthodes manquantes pour TicketService ----------------

    public boolean isValidForValidation() {
        // Un ticket est valide si non utilisé et validé
        return Boolean.TRUE.equals(this.validated) && Boolean.FALSE.equals(this.used);
    }

    public void markAsUsed() {
        this.used = true;
        this.usedAt = LocalDateTime.now();
    }

    public boolean canBeCancelled() {
        // Autoriser annulation si pas encore utilisé
        return Boolean.FALSE.equals(this.used);
    }

    public void setUsedAt(LocalDateTime usedAt) {
        this.usedAt = usedAt;
    }

    // ---------------- Constructeur utilitaire principal ----------------

    /**
     * Crée un Ticket sécurisé à partir des deux clefs et d'informations d'achat.
     */
    public static Ticket createSecureTicket(Long eventId, Long userId, Long offerTypeId,
                                            Integer quantity, BigDecimal price,
                                            String primaryKey, String secondaryKey) {
        String ticketNumber = "TCK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Ticket ticket = Ticket.builder()
                .ticketNumber(ticketNumber)
                .eventId(eventId)
                .userId(userId)
                .offerTypeId(offerTypeId)
                .quantity(quantity)
                .price(price)
                .primaryKey(primaryKey)
                .secondaryKey(secondaryKey)
                .purchaseDate(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .validated(false)
                .used(false)
                .build();

        // Génération immédiate de l’URL QR (concaténation des clefs)
        ticket.generateSecureQrCodeUrl();

        return ticket;
    }
}