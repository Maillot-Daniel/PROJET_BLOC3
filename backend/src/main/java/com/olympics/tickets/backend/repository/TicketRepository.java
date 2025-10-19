package com.olympics.tickets.backend.repository;

import com.olympics.tickets.backend.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    // MÉTHODES DE BASE
    List<Ticket> findByUserId(Long userId);
    List<Ticket> findByUserIdAndValidatedFalse(Long userId);
    List<Ticket> findByUserIdAndUsedFalse(Long userId);
    Optional<Ticket> findByPrimaryKey(String primaryKey);
    Optional<Ticket> findByHashedKey(String hashedKey);
    Optional<Ticket> findByTicketNumber(String ticketNumber);

    // ✅ AJOUT: MÉTHODES MANQUANTES POUR LES STATISTIQUES
    long countByValidatedTrue();
    long countByUsedTrue();

    // COMPTAGES
    Long countByUsedTrueAndUsedAtAfter(LocalDateTime date);
    Long countByUsedTrueAndUsedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.used = true AND FUNCTION('DATE', t.usedAt) = CURRENT_DATE")
    Long countUsedToday();

    // STATISTIQUES FINANCIÈRES (RETOURNENT BigDecimal)
    @Query("SELECT COALESCE(SUM(t.price), 0) FROM Ticket t WHERE t.used = true AND t.usedAt >= :date")
    BigDecimal sumPriceByUsedTrueAndUsedAtAfter(@Param("date") LocalDateTime date);

    @Query("SELECT COALESCE(SUM(t.price), 0) FROM Ticket t WHERE t.used = true AND t.usedAt BETWEEN :start AND :end")
    BigDecimal sumPriceByUsedTrueAndUsedAtBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COALESCE(SUM(t.price), 0) FROM Ticket t WHERE t.used = true AND FUNCTION('DATE', t.usedAt) = CURRENT_DATE")
    BigDecimal getDailyRevenue();

    // RECHERCHES PAR ÉVÉNEMENT
    List<Ticket> findByEventId(Long eventId);
    List<Ticket> findByEventIdAndUsedTrue(Long eventId);
    List<Ticket> findByEventIdAndUsedFalse(Long eventId);

    // RECHERCHES PAR TYPE D'OFFRE
    @Query("SELECT t FROM Ticket t WHERE t.offerTypeId = :offerTypeId")
    List<Ticket> findByOfferTypeId(@Param("offerTypeId") Long offerTypeId);

    // **NOUVELLE MÉTHODE : ventes par offre**
    @Query("SELECT t.offerTypeId, COUNT(t) " +
            "FROM Ticket t " +
            "WHERE t.used = true " +
            "GROUP BY t.offerTypeId")
    List<Object[]> countSalesGroupedByOffer();

    // TICKETS EXPIRÉS
    @Query("SELECT t FROM Ticket t WHERE t.purchaseDate < :expiryDate AND t.used = false")
    List<Ticket> findExpiredTickets(@Param("expiryDate") LocalDateTime expiryDate);

    @Query("SELECT t FROM Ticket t WHERE t.eventId IN (SELECT e.id FROM Event e WHERE e.date < CURRENT_TIMESTAMP) AND t.used = false")
    List<Ticket> findTicketsForPastEvents();

    // STATISTIQUES
    @Query("SELECT t.eventId, COUNT(t), COALESCE(SUM(t.price), 0) " +
            "FROM Ticket t WHERE t.used = true AND t.usedAt BETWEEN :start AND :end " +
            "GROUP BY t.eventId")
    List<Object[]> getEventUsageStatistics(@Param("start") LocalDateTime start,
                                           @Param("end") LocalDateTime end);

    // TRI
    List<Ticket> findByUserIdOrderByPurchaseDateDesc(Long userId);
    List<Ticket> findByUsedTrueOrderByUsedAtDesc();

    // VÉRIFICATIONS D'EXISTENCE
    boolean existsByTicketNumber(String ticketNumber);
    boolean existsByPrimaryKey(String primaryKey);
    boolean existsByHashedKey(String hashedKey);

    // NETTOYAGE
    @Modifying
    @Query("DELETE FROM Ticket t WHERE t.purchaseDate < :expiryDate AND t.used = false")
    void deleteExpiredUnusedTickets(@Param("expiryDate") LocalDateTime expiryDate);

    // DIAGNOSTIC
    @Query("SELECT t FROM Ticket t WHERE t.eventId IS NULL OR t.userId IS NULL OR t.offerTypeId IS NULL")
    List<Ticket> findIncompleteTickets();

    // COMPTAGE TOTAL (pour debug)
    @Query("SELECT COUNT(t) FROM Ticket t")
    long countAllTickets();
}