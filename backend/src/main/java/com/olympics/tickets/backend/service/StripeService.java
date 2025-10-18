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
import java.util.Arrays;

@Service
public class StripeService {

    @Value("${stripe.secret.key}")
    private String stripeApiKey;

    @Value("${frontend.success-url}")
    private String successUrl;

    @Value("${frontend.cancel-url}")
    private String cancelUrl;

    @PostConstruct
    public void init() {
        // Assurez-vous que la clé est valide avant de lancer l'application
        if (stripeApiKey == null || stripeApiKey.isBlank()) {
            throw new IllegalStateException("Stripe API key not configured!");
        }
        Stripe.apiKey = stripeApiKey;
    }

    public String createCheckoutSession(CartDTO cart, String customerEmail) throws StripeException {
        // Création des items Stripe
        SessionCreateParams.LineItem[] lineItems = cart.getItems().stream().map(item ->
                SessionCreateParams.LineItem.builder()
                        .setQuantity((long) item.getQuantity())
                        .setPriceData(
                                SessionCreateParams.LineItem.PriceData.builder()
                                        .setCurrency("eur")
                                        .setUnitAmount(item.getUnitPrice().multiply(new BigDecimal(100)).longValue())
                                        .setProductData(
                                                SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                        .setName(item.getEventTitle())
                                                        .build()
                                        )
                                        .build()
                        )
                        .build()
        ).toArray(SessionCreateParams.LineItem[]::new);

        // Paramètres de la session Stripe
        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(successUrl + "?success=true&session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(cancelUrl)
                .setCustomerEmail(customerEmail)
                .addAllLineItem(Arrays.asList(lineItems))
                .build();

        Session session = Session.create(params);
        return session.getUrl();
    }
}
