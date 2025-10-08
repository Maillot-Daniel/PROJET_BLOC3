package com.olympics.tickets.backend.controller;

import com.olympics.tickets.backend.model.OfferType;
import com.olympics.tickets.backend.service.OfferService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/offer_types")
@CrossOrigin(origins = "${FRONTEND_URL}", allowCredentials = "true")
public class OfferController {

    private final OfferService offerService;

    public OfferController(OfferService offerService) {
        this.offerService = offerService;
    }

    @GetMapping
    public List<OfferType> getAllOfferTypes() {
        return offerService.getAllOfferTypes();
    }
}
