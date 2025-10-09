package com.olympics.tickets.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "cart")
@Data
public class Cart {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private OurUsers user;

    private boolean active;

    @Enumerated(EnumType.STRING)
    private CartStatus status;

    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<CartItem> items = new ArrayList<>();

    // Méthode de compatibilité pour le PaymentController
    public List<CartItem> getCartItems() {
        return this.items;
    }

    public void setCartItems(List<CartItem> cartItems) {
        this.items = cartItems;
    }

    // Méthodes utilitaires
    public BigDecimal getTotalAmount() {
        if (items == null || items.isEmpty()) {
            return BigDecimal.ZERO;
        }
        return items.stream()
                .map(item -> item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public int getTotalItems() {
        return items != null ? items.size() : 0;
    }

    public boolean isEmpty() {
        return items == null || items.isEmpty();
    }

    public void clear() {
        if (items != null) {
            items.clear();
        }
    }

    public void addItem(CartItem item) {
        if (items == null) {
            items = new ArrayList<>();
        }
        item.setCart(this);
        items.add(item);
    }

    public void removeItem(CartItem item) {
        if (items != null) {
            items.remove(item);
            item.setCart(null);
        }
    }

    // Ajout des getters/setters manquants pour résoudre les erreurs de compilation
    public Long getId() {
        return this.id;
    }

    public OurUsers getUser() {
        return this.user;
    }

    public void setUser(OurUsers user) {
        this.user = user;
    }

    public boolean isActive() {
        return this.active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public CartStatus getStatus() {
        return this.status;
    }

    public void setStatus(CartStatus status) {
        this.status = status;
    }

    public List<CartItem> getItems() {
        return this.items;
    }

    public void setItems(List<CartItem> items) {
        this.items = items;
    }
}