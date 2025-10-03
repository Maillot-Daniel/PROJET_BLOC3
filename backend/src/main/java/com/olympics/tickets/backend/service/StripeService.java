package com.olympics.tickets.backend.service;  // Package corrigé

import com.olympics.tickets.backend.dto.CartItemDTO;
import com.olympics.tickets.backend.entity.Cart;
import com.olympics.tickets.backend.entity.CartItem;
import com.olympics.tickets.backend.repository.CartRepository;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.List;
import java.util.stream.Collectors;
import java.math.BigDecimal;

@Service
public class StripeService {

    @Value("${stripe.secret-key}")
    private String stripeSecretKey;

    @Value("${frontend.success-url}")
    private String successUrl;

    @Value("${frontend.cancel-url}")
    private String cancelUrl;

    private final CartRepository cartRepository;

    public StripeService(CartRepository cartRepository) {
        this.cartRepository = cartRepository;
    }

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeSecretKey;
    }

    public String createCheckoutSession(List<CartItemDTO> cartItems) throws StripeException {
        List<SessionCreateParams.LineItem> lineItems = cartItems.stream()
                .map(this::createLineItem)
                .collect(Collectors.toList());

        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(successUrl + "?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(cancelUrl)
                .addAllLineItem(lineItems)
                .build();

        Session session = Session.create(params);
        return session.getUrl();
    }

    private SessionCreateParams.LineItem createLineItem(CartItemDTO item) {
        // Vérification de nullité pour éviter les NPE
        BigDecimal unitPrice = item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO;
        String eventTitle = item.getEventTitle() != null ? item.getEventTitle() : "Événement inconnu";
        String offerType = item.getOfferType() != null ? item.getOfferType() : "Standard";

        return SessionCreateParams.LineItem.builder()
                .setPriceData(
                        SessionCreateParams.LineItem.PriceData.builder()
                                .setCurrency("eur")
                                .setUnitAmount(unitPrice.multiply(BigDecimal.valueOf(100)).longValue())
                                .setProductData(
                                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                .setName(String.format("%s - %s", eventTitle, offerType))
                                                .build())
                                .build())
                .setQuantity((long) item.getQuantity())
                .build();
    }
}