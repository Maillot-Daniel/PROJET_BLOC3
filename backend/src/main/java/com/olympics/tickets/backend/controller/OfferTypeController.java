package com.olympics.tickets.backend.controller;

import com.olympics.tickets.backend.entity.OfferType;
import com.olympics.tickets.backend.service.OfferTypeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/offer_types")
@CrossOrigin(origins = {"http://localhost:3000", "https://votre-frontend.vercel.app"})
public class OfferTypeController {

    @Autowired
    private OfferTypeService offerTypeService;

    // GET /api/offer_types
    @GetMapping
    public ResponseEntity<List<OfferType>> getAllOfferTypes() {
        List<OfferType> offers = offerTypeService.getAllOfferTypes();
        return ResponseEntity.ok(offers);
    }

    // GET /api/offer_types/{id}
    @GetMapping("/{id}")
    public ResponseEntity<OfferType> getOfferTypeById(@PathVariable Integer id) {
        OfferType offer = offerTypeService.getOfferTypeById(id)
                .orElseThrow(() -> new RuntimeException("Offre non trouvée avec l'id: " + id));
        return ResponseEntity.ok(offer);
    }

    // POST /api/offer_types
    @PostMapping
    public ResponseEntity<OfferType> createOfferType(@RequestBody OfferType offerType) {
        OfferType createdOffer = offerTypeService.createOfferType(offerType);
        return ResponseEntity.ok(createdOffer);
    }

    // PUT /api/offer_types/{id}
    @PutMapping("/{id}")
    public ResponseEntity<OfferType> updateOfferType(@PathVariable Integer id, @RequestBody OfferType offerTypeDetails) {
        OfferType updatedOffer = offerTypeService.updateOfferType(id, offerTypeDetails);
        return ResponseEntity.ok(updatedOffer);
    }

    // DELETE /api/offer_types/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOfferType(@PathVariable Integer id) {
        offerTypeService.deleteOfferType(id);
        return ResponseEntity.ok().build();
    }
}