package com.olympics.tickets.backend;

import com.olympics.tickets.backend.dto.CartDTO;
import com.olympics.tickets.backend.dto.CartItemDTO;
import com.olympics.tickets.backend.service.StripeService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class BackendApplicationTests {

    @Autowired
    private StripeService stripeService;

    @Test
    void contextLoads() {
        assertNotNull(stripeService);
    }

    @Test
    void testCreateCheckoutSession() throws Exception {
        // Création d'un panier factice
        CartItemDTO item = new CartItemDTO();
        item.setEventId(1L);
        item.setEventTitle("Test Event");
        item.setOfferTypeName("Standard");
        item.setQuantity(2);
        item.setUnitPrice(new BigDecimal("50.00"));

        CartDTO cart = new CartDTO();
        cart.setItems(Arrays.asList(item));

        String customerEmail = "test@example.com";

        String sessionUrl = stripeService.createCheckoutSession(cart, customerEmail);

        assertNotNull(sessionUrl);
        assertTrue(sessionUrl.startsWith("https://"), "L'URL de session doit commencer par https://");
    }
}
