package com.olympics.tickets.backend.repository;

import com.olympics.tickets.backend.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    // Trouver tous les tickets d'un utilisateur
    List<Ticket> findByUserId(Long userId);

    // Trouver les tickets pour un événement spécifique
    List<Ticket> findByEventId(Long eventId);

    // Trouver les tickets d'un utilisateur pour un événement donné
    List<Ticket> findByUserIdAndEventId(Long userId, Long eventId);

    // Supprimer les tickets d'un utilisateur pour un événement
    void deleteByUserIdAndEventId(Long userId, Long eventId);
}