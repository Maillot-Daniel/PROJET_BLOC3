package com.olympics.tickets.backend.service;

import com.olympics.tickets.backend.entity.OfferType;
import com.olympics.tickets.backend.repository.OfferTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class OfferTypeService {

    @Autowired
    private OfferTypeRepository offerTypeRepository;

    public List<OfferType> getAllOfferTypes() {
        return offerTypeRepository.findAll();
    }

    public Optional<OfferType> getOfferTypeById(Integer id) {
        return offerTypeRepository.findById(id);
    }

    public OfferType createOfferType(OfferType offerType) {
        if (offerTypeRepository.existsByName(offerType.getName())) {
            throw new RuntimeException("Une offre avec ce nom existe déjà");
        }
        return offerTypeRepository.save(offerType);
    }

    public OfferType updateOfferType(Integer id, OfferType offerTypeDetails) {
        OfferType offerType = offerTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Offre non trouvée avec l'id: " + id));

        offerType.setName(offerTypeDetails.getName());
        return offerTypeRepository.save(offerType);
    }

    public void deleteOfferType(Integer id) {
        OfferType offerType = offerTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Offre non trouvée avec l'id: " + id));
        offerTypeRepository.delete(offerType);
    }
}