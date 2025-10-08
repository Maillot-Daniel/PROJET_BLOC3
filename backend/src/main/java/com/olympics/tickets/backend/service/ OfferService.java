package com.olympics.tickets.backend.service;

import com.olympics.tickets.backend.model.OfferType;
import com.olympics.tickets.backend.repository.OfferTypeRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class OfferService {

    private final OfferTypeRepository offerTypeRepository;

    public OfferService(OfferTypeRepository offerTypeRepository) {
        this.offerTypeRepository = offerTypeRepository;
    }

    public List<OfferType> getAllOfferTypes() {
        return offerTypeRepository.findAll();
    }
}
