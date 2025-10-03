package com.olympics.tickets.backend.dto;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.ObjectCodec;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

@Data
public class CartRequest {
    @NotNull(message = "La liste des articles ne peut pas être nulle")
    @NotEmpty(message = "Le panier ne peut pas être vide")
    @JsonDeserialize(using = CartItemDeserializer.class)
    private List<@Valid CartItemDTO> cartItems;

    @Email(message = "L'email doit être valide")
    private String customerEmail;

    /**
     * Vérifie si le panier est valide
     * @return true si tous les articles sont valides
     */
    public boolean isValid() {
        if (cartItems == null) {
            return false;
        }
        return cartItems.stream()
                .filter(Objects::nonNull)
                .allMatch(CartItemDTO::isTotalPriceValid);
    }

    public static class CartItemDeserializer extends JsonDeserializer<List<CartItemDTO>> {
        @Override
        public List<CartItemDTO> deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
            ObjectCodec codec = p.getCodec();
            JsonNode node = codec.readTree(p);

            if (node.isNull() || node.isEmpty()) {
                return Collections.emptyList();
            }

            try {
                if (node.isArray()) {
                    return codec.readValue(codec.treeAsTokens(node),
                            new TypeReference<List<CartItemDTO>>(){});
                } else if (node.isObject()) {
                    CartItemDTO singleItem = codec.treeToValue(node, CartItemDTO.class);
                    return singleItem != null ? List.of(singleItem) : Collections.emptyList();
                }
            } catch (Exception e) {
                throw new IOException("Erreur de désérialisation des articles du panier", e);
            }

            return Collections.emptyList();
        }
    }
}