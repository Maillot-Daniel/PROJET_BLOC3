package com.olympics.tickets.backend.repository;

import com.olympics.tickets.backend.model.OfferType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OfferTypeRepository extends JpaRepository<OfferType, Long> {
}
