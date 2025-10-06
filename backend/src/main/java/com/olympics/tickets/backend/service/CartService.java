package com.olympics.tickets.backend.service;

import com.olympics.tickets.backend.dto.CartDTO;
import com.olympics.tickets.backend.dto.CartItemDTO;
import com.olympics.tickets.backend.entity.*;
import com.olympics.tickets.backend.exception.NotFoundException;
import com.olympics.tickets.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CartService {
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final EventRepository eventRepository;
    private final OfferTypeRepository offerTypeRepository;
    private final UsersRepo userRepository;

    @Transactional
    public CartDTO addItemToCart(Long userId, CartItemDTO dto) {
        // 1. Ajouter l'article au panier
        CartItem item = addToCart(dto, userId);

        // 2. Récupérer le panier complet mis à jour
        Cart cart = cartRepository.findByUserIdAndActiveTrue(userId)
                .orElseThrow(() -> new NotFoundException("Panier non trouvé"));

        // 3. Retourner le DTO complet du panier
        return convertToDTO(cart);
    }

    @Transactional
    protected CartItem addToCart(CartItemDTO dto, Long userId) {
        // Trouver ou créer le panier
        Cart cart = cartRepository.findByUserIdAndActiveTrue(userId)
                .orElseGet(() -> createNewCart(userId));

        // Valider et convertir le DTO
        Event event = eventRepository.findById(dto.getEventId())
                .orElseThrow(() -> new NotFoundException("Événement non trouvé"));

        OfferType offerType = offerTypeRepository.findById(dto.getOfferTypeId())
                .orElseThrow(() -> new NotFoundException("Type d'offre non trouvé"));

        // Créer l'item de panier
        CartItem item = new CartItem();
        item.setCart(cart);
        item.setEvent(event);
        item.setOfferType(offerType);
        item.setQuantity(dto.getQuantity());
        item.setUnitPrice(calculatePrice(event.getPrice(), offerType.getName()));

        // Initialiser la liste si nécessaire
        if (cart.getItems() == null) {
            cart.setItems(new ArrayList<>());
        }

        cart.getItems().add(item);
        cartItemRepository.save(item);
        cartRepository.save(cart);

        return item;
    }

    public CartDTO getUserCart(Long userId) {
        Cart cart = cartRepository.findByUserIdAndActiveTrue(userId)
                .orElseThrow(() -> new NotFoundException("Panier non trouvé"));
        return convertToDTO(cart);
    }

    private CartDTO convertToDTO(Cart cart) {
        CartDTO dto = new CartDTO();
        dto.setId(cart.getId());
        dto.setUserId(cart.getUser().getId());
        dto.setStatus(cart.getStatus().toString());

        List<CartItemDTO> items = cart.getItems() != null ?
                cart.getItems().stream()
                        .map(this::convertItemToDTO)
                        .toList() :
                List.of();

        dto.setItems(items);
        dto.setTotalPrice(calculateTotalPrice(items));
        return dto;
    }

    private CartItemDTO convertItemToDTO(CartItem item) {
        CartItemDTO dto = new CartItemDTO();
        dto.setId(item.getId());
        dto.setEventId(item.getEvent().getId());
        dto.setEventTitle(item.getEvent().getTitle());
        dto.setOfferTypeId(item.getOfferType().getId());
        dto.setOfferTypeName(item.getOfferType().getName());
        dto.setQuantity(item.getQuantity());
        dto.setUnitPrice(item.getUnitPrice());
        dto.setTotalPrice(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
        return dto;
    }

    private BigDecimal calculateTotalPrice(List<CartItemDTO> items) {
        return items.stream()
                .map(CartItemDTO::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calculatePrice(BigDecimal basePrice, String offerType) {
        return switch (offerType.toUpperCase()) {
            case "DUO" -> basePrice.multiply(BigDecimal.valueOf(1.9));
            case "FAMILLE" -> basePrice.multiply(BigDecimal.valueOf(3.5));
            default -> basePrice;
        };
    }

    private Cart createNewCart(Long userId) {
        OurUsers user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Utilisateur non trouvé"));

        Cart cart = new Cart();
        cart.setUser(user);
        cart.setActive(true);
        cart.setStatus(CartStatus.ACTIVE);
        return cartRepository.save(cart);
    }
}