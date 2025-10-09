package com.olympics.tickets.backend.config;

import com.stripe.Stripe;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

@Component
public class StripeConfig {

    @Value("${stripe.secret.key}")
    private String stripeSecretKey;

    @PostConstruct
    public void init() {
        if (stripeSecretKey == null || stripeSecretKey.isEmpty()) {
            System.out.println("❌ Stripe API key non configurée - Paiements désactivés");
        } else if (stripeSecretKey.startsWith("sk_test")) {
            Stripe.apiKey = stripeSecretKey;
            System.out.println("✅ Stripe configuré en mode TEST avec votre clé !");
            System.out.println("🔑 Clé utilisée: " + stripeSecretKey.substring(0, 20) + "...");
        } else if (stripeSecretKey.startsWith("sk_live")) {
            Stripe.apiKey = stripeSecretKey;
            System.out.println("🚀 Stripe configuré en mode PRODUCTION !");
        } else {
            System.out.println("⚠️  Clé Stripe invalide - Paiements désactivés");
        }
    }
}