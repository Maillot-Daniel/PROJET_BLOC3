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
        // Validation de la clé API Stripe
        if (stripeApiKey == null || stripeApiKey.isBlank()) {
            throw new IllegalStateException("Stripe API key not configured!");
        }
        Stripe.apiKey = stripeApiKey;

        // ✅ LOGS pour vérifier la configuration
        System.out.println("🎯 [STRIPE] Configuration initialisée:");
        System.out.println("🎯 [STRIPE] API Key: " + (stripeApiKey.substring(0, 8) + "..."));
        System.out.println("🎯 [STRIPE] Success URL: " + successUrl);
        System.out.println("🎯 [STRIPE] Cancel URL: " + cancelUrl);
    }

    public String createCheckoutSession(CartDTO cart, String customerEmail) throws StripeException {
        // ✅ LOGS détaillés pour le débogage
        System.out.println("🛒 [STRIPE] Création session de paiement:");
        System.out.println("🛒 [STRIPE] Client: " + customerEmail);
        System.out.println("🛒 [STRIPE] Nombre d'articles: " + cart.getItems().size());
        System.out.println("🛒 [STRIPE] Total: " + cart.getTotalPrice() + "€");

        // Validation des données
        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new IllegalArgumentException("Le panier est vide");
        }

        // Création des items Stripe avec logs
        SessionCreateParams.LineItem[] lineItems = cart.getItems().stream().map(item -> {
            System.out.println("📦 [STRIPE] Traitement article: " +
                    item.getEventTitle() + " - " +
                    item.getUnitPrice() + "€ x" + item.getQuantity());

            // Validation du prix
            if (item.getUnitPrice() == null || item.getUnitPrice().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Prix invalide pour: " + item.getEventTitle());
            }

            // Conversion en cents pour Stripe
            long unitAmount = item.getUnitPrice().multiply(new BigDecimal(100)).longValue();

            return SessionCreateParams.LineItem.builder()
                    .setQuantity((long) item.getQuantity())
                    .setPriceData(
                            SessionCreateParams.LineItem.PriceData.builder()
                                    .setCurrency("eur")
                                    .setUnitAmount(unitAmount)
                                    .setProductData(
                                            SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                    .setName(item.getEventTitle() + " - " +
                                                            (item.getOfferTypeName() != null ? item.getOfferTypeName() : "Billet"))
                                                    // ❌ SUPPRIMÉ : .addMetadata() n'existe pas dans cette version
                                                    .build()
                                    )
                                    .build()
                    )
                    .build();
        }).toArray(SessionCreateParams.LineItem[]::new);

        // ✅ Construction de l'URL de succès avec le session_id
        String finalSuccessUrl = successUrl + "?success=true&session_id={CHECKOUT_SESSION_ID}";
        System.out.println("🔗 [STRIPE] URL de succès finale: " + finalSuccessUrl);

        // Paramètres de la session Stripe
        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(finalSuccessUrl)
                .setCancelUrl(cancelUrl)
                .setCustomerEmail(customerEmail)
                .addAllLineItem(Arrays.asList(lineItems))

                .putMetadata("customer_email", customerEmail)
                .putMetadata("total_amount", cart.getTotalPrice().toString())
                .putMetadata("item_count", String.valueOf(cart.getItems().size()))
                .build();

        try {
            // Création de la session Stripe
            Session session = Session.create(params);

            // ✅ LOGS de confirmation
            System.out.println("✅ [STRIPE] Session créée avec succès:");
            System.out.println("✅ [STRIPE] Session ID: " + session.getId());
            System.out.println("✅ [STRIPE] URL de paiement: " + session.getUrl());
            System.out.println("✅ [STRIPE] Statut: " + session.getStatus());

            return session.getUrl();

        } catch (StripeException e) {
            // ✅ Gestion d'erreur détaillée
            System.err.println("❌ [STRIPE] Erreur lors de la création de la session:");
            System.err.println("❌ [STRIPE] Code: " + e.getCode());
            System.err.println("❌ [STRIPE] Message: " + e.getMessage());
            System.err.println("❌ [STRIPE] User Message: " + e.getUserMessage());
            throw e;
        }
    }

    // ✅ RÉCUPÉRER LES DÉTAILS D'UNE SESSION
    public Session getSessionDetails(String sessionId) throws StripeException {
        try {
            Session session = Session.retrieve(sessionId);
            System.out.println("🔍 [STRIPE] Détails session " + sessionId + ":");
            System.out.println("🔍 [STRIPE] Statut: " + session.getStatus());
            System.out.println("🔍 [STRIPE] Paiement: " + session.getPaymentStatus());
            System.out.println("🔍 [STRIPE] Client: " + session.getCustomerEmail());
            return session;
        } catch (StripeException e) {
            System.err.println("❌ [STRIPE] Erreur récupération session " + sessionId + ": " + e.getMessage());
            throw e;
        }
    }
}