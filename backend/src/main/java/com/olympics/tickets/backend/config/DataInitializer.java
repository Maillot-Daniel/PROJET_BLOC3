package com.olympics.tickets.backend.config;

import com.olympics.tickets.backend.entity.OfferType;
import com.olympics.tickets.backend.repository.OfferTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final OfferTypeRepository offerTypeRepository;

    @Override
    public void run(String... args) throws Exception {
        // Initialisation des types d'offre
        if (offerTypeRepository.count() == 0) {
            OfferType solo = new OfferType(1, "SOLO");
            OfferType duo = new OfferType(2, "DUO");
            OfferType famille = new OfferType(3, "FAMILLE");

            offerTypeRepository.save(solo);
            offerTypeRepository.save(duo);
            offerTypeRepository.save(famille);

            System.out.println("Types d'offre initialisés avec succès");
        }
    }
}