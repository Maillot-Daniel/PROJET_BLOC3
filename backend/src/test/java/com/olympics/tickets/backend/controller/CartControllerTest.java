package com.olympics.tickets.backend.controller;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import com.olympics.tickets.backend.dto.CartDTO;
import com.olympics.tickets.backend.service.CartService;
import com.olympics.tickets.backend.entity.OurUsers;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CartControllerTest {

    @Mock
    private CartService cartService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private CartController cartController;

    @Test
    public void getCurrentUserCart_ShouldReturnCart() {
        // Setup
        OurUsers user = new OurUsers();
        user.setId(1L);
        CartDTO cart = new CartDTO();

        when(authentication.getPrincipal()).thenReturn(user);
        when(cartService.getUserCart(1L)).thenReturn(cart);

        // Execute
        ResponseEntity<CartDTO> response = cartController.getCurrentUserCart(authentication);

        // Verify
        verify(cartService).getUserCart(1L);
    }
}