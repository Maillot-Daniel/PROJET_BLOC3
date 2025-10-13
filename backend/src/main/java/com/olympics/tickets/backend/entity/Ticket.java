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
    private String ticketNumber;

    @Column(name = "qr_code_url", length = 500)
    @Builder.Default
    private String qrCodeUrl = "";

    // CHAMPS DE SÉCURITÉ CORRIGÉS
    @Column(name = "primary_key", unique = true, length = 255)
    private String primaryKey;

    @Column(name = "secondary_key", length = 255)
    private String secondaryKey;

    @Column(name = "hashed_key", length = 255)
    private String hashedKey;

    @Column(name = "signature", columnDefinition = "TEXT")
    private String signature;

    @Column(name = "used")
    @Builder.Default
    private Boolean used = false;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    // CHAMPS EXISTANTS
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
    @Builder.Default
    private Boolean validated = false;

    @Column(nullable = false)
    private Integer quantity;

    @Column(precision = 38, scale = 2, nullable = false)
    private BigDecimal price;

    // CONSTRUCTEURS SPÉCIALISÉS

    /**
     * Méthode factory pour créer un nouveau ticket SANS sécurité (rétrocompatibilité)
     */
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
                .used(false)
                .quantity(quantity)
                .price(calculateFinalPrice(basePrice, offerType.getName(), quantity))
                .build();
    }

    /**
     * NOUVELLE méthode factory pour créer un ticket AVEC sécurité
     */
    public static Ticket createSecureTicket(Event event, OurUsers user, OfferType offerType,
                                            Integer quantity, BigDecimal basePrice) {

        String primaryKey = generateTicketKey();
        String secondaryKey = generateTicketKey();

        return Ticket.builder()
                .ticketNumber(UUID.randomUUID().toString())
                .qrCodeUrl("") // Sera généré par le service de sécurité
                .primaryKey(primaryKey)
                .secondaryKey(secondaryKey)
                .hashedKey("") // Sera calculé par le service de sécurité
                .signature("") // Sera calculé par le service de sécurité
                .event(event)
                .user(user)
                .offerType(offerType)
                .purchaseDate(LocalDateTime.now())
                .validated(false)
                .used(false)
                .quantity(quantity)
                .price(calculateFinalPrice(basePrice, offerType.getName(), quantity))
                .build();
    }

    // MÉTHODES DE GÉNÉRATION DE CLÉS
    private static String generateTicketKey() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }

    // GÉNÉRATION DES QR CODES
    private static String generateQrCodeUrl() {
        return "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + UUID.randomUUID();
    }

    /**
     * Génère l'URL du QR code sécurisé
     */
    public String generateSecureQrCodeUrl() {
        String qrData = this.primaryKey + "|" + this.signature;
        return "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" +
                java.net.URLEncoder.encode(qrData, java.nio.charset.StandardCharsets.UTF_8);
    }

    /**
     * Retourne les données pour le QR code (primaryKey + signature)
     */
    public String getQrData() {
        return this.primaryKey + "|" + this.signature;
    }

    // CALCUL DU PRIX
    private static BigDecimal calculateFinalPrice(BigDecimal basePrice, String offerType, Integer quantity) {
        BigDecimal priceMultiplier = switch (offerType.toUpperCase()) {
            case "DUO" -> BigDecimal.valueOf(1.8);
            case "FAMILLE" -> BigDecimal.valueOf(3.2);
            default -> BigDecimal.ONE;
        };
        return basePrice.multiply(priceMultiplier)
                .multiply(BigDecimal.valueOf(quantity));
    }

    // MÉTHODES UTILITAIRES AMÉLIORÉES

    /**
     * Vérifie si le ticket est valide (compatibilité ancien système)
     */
    public boolean isValid() {
        return !validated && !used && purchaseDate.isBefore(LocalDateTime.now().plusMonths(1));
    }

    /**
     * Vérifie si le ticket peut être validé (nouveau système sécurisé)
     */
    public boolean isValidForValidation() {
        return !used &&
                !validated &&
                purchaseDate.isBefore(LocalDateTime.now().plusMonths(1)) &&
                event != null &&
                event.getDate().isAfter(LocalDateTime.now()) &&
                primaryKey != null &&
                secondaryKey != null &&
                signature != null &&
                hashedKey != null;
    }

    /**
     * Valide le ticket (ancien système)
     */
    public void validate() {
        this.validated = true;
    }

    /**
     * Marque le ticket comme utilisé (nouveau système sécurisé)
     */
    public void markAsUsed() {
        this.used = true;
        this.validated = true; // Compatibilité avec l'ancien système
        this.usedAt = LocalDateTime.now();
    }

    // GETTERS CALCULÉS
    public BigDecimal getUnitPrice() {
        if (quantity == null || quantity == 0) {
            return BigDecimal.ZERO;
        }
        return price.divide(BigDecimal.valueOf(quantity), BigDecimal.ROUND_HALF_UP);
    }

    public String getEventTitle() {
        return event != null ? event.getTitle() : "Événement inconnu";
    }

    public String getUserEmail() {
        return user != null ? user.getEmail() : "Utilisateur inconnu";
    }

    public String getOfferTypeName() {
        return offerType != null ? offerType.getName() : "Type inconnu";
    }

    public String getEventLocation() {
        return event != null ? event.getLocation() : "Lieu inconnu";
    }

    public LocalDateTime getEventDate() {
        return event != null ? event.getDate() : null;
    }

    // MÉTHODES DE VÉRIFICATION D'ÉTAT
    public boolean isExpired() {
        return purchaseDate.isBefore(LocalDateTime.now().minusMonths(1));
    }

    public boolean isUpcomingEvent() {
        return event != null && event.getDate().isAfter(LocalDateTime.now());
    }

    public boolean canBeCancelled() {
        return !used && !validated && isUpcomingEvent() &&
                purchaseDate.isAfter(LocalDateTime.now().minusDays(1));
    }

    /**
     * Vérifie l'intégrité du ticket en recalculant le hash
     * Utilisé pendant la validation
     */
    public boolean checkIntegrity(String recalculatedHash) {
        return this.hashedKey != null &&
                this.hashedKey.equals(recalculatedHash);
    }

    /**
     * Vérifie la signature du ticket
     * Utilisé pendant la validation
     */
    public boolean checkSignature(String recalculatedSignature) {
        return this.signature != null &&
                this.signature.equals(recalculatedSignature);
    }

    // IMPLÉMENTATION DES GETTERS/SETTERS (Lombok les génère déjà)

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTicketNumber() {
        return ticketNumber;
    }

    public void setTicketNumber(String ticketNumber) {
        this.ticketNumber = ticketNumber;
    }

    public String getQrCodeUrl() {
        return qrCodeUrl;
    }

    public void setQrCodeUrl(String qrCodeUrl) {
        this.qrCodeUrl = qrCodeUrl;
    }

    public String getPrimaryKey() {
        return primaryKey;
    }

    public void setPrimaryKey(String primaryKey) {
        this.primaryKey = primaryKey;
    }

    public String getSecondaryKey() {
        return secondaryKey;
    }

    public void setSecondaryKey(String secondaryKey) {
        this.secondaryKey = secondaryKey;
    }

    public String getHashedKey() {
        return hashedKey;
    }

    public void setHashedKey(String hashedKey) {
        this.hashedKey = hashedKey;
    }

    public String getSignature() {
        return signature;
    }

    public void setSignature(String signature) {
        this.signature = signature;
    }

    public Boolean getUsed() {
        return used;
    }

    public void setUsed(Boolean used) {
        this.used = used;
    }

    public LocalDateTime getUsedAt() {
        return usedAt;
    }

    public void setUsedAt(LocalDateTime usedAt) {
        this.usedAt = usedAt;
    }

    public Event getEvent() {
        return event;
    }

    public void setEvent(Event event) {
        this.event = event;
    }

    public OurUsers getUser() {
        return user;
    }

    public void setUser(OurUsers user) {
        this.user = user;
    }

    public OfferType getOfferType() {
        return offerType;
    }

    public void setOfferType(OfferType offerType) {
        this.offerType = offerType;
    }

    public LocalDateTime getPurchaseDate() {
        return purchaseDate;
    }

    public void setPurchaseDate(LocalDateTime purchaseDate) {
        this.purchaseDate = purchaseDate;
    }

    public Boolean getValidated() {
        return validated;
    }

    public void setValidated(Boolean validated) {
        this.validated = validated;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    // EQUALS AND HASHCODE
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Ticket ticket = (Ticket) o;
        return id != null && id.equals(ticket.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}