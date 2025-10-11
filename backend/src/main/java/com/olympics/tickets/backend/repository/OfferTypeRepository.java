package com.olympics.tickets.backend.repository;

import com.olympics.tickets.backend.entity.OfferType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OfferTypeRepository extends JpaRepository<OfferType, Integer> {
    boolean existsByName(String name);
    OfferType findByName(String name);
}