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
@CrossOrigin(origins = "http://localhost:3000")
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
    }

    @PostMapping("/create-checkout-session")
    public ResponseEntity<?> createCheckout(@RequestBody CreateCheckoutRequest req) throws StripeException {
        Cart cart = cartService.getCartById(req.getCartId());
        if (cart == null || cart.getItems() == null || cart.getItems().isEmpty()) {
            return ResponseEntity.badRequest().body("Panier vide ou introuvable");
        }

        // ✅ CALCUL DU TOTAL MANUEL (si getTotalPrice() n'existe pas)
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
                .putMetadata("total_amount", total.toString()) // ✅ UTILISER LE TOTAL CALCULÉ
                .putMetadata("quantity", String.valueOf(cart.getItems().stream().mapToInt(CartItem::getQuantity).sum()));

        Session session = Session.create(builder.build());

        Map<String, Object> resp = new HashMap<>();
        resp.put("sessionId", session.getId());
        resp.put("url", session.getUrl());
        resp.put("primaryKey", primaryKey);

        return ResponseEntity.ok(resp);
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