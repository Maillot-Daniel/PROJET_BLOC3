package com.olympics.tickets.backend.service;

import com.olympics.tickets.backend.entity.Event;
import com.olympics.tickets.backend.exception.EventNotFoundException;
import java.math.BigDecimal;
import com.olympics.tickets.backend.repository.EventRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class EventService {

    private final EventRepository eventRepository;

    public EventService(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    // Récupère les événements disponibles paginés
    @Transactional(readOnly = true)
    public Page<Event> getAvailableEvents(Pageable pageable) {
        return eventRepository.findByRemainingTicketsGreaterThanAndDateAfter(0, LocalDateTime.now(), pageable);
    }

    // Récupère tous les événements paginés
    @Transactional(readOnly = true)
    public Page<Event> getAllEvents(Pageable pageable) {
        return eventRepository.findAll(pageable);
    }

    // Création d'un événement avec validation
    @Transactional
    public Event createEvent(Event event) {
        validateEvent(event);
        event.setRemainingTickets(event.getTotalTickets()); // Initialise les tickets restants
        return eventRepository.save(event);
    }

    // Suppression avec vérification d'existence
    @Transactional
    public void deleteEvent(Long id) {
        if (!eventRepository.existsById(id)) {
            throw new EventNotFoundException("Event with id " + id + " not found.");
        }
        eventRepository.deleteById(id);
    }

    // Récupération d'un événement par son ID
    @Transactional(readOnly = true)
    public Event getEventById(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new EventNotFoundException("Event with id " + id + " not found."));
    }

    // Mise à jour d'un événement
    @Transactional
    public Event updateEvent(Long id, Event eventDetails) {
        Event event = getEventById(id);

        // Validation des données de l'événement
        validateEvent(eventDetails);

        event.setTitle(eventDetails.getTitle());
        event.setDescription(eventDetails.getDescription());
        event.setDate(eventDetails.getDate());
        event.setLocation(eventDetails.getLocation());
        event.setPrice(eventDetails.getPrice());

        // Mise à jour des tickets totaux et restants
        if (eventDetails.getTotalTickets() != event.getTotalTickets()) {
            int difference = eventDetails.getTotalTickets() - event.getTotalTickets();
            event.setTotalTickets(eventDetails.getTotalTickets());
            event.setRemainingTickets(event.getRemainingTickets() + difference);
        }

        return eventRepository.save(event);
    }

    // Récupère les événements presque complets avec un seuil
    @Transactional(readOnly = true)
    public Page<Event> getEventsWithLowTickets(int threshold, Pageable pageable) {
        return eventRepository.findAlmostSoldOutEvents(threshold, pageable);
    }

    // Validation des données de l'événement
    private void validateEvent(Event event) {
        if (event.getTitle() == null || event.getTitle().isBlank()) {
            throw new IllegalArgumentException("Event title is required");
        }

        if (event.getDate() == null || event.getDate().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Event date must be in the future");
        }

        if (event.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Price must be greater than zero");
        }

        if (event.getTotalTickets() <= 0) {
            throw new IllegalArgumentException("Total tickets must be positive");
        }
    }
}
