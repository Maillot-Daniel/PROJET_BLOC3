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

    // MÉTHODES EXISTANTES (rétrocompatibilité)

    /**
     * Trouve tous les tickets d'un utilisateur
     */
    List<Ticket> findByUser(OurUsers user);

    /**
     * Trouve les tickets non validés d'un utilisateur (ancien système)
     */
    List<Ticket> findByUserAndValidatedFalse(OurUsers user);

    /**
     * Trouve les tickets non utilisés d'un utilisateur (nouveau système)
     */
    List<Ticket> findByUserAndUsedFalse(OurUsers user);

    // NOUVELLES MÉTHODES POUR LA SÉCURITÉ

    /**
     * Trouve un ticket par sa clé primaire (pour la validation QR)
     */
    Optional<Ticket> findByPrimaryKey(String primaryKey);

    /**
     * Trouve un ticket par sa clé hashée (pour vérification d'intégrité)
     */
    Optional<Ticket> findByHashedKey(String hashedKey);

    /**
     * Trouve un ticket par son numéro de ticket
     */
    Optional<Ticket> findByTicketNumber(String ticketNumber);

    // MÉTHODES POUR LES STATISTIQUES ADMIN

    /**
     * Compte les tickets utilisés après une date donnée
     */
    Long countByUsedTrueAndUsedAtAfter(LocalDateTime date);

    /**
     * Compte les tickets utilisés entre deux dates
     */
    Long countByUsedTrueAndUsedAtBetween(LocalDateTime start, LocalDateTime end);

    /**
     * Compte les tickets utilisés aujourd'hui
     */
    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.used = true AND DATE(t.usedAt) = CURRENT_DATE")
    Long countUsedToday();

    /**
     * Somme des prix des tickets utilisés après une date donnée
     */
    @Query("SELECT SUM(t.price) FROM Ticket t WHERE t.used = true AND t.usedAt >= :date")
    Double sumPriceByUsedTrueAndUsedAtAfter(@Param("date") LocalDateTime date);

    /**
     * Somme des prix des tickets utilisés entre deux dates
     */
    @Query("SELECT SUM(t.price) FROM Ticket t WHERE t.used = true AND t.usedAt BETWEEN :start AND :end")
    Double sumPriceByUsedTrueAndUsedAtBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /**
     * Chiffre d'affaires du jour
     */
    @Query("SELECT SUM(t.price) FROM Ticket t WHERE t.used = true AND DATE(t.usedAt) = CURRENT_DATE")
    Double getDailyRevenue();

    // MÉTHODES POUR LA RECHERCHE ET FILTRES

    /**
     * Trouve les tickets par événement
     */
    List<Ticket> findByEventId(Long eventId);

    /**
     * Trouve les tickets utilisés par événement
     */
    List<Ticket> findByEventIdAndUsedTrue(Long eventId);

    /**
     * Trouve les tickets non utilisés par événement
     */
    List<Ticket> findByEventIdAndUsedFalse(Long eventId);

    /**
     * Trouve les tickets par type d'offre
     */
    List<Ticket> findByOfferTypeId(Integer offerTypeId);

    /**
     * Trouve les tickets expirés (achetés il y a plus d'un mois)
     */
    @Query("SELECT t FROM Ticket t WHERE t.purchaseDate < :expiryDate AND t.used = false")
    List<Ticket> findExpiredTickets(@Param("expiryDate") LocalDateTime expiryDate);

    /**
     * Trouve les tickets pour des événements passés
     */
    @Query("SELECT t FROM Ticket t WHERE t.event.date < CURRENT_TIMESTAMP AND t.used = false")
    List<Ticket> findTicketsForPastEvents();

    // MÉTHODES POUR LES RAPPORTS AVANCÉS

    /**
     * Statistiques d'utilisation par événement
     */
    @Query("SELECT t.event.id, t.event.title, COUNT(t), SUM(t.price) " +
            "FROM Ticket t WHERE t.used = true AND t.usedAt BETWEEN :start AND :end " +
            "GROUP BY t.event.id, t.event.title")
    List<Object[]> getEventUsageStatistics(@Param("start") LocalDateTime start,
                                           @Param("end") LocalDateTime end);

    /**
     * Statistiques d'utilisation par type d'offre
     */
    @Query("SELECT t.offerType.name, COUNT(t), SUM(t.price) " +
            "FROM Ticket t WHERE t.used = true AND t.usedAt BETWEEN :start AND :end " +
            "GROUP BY t.offerType.name")
    List<Object[]> getOfferTypeStatistics(@Param("start") LocalDateTime start,
                                          @Param("end") LocalDateTime end);

    /**
     * Tickets les plus récents pour un utilisateur
     */
    List<Ticket> findByUserOrderByPurchaseDateDesc(OurUsers user);

    /**
     * Tickets utilisés les plus récents
     */
    List<Ticket> findByUsedTrueOrderByUsedAtDesc();

    // MÉTHODES DE VÉRIFICATION

    /**
     * Vérifie si un numéro de ticket existe déjà
     */
    boolean existsByTicketNumber(String ticketNumber);

    /**
     * Vérifie si une clé primaire existe déjà
     */
    boolean existsByPrimaryKey(String primaryKey);

    /**
     * Vérifie si un hash existe déjà (très improbable mais sécurité)
     */
    boolean existsByHashedKey(String hashedKey);

    // MÉTHODES DE SUPPRESSION ET NETTOYAGE

    /**
     * Supprime les tickets expirés et non utilisés
     */
    @Query("DELETE FROM Ticket t WHERE t.purchaseDate < :expiryDate AND t.used = false")
    void deleteExpiredUnusedTickets(@Param("expiryDate") LocalDateTime expiryDate);

    /**
     * Trouve les tickets orphelins (sans événement ou utilisateur)
     */
    @Query("SELECT t FROM Ticket t WHERE t.event IS NULL OR t.user IS NULL")
    List<Ticket> findOrphanTickets();
}