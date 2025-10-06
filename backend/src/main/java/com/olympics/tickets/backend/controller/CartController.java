package com.olympics.tickets.backend.controller;

import com.olympics.tickets.backend.dto.CartDTO;
import com.olympics.tickets.backend.dto.CartItemDTO;
import com.olympics.tickets.backend.entity.OurUsers;
import com.olympics.tickets.backend.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    /**
     * 🔹 Récupère le panier de l'utilisateur connecté
     */
    @GetMapping
    public ResponseEntity<CartDTO> getCurrentUserCart(Authentication authentication) {
        OurUsers user = (OurUsers) authentication.getPrincipal();
        return ResponseEntity.ok(cartService.getUserCart(user.getId()));
    }

    /**
     * 🔹 Ajoute un item au panier de l'utilisateur connecté
     */
    @PostMapping("/items")
    public ResponseEntity<CartDTO> addItemToCart(
            @Valid @RequestBody CartItemDTO itemDTO,
            Authentication authentication) {
        OurUsers user = (OurUsers) authentication.getPrincipal();
        return ResponseEntity.ok(cartService.addItemToCart(user.getId(), itemDTO));
    }

    /**
     * 🔹 Endpoint admin : récupère le panier d'un utilisateur spécifique
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<CartDTO> getUserCartById(@PathVariable Long userId) {
        return ResponseEntity.ok(cartService.getUserCart(userId));
    }

    /**
     * 🔹 Vide le panier de l'utilisateur connecté
     */
    @DeleteMapping("/clear")
    public ResponseEntity<String> clearCart(Authentication authentication) {
        OurUsers user = (OurUsers) authentication.getPrincipal();
        try {
            cartService.clearCart(user.getId());
            return ResponseEntity.ok("Panier vidé avec succès.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body("Erreur lors du vidage du panier : " + e.getMessage());
        }
    }

    /**
     * 🔹 Valide le panier de l'utilisateur connecté
     *    (paiement Stripe, sauvegarde de la commande et passage du panier en statut VALIDATED)
     */
    @PostMapping("/validate")
    public ResponseEntity<String> validateCart(Authentication authentication) {
        OurUsers user = (OurUsers) authentication.getPrincipal();

        try {
            // Appelle la méthode checkoutCart pour créer la commande et générer l'URL Stripe
            String stripeUrl = cartService.checkoutCart(user.getId());
            return ResponseEntity.ok(stripeUrl); // renvoie l'URL Stripe au frontend
        } catch (IllegalStateException ise) {
            return ResponseEntity.badRequest()
                    .body("Impossible de valider : " + ise.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body("Erreur lors de la validation du panier : " + e.getMessage());
        }
    }
}
