package com.olympics.tickets.backend;

import com.olympics.tickets.backend.dto.CartDTO;
import com.olympics.tickets.backend.dto.CartItemDTO;
import com.olympics.tickets.backend.service.StripeService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.math.BigDecimal;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@SpringBootTest
class BackendApplicationTests {

    @MockBean
    private StripeService stripeService; // On simule StripeService pour éviter les appels réels

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

        // Simulation de la méthode createCheckoutSession
        when(stripeService.createCheckoutSession(cart, customerEmail))
                .thenReturn("https://checkout.stripe.com/test_session");

        String sessionUrl = stripeService.createCheckoutSession(cart, customerEmail);

        assertNotNull(sessionUrl);
        assertTrue(sessionUrl.startsWith("https://"), "L'URL de session doit commencer par https://");

        // Vérifie que la méthode a été appelée une fois
        verify(stripeService, times(1)).createCheckoutSession(cart, customerEmail);
    }
}
