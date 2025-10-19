package com.olympics.tickets.backend.controller;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import com.olympics.tickets.backend.service.CartService;
import com.olympics.tickets.backend.entity.Cart;
import com.olympics.tickets.backend.entity.CartItem;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.annotation.PostConstruct;
import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/pay")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // ✅ Changez pour autoriser tous les origines
public class PaymentController {

    @Value("${stripe.secret.key}")
    private String stripeKey;

    private final CartService cartService;

    @Value("${frontend.success-url:http://localhost:3000/success}")
    private String defaultSuccessUrl;

    @Value("${frontend.cancel-url:http://localhost:3000/cancel}")
    private String defaultCancelUrl;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeKey;
        System.out.println("✅ [STRIPE] PaymentController initialisé");
    }

    @PostMapping("/create-checkout-session")
    public ResponseEntity<?> createCheckout(@RequestBody CreateCheckoutRequest req) throws StripeException {
        System.out.println("🛒 [API] Création session checkout pour cartId: " + req.getCartId());

        Cart cart = cartService.getCartById(req.getCartId());
        if (cart == null || cart.getItems() == null || cart.getItems().isEmpty()) {
            return ResponseEntity.badRequest().body("Panier vide ou introuvable");
        }

        // ✅ CALCUL DU TOTAL MANUEL
        BigDecimal total = BigDecimal.ZERO;
        for (CartItem item : cart.getItems()) {
            total = total.add(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
        }

        String primaryKey = UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();

        List<SessionCreateParams.LineItem> lineItems = cart.getItems().stream().map(item -> {
            long unitAmountCents = item.getUnitPrice().multiply(new BigDecimal(100)).longValue();

            String productName = item.getEvent().getTitle();
            if (item.getOfferType() != null) {
                productName += " - " + item.getOfferType().getName();
            }

            return SessionCreateParams.LineItem.builder()
                    .setQuantity(Long.valueOf(item.getQuantity()))
                    .setPriceData(
                            SessionCreateParams.LineItem.PriceData.builder()
                                    .setCurrency("eur")
                                    .setUnitAmount(unitAmountCents)
                                    .setProductData(
                                            SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                    .setName(productName)
                                                    .build()
                                    ).build()
                    ).build();
        }).collect(Collectors.toList());

        String finalSuccessUrl = buildSuccessUrl(req.getSuccessUrl() != null ? req.getSuccessUrl() : defaultSuccessUrl);

        SessionCreateParams.Builder builder = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .addAllLineItem(lineItems)
                .setSuccessUrl(finalSuccessUrl)
                .setCancelUrl(req.getCancelUrl() != null ? req.getCancelUrl() : defaultCancelUrl)
                .setCustomerEmail(cart.getUser().getEmail())
                .putMetadata("cartId", String.valueOf(cart.getId()))
                .putMetadata("userId", String.valueOf(cart.getUser().getId()))
                .putMetadata("primaryKey", primaryKey)
                .putMetadata("total_amount", total.toString())
                .putMetadata("quantity", String.valueOf(cart.getItems().stream().mapToInt(CartItem::getQuantity).sum()));

        Session session = Session.create(builder.build());

        System.out.println("✅ [API] Session créée: " + session.getId());

        Map<String, Object> resp = new HashMap<>();
        resp.put("sessionId", session.getId());
        resp.put("url", session.getUrl());
        resp.put("primaryKey", primaryKey);

        return ResponseEntity.ok(resp);
    }

    // ✅ AJOUTEZ CETTE MÉTHODE MANQUANTE
    @GetMapping("/session/{sessionId}")
    public ResponseEntity<?> getSessionDetails(@PathVariable String sessionId) {
        try {
            System.out.println("🔍 [API] Récupération session Stripe: " + sessionId);

            Session session = Session.retrieve(sessionId);

            Map<String, Object> response = new HashMap<>();
            response.put("id", session.getId());
            response.put("status", session.getStatus());
            response.put("customer_email", session.getCustomerEmail());
            response.put("amount_total", session.getAmountTotal());
            response.put("currency", session.getCurrency());
            response.put("payment_status", session.getPaymentStatus());
            response.put("metadata", session.getMetadata());

            System.out.println("✅ [API] Session trouvée - Statut: " + session.getStatus());

            return ResponseEntity.ok(response);

        } catch (StripeException e) {
            System.err.println("❌ [API] Erreur Stripe: " + e.getMessage());

            Map<String, String> error = new HashMap<>();
            error.put("error", "Session non trouvée");
            error.put("message", e.getMessage());

            return ResponseEntity.status(404).body(error);
        } catch (Exception e) {
            System.err.println("❌ [API] Erreur inattendue: " + e.getMessage());

            Map<String, String> error = new HashMap<>();
            error.put("error", "Erreur serveur");
            error.put("message", e.getMessage());

            return ResponseEntity.status(500).body(error);
        }
    }

    // ✅ AJOUTEZ CETTE MÉTHODE DE SANTÉ
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        response.put("service", "Paiement API");
        response.put("timestamp", new Date().toString());
        return ResponseEntity.ok(response);
    }

    private String buildSuccessUrl(String baseUrl) {
        String url = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        return url + "?session_id={CHECKOUT_SESSION_ID}";
    }

    public static class CreateCheckoutRequest {
        private Long cartId;
        private String successUrl;
        private String cancelUrl;

        public Long getCartId() { return cartId; }
        public void setCartId(Long cartId) { this.cartId = cartId; }
        public String getSuccessUrl() { return successUrl; }
        public void setSuccessUrl(String successUrl) { this.successUrl = successUrl; }
        public String getCancelUrl() { return cancelUrl; }
        public void setCancelUrl(String cancelUrl) { this.cancelUrl = cancelUrl; }
    }
}