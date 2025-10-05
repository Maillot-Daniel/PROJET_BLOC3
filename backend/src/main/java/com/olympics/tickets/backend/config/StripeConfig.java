package com.olympics.tickets.backend.config;

import com.stripe.Stripe;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

@Component
public class StripeConfig {

    // CORRIGEZ LE NOM DE LA PROPRIÉTÉ
    @Value("${stripe.secret.key}")  // ← Changez stripe.api.key en stripe.secret.key
    private String stripeApiKey;

    @PostConstruct
    public void init() {
        // AJOUTEZ UNE VALEUR PAR DÉFAUT POUR LE DÉVELOPPEMENT
        if(stripeApiKey == null || stripeApiKey.isEmpty() || stripeApiKey.contains("temporary")) {
            System.out.println("⚠️  Stripe API key non configurée, utilisation d'une clé temporaire");
            Stripe.apiKey = "sk_test_temporaire123";
        } else {
            Stripe.apiKey = stripeApiKey;
            System.out.println("✅ Stripe API key configurée correctement !");
        }
    }
}