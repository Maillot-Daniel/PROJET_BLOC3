package com.olympics.tickets.backend.repository;

import com.olympics.tickets.backend.entity.OfferType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OfferTypeRepository extends JpaRepository<OfferType, Integer> {
    // Méthodes personnalisées si nécessaire
    OfferType findByName(String name);
}