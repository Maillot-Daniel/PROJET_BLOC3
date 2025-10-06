package com.olympics.tickets.backend.service;

import com.stripe.Stripe;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StripeService {

    public StripeService() {
        // 🔑 Clé Stripe côté serveur
        Stripe.apiKey = System.getenv("STRIPE_SECRET_KEY");
    }

    public String createCheckoutSession(String customerEmail, List<Item> items, String successUrl, String cancelUrl) throws Exception {

        List<SessionCreateParams.LineItem> lineItems = items.stream().map(item ->
                SessionCreateParams.LineItem.builder()
                        .setQuantity(Long.valueOf(item.getQuantity()))
                        .setPriceData(
                                SessionCreateParams.LineItem.PriceData.builder()
                                        .setCurrency("eur")
                                        .setUnitAmount(item.getUnitPrice().longValue()) // en centimes
                                        .setProductData(
                                                SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                        .setName(item.getName())
                                                        .build()
                                        )
                                        .build()
                        )
                        .build()
        ).collect(Collectors.toList());

        SessionCreateParams params = SessionCreateParams.builder()
                .addAllLineItem(lineItems)
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setCustomerEmail(customerEmail)
                .setSuccessUrl(successUrl)
                .setCancelUrl(cancelUrl)
                .build();

        Session session = Session.create(params);
        return session.getUrl();
    }

    // Classe simple pour mapper les items du panier
    public static class Item {
        private String name;
        private Integer quantity;
        private Long unitPrice; // en centimes

        public Item(String name, Integer quantity, Long unitPrice) {
            this.name = name;
            this.quantity = quantity;
            this.unitPrice = unitPrice;
        }

        public String getName() { return name; }
        public Integer getQuantity() { return quantity; }
        public Long getUnitPrice() { return unitPrice; }
    }
}
