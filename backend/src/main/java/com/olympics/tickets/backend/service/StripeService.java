package com.olympics.tickets.backend.service;

import com.olympics.tickets.backend.dto.CartDTO;
import com.olympics.tickets.backend.dto.CartItemDTO;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;

@Service
public class StripeService {

    @Value("${stripe.secret.key}")
    private String stripeApiKey;

    @Value("${frontend.success-url:http://localhost:3000/success}")
    private String successUrl;

    @Value("${frontend.cancel-url:http://localhost:3000/cancel}")
    private String cancelUrl;

    @PostConstruct
    public void init() {
        if (stripeApiKey == null || stripeApiKey.isBlank()) {
            throw new IllegalStateException("Stripe API key not configured!");
        }
        Stripe.apiKey = stripeApiKey;
        System.out.println("✅ [STRIPE] Configuration initialisée");
    }

    public String createCheckoutSession(CartDTO cart, String customerEmail) throws StripeException {
        System.out.println("🛒 [STRIPE] Création session pour: " + customerEmail);

        // Validation
        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new IllegalArgumentException("Le panier est vide");
        }

        // Création des line items
        List<SessionCreateParams.LineItem> lineItems = new ArrayList<>();
        for (CartItemDTO item : cart.getItems()) {
            System.out.println("📦 [STRIPE] Article: " + item.getEventTitle() +
                    " - " + item.getUnitPrice() + "€ x" + item.getQuantity());

            long unitAmount = item.getUnitPrice().multiply(new BigDecimal(100)).longValue();

            SessionCreateParams.LineItem lineItem = SessionCreateParams.LineItem.builder()
                    .setQuantity((long) item.getQuantity())
                    .setPriceData(
                            SessionCreateParams.LineItem.PriceData.builder()
                                    .setCurrency("eur")
                                    .setUnitAmount(unitAmount)
                                    .setProductData(
                                            SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                    .setName(item.getEventTitle())
                                                    .build()
                                    )
                                    .build()
                    )
                    .build();

            lineItems.add(lineItem);
        }

        // Construction URL de succès
        String finalSuccessUrl = successUrl + "?session_id={CHECKOUT_SESSION_ID}";

        // Paramètres session
        SessionCreateParams.Builder paramsBuilder = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(finalSuccessUrl)
                .setCancelUrl(cancelUrl)
                .setCustomerEmail(customerEmail);

        // Ajouter les line items
        for (SessionCreateParams.LineItem lineItem : lineItems) {
            paramsBuilder.addLineItem(lineItem);
        }

        // Métadonnées
        paramsBuilder.putMetadata("customer_email", customerEmail)
                .putMetadata("total_amount", cart.getTotalPrice().toString())
                .putMetadata("item_count", String.valueOf(cart.getItems().size()))
                .putMetadata("timestamp", String.valueOf(System.currentTimeMillis()));

        SessionCreateParams params = paramsBuilder.build();

        try {
            Session session = Session.create(params);
            System.out.println("✅ [STRIPE] Session créée: " + session.getId());
            return session.getUrl();

        } catch (StripeException e) {
            System.err.println("❌ [STRIPE] Erreur: " + e.getMessage());
            throw e;
        }
    }

    public Session getSessionDetails(String sessionId) throws StripeException {
        try {
            Session session = Session.retrieve(sessionId);
            System.out.println("🔍 [STRIPE] Session " + sessionId + " - Statut: " + session.getStatus());
            return session;
        } catch (StripeException e) {
            System.err.println("❌ [STRIPE] Erreur récupération: " + e.getMessage());
            throw e;
        }
    }
}