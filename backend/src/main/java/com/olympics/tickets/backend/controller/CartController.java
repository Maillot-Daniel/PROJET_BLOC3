package com.olympics.tickets.backend.controller;

import com.olympics.tickets.backend.dto.CartDTO;
import com.olympics.tickets.backend.service.StripeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final StripeService stripeService;

    /**
     * Valide le panier et crée une session Stripe Checkout
     */
    @PostMapping("/validate")
    public ResponseEntity<?> validateCart(@RequestBody CartDTO cart,
                                          @RequestHeader("Authorization") String authHeader) {
        try {
            // Ici tu peux vérifier le token si nécessaire
            String customerEmail = extractEmailFromToken(authHeader);

            // Crée la session Stripe
            String checkoutUrl = stripeService.createCheckoutSession(cart, customerEmail);

            // Retourne l'URL à ton frontend
            return ResponseEntity.ok().body(new CheckoutResponse(checkoutUrl));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("An unexpected error occurred: " + e.getMessage());
        }
    }

    // Méthode fictive pour récupérer l'email depuis le token JWT
    private String extractEmailFromToken(String authHeader) {
        // TODO: Implémente la vraie récupération de l'email à partir du JWT
        return "client@example.com";
    }

    // Classe interne pour la réponse JSON
    public static class CheckoutResponse {
        private String url;

        public CheckoutResponse(String url) {
            this.url = url;
        }

        public String getUrl() {
            return url;
        }

        public void setUrl(String url) {
            this.url = url;
        }
    }
}