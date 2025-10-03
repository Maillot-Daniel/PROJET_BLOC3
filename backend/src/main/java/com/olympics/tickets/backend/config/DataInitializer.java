package com.olympics.tickets.backend.config;

import com.olympics.tickets.backend.entity.OfferType;
import com.olympics.tickets.backend.repository.OfferTypeRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer {

    private final OfferTypeRepository offerTypeRepository;

    public DataInitializer(OfferTypeRepository offerTypeRepository) {
        this.offerTypeRepository = offerTypeRepository;
    }

    @PostConstruct
    public void init() {
        // Vérifie si les données existent déjà
        if (offerTypeRepository.count() == 0) {
            offerTypeRepository.save(new OfferType(1, "SOLO"));
            offerTypeRepository.save(new OfferType(2, "DUO"));
            offerTypeRepository.save(new OfferType(3, "FAMILLE"));
        }
    }
}