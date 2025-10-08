package com.olympics.tickets.backend.controller;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import com.olympics.tickets.backend.service.CartService;
import com.olympics.tickets.backend.entity.Cart;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.annotation.PostConstruct;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/pay")
@RequiredArgsConstructor
public class PaymentController {

    @Value("${stripe.secret.key}")
    private String stripeKey;

    private final CartService cartService;

    // Valeurs par défaut si non définies
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
        if (cart == null || cart.getCartItems() == null || cart.getCartItems().isEmpty()) {
            return ResponseEntity.badRequest().body("Panier vide ou introuvable");
        }

        List<SessionCreateParams.LineItem> lineItems = cart.getCartItems().stream().map(item -> {
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
                                                    .putMetadata("eventId", String.valueOf(item.getEvent().getId()))
                                                    .putMetadata("offerType",
                                                            item.getOfferType() != null ?
                                                                    item.getOfferType().getName() : "Standard")
                                                    .build()
                                    ).build()
                    ).build();
        }).collect(Collectors.toList());

        SessionCreateParams.Builder builder = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .addAllLineItem(lineItems)
                .setSuccessUrl(req.getSuccessUrl() != null ? req.getSuccessUrl() : defaultSuccessUrl)
                .setCancelUrl(req.getCancelUrl() != null ? req.getCancelUrl() : defaultCancelUrl)
                .setCustomerEmail(cart.getUser().getEmail())
                .putMetadata("cartId", String.valueOf(cart.getId()));

        Session session = Session.create(builder.build());

        Map<String, Object> resp = new HashMap<>();
        resp.put("sessionId", session.getId());
        resp.put("url", session.getUrl());

        return ResponseEntity.ok(resp);
    }

    public static class CreateCheckoutRequest {
        private Long cartId;
        private String successUrl;
        private String cancelUrl;

        // getters/setters
        public Long getCartId() { return cartId; }
        public void setCartId(Long cartId) { this.cartId = cartId; }
        public String getSuccessUrl() { return successUrl; }
        public void setSuccessUrl(String successUrl) { this.successUrl = successUrl; }
        public String getCancelUrl() { return cancelUrl; }
        public void setCancelUrl(String cancelUrl) { this.cancelUrl = cancelUrl; }
    }
}
