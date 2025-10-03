package com.olympics.tickets.backend.repository;

import com.olympics.tickets.backend.entity.Event;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.Optional; // Ajouter cet import pour Optional

public interface EventRepository extends JpaRepository<Event, Long> {

    // Récupère les événements paginés triés par date
    Page<Event> findAllByOrderByDateAsc(Pageable pageable);

    // Récupère les événements avec tickets restants et date après
    Page<Event> findByRemainingTicketsGreaterThanAndDateAfter(int remaining, LocalDateTime date, Pageable pageable);

    // Récupère les événements presque complets
    @Query("SELECT e FROM Event e WHERE e.remainingTickets <= :threshold AND e.remainingTickets > 0")
    Page<Event> findAlmostSoldOutEvents(int threshold, Pageable pageable);

    // Recherche d'événements avec des filtres
    @Query("SELECT e FROM Event e WHERE " +
            "(LOWER(e.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(e.description) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
            "(:location IS NULL OR LOWER(e.location) = LOWER(:location)) AND " +
            "e.date BETWEEN :startDate AND :endDate AND e.remainingTickets > 0")
    Page<Event> searchEvents(String keyword, String location, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    // Récupère un événement avec tickets disponibles
    @Query("SELECT e FROM Event e WHERE e.id = :id AND e.remainingTickets > 0 AND e.date > CURRENT_TIMESTAMP")
    Optional<Event> findAvailableById(Long id);  // Utilisation d'Optional

    // Réserve des tickets (diminue les tickets restants)
    @Query("UPDATE Event e SET e.remainingTickets = e.remainingTickets - :quantity WHERE e.id = :id AND e.remainingTickets >= :quantity")
    int reserveTickets(Long id, int quantity);

    // Libère des tickets (augmente les tickets restants)
    @Query("UPDATE Event e SET e.remainingTickets = e.remainingTickets + :quantity WHERE e.id = :id")
    int releaseTickets(Long id, int quantity);

    // Vérifie la disponibilité des tickets
    @Query("SELECT CASE WHEN COUNT(e) > 0 THEN TRUE ELSE FALSE END FROM Event e WHERE e.id = :id AND e.remainingTickets >= :quantity")
    Boolean checkTicketAvailability(Long id, int quantity);

    // Nouvelle méthode pour vérifier si suffisamment de tickets sont disponibles
    @Query("SELECT e.remainingTickets >= :quantity FROM Event e WHERE e.id = :id")
    boolean hasEnoughTickets(Long id, int quantity);
}
