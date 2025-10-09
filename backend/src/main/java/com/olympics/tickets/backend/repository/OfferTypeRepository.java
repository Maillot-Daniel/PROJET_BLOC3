package com.olympics.tickets.backend.repository;

import com.olympics.tickets.backend.entity.OfferType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OfferTypeRepository extends JpaRepository<OfferType, Integer> {
    Optional<OfferType> findByName(String name);
}