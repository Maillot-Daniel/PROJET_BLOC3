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

    // ✅ MÉTHODE AJOUTÉE POUR DEBUG
    @Query("SELECT COUNT(t) FROM Ticket t")
    long count();

    // MÉTHODES EXISTANTES
    List<Ticket> findByUser(OurUsers user);
    List<Ticket> findByUserAndValidatedFalse(OurUsers user);
    List<Ticket> findByUserAndUsedFalse(OurUsers user);
    Optional<Ticket> findByPrimaryKey(String primaryKey);
    Optional<Ticket> findByHashedKey(String hashedKey);
    Optional<Ticket> findByTicketNumber(String ticketNumber);
    Long countByUsedTrueAndUsedAtAfter(LocalDateTime date);
    Long countByUsedTrueAndUsedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.used = true AND DATE(t.usedAt) = CURRENT_DATE")
    Long countUsedToday();

    @Query("SELECT SUM(t.price) FROM Ticket t WHERE t.used = true AND t.usedAt >= :date")
    Double sumPriceByUsedTrueAndUsedAtAfter(@Param("date") LocalDateTime date);

    @Query("SELECT SUM(t.price) FROM Ticket t WHERE t.used = true AND t.usedAt BETWEEN :start AND :end")
    Double sumPriceByUsedTrueAndUsedAtBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT SUM(t.price) FROM Ticket t WHERE t.used = true AND DATE(t.usedAt) = CURRENT_DATE")
    Double getDailyRevenue();

    List<Ticket> findByEventId(Long eventId);
    List<Ticket> findByEventIdAndUsedTrue(Long eventId);
    List<Ticket> findByEventIdAndUsedFalse(Long eventId);
    List<Ticket> findByOfferTypeId(Integer offerTypeId);

    @Query("SELECT t FROM Ticket t WHERE t.purchaseDate < :expiryDate AND t.used = false")
    List<Ticket> findExpiredTickets(@Param("expiryDate") LocalDateTime expiryDate);

    @Query("SELECT t FROM Ticket t WHERE t.event.date < CURRENT_TIMESTAMP AND t.used = false")
    List<Ticket> findTicketsForPastEvents();

    @Query("SELECT t.event.id, t.event.title, COUNT(t), SUM(t.price) " +
            "FROM Ticket t WHERE t.used = true AND t.usedAt BETWEEN :start AND :end " +
            "GROUP BY t.event.id, t.event.title")
    List<Object[]> getEventUsageStatistics(@Param("start") LocalDateTime start,
                                           @Param("end") LocalDateTime end);

    @Query("SELECT t.offerType.name, COUNT(t), SUM(t.price) " +
            "FROM Ticket t WHERE t.used = true AND t.usedAt BETWEEN :start AND :end " +
            "GROUP BY t.offerType.name")
    List<Object[]> getOfferTypeStatistics(@Param("start") LocalDateTime start,
                                          @Param("end") LocalDateTime end);

    List<Ticket> findByUserOrderByPurchaseDateDesc(OurUsers user);
    List<Ticket> findByUsedTrueOrderByUsedAtDesc();
    boolean existsByTicketNumber(String ticketNumber);
    boolean existsByPrimaryKey(String primaryKey);
    boolean existsByHashedKey(String hashedKey);

    @Query("DELETE FROM Ticket t WHERE t.purchaseDate < :expiryDate AND t.used = false")
    void deleteExpiredUnusedTickets(@Param("expiryDate") LocalDateTime expiryDate);

    @Query("SELECT t FROM Ticket t WHERE t.event IS NULL OR t.user IS NULL")
    List<Ticket> findOrphanTickets();
}