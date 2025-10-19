package com.olympics.tickets.backend.repository;

import com.olympics.tickets.backend.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByUserId(Long userId);
    List<Order> findByStatus(String status);
    Optional<Order> findByStripeSessionId(String stripeSessionId);

    // ✅ MÉTHODES AJOUTÉES
    @Query("SELECT COUNT(o) FROM Order o WHERE o.status = 'PAID'")
    Long countPaidOrders();

    @Query("SELECT COALESCE(SUM(o.totalPrice), 0) FROM Order o WHERE o.status = 'PAID'")
    BigDecimal getTotalRevenue();

    @Query("SELECT COUNT(o) FROM Order o WHERE o.status = 'PAID' AND o.createdAt >= :date")
    Long countPaidOrdersSince(@Param("date") LocalDateTime date);

    @Query("SELECT oi.offerTypeName, SUM(oi.quantity), SUM(oi.totalPrice) " +
            "FROM OrderItem oi " +
            "JOIN oi.order o " +
            "WHERE o.status = 'PAID' " +
            "GROUP BY oi.offerTypeName")
    List<Object[]> getSalesByOfferType();

    List<Order> findByStatusOrderByCreatedAtDesc(String status);
}