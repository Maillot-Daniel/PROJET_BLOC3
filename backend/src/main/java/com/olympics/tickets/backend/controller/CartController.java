package com.olympics.tickets.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import lombok.RequiredArgsConstructor;

import com.olympics.tickets.backend.dto.CartDTO;
import com.olympics.tickets.backend.dto.CartItemDTO;
import com.olympics.tickets.backend.service.CartService;
import com.olympics.tickets.backend.entity.OurUsers;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    // Récupère le panier de l'utilisateur connecté
    @GetMapping
    public ResponseEntity<CartDTO> getCurrentUserCart(Authentication authentication) {
        OurUsers user = (OurUsers) authentication.getPrincipal();
        return ResponseEntity.ok(cartService.getUserCart(user.getId()));
    }

    // Ajoute un item au panier de l'utilisateur connecté
    @PostMapping("/items")
    public ResponseEntity<CartDTO> addItemToCart(
            @Valid @RequestBody CartItemDTO itemDTO,
            Authentication authentication) {
        OurUsers user = (OurUsers) authentication.getPrincipal();
        return ResponseEntity.ok(cartService.addItemToCart(user.getId(), itemDTO));
    }

    // Endpoint admin pour récupérer le panier d'un utilisateur spécifique
    @GetMapping("/user/{userId}")
    public ResponseEntity<CartDTO> getUserCartById(@PathVariable Long userId) {
        return ResponseEntity.ok(cartService.getUserCart(userId));
    }
}