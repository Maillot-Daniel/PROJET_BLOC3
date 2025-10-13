package com.olympics.tickets.backend.repository;

import com.olympics.tickets.backend.entity.OurUsers;
import com.olympics.tickets.backend.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    // Méthodes existantes
    List<Ticket> findByUser(OurUsers user);

    // Nouvelles méthodes pour la sécurité
    Optional<Ticket> findByHashedKey(String hashedKey);
    Optional<Ticket> findByTicketKey(String ticketKey);

    // Pour les statistiques admin
    Long countByUsedTrueAndUsedAtAfter(LocalDateTime date);

    @Query("SELECT SUM(t.price) FROM Ticket t WHERE t.used = true AND t.usedAt >= :date")
    Double sumPriceByUsedTrueAndUsedAtAfter(@Param("date") LocalDateTime date);

    // Tickets non utilisés pour un utilisateur
    List<Ticket> findByUserAndUsedFalse(OurUsers user);

    // Compatibilité avec l'ancien système
    List<Ticket> findByUserAndValidatedFalse(OurUsers user);
}