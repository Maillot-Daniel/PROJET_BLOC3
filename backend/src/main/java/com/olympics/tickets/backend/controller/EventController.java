package com.olympics.tickets.backend.controller;

import com.olympics.tickets.backend.entity.Event;
import com.olympics.tickets.backend.service.EventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventService eventService;

    @Autowired
    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    // Récupère tous les événements avec pagination
    @GetMapping
    public ResponseEntity<Page<Event>> getAllEvents(Pageable pageable) {
        Page<Event> events = eventService.getAllEvents(pageable);  // Passez pageable à la méthode service
        return ResponseEntity.ok(events);
    }

    // Récupère un événement par son ID
    @GetMapping("/{id}")
    public ResponseEntity<Event> getEventById(@PathVariable Long id) {
        Event event = eventService.getEventById(id);
        return ResponseEntity.ok(event);
    }

    // Crée un événement (seulement pour les admins)
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Event> createEvent(@RequestBody Event event) {
        Event createdEvent = eventService.createEvent(event);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdEvent);
    }

    // Met à jour un événement (seulement pour les admins)
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Event> updateEvent(@PathVariable Long id, @RequestBody Event updatedEvent) {
        Event event = eventService.updateEvent(id, updatedEvent);
        return ResponseEntity.ok(event);
    }

    // Supprime un événement (seulement pour les admins)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id) {
        eventService.deleteEvent(id);
        return ResponseEntity.noContent().build();
    }

    // Controller - EventController.java
    @GetMapping("/low-availability")
    public ResponseEntity<Page<Event>> getEventsWithLowTickets(@RequestParam(defaultValue = "10") int threshold, Pageable pageable) {
        Page<Event> events = eventService.getEventsWithLowTickets(threshold, pageable);
        return ResponseEntity.ok(events);
    }
}
