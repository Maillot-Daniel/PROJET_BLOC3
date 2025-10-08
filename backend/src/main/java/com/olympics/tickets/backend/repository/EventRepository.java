package com.olympics.tickets.backend.repository;

import com.olympics.tickets.backend.entity.Event;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Event findById(long id);

    Page<Event> findByRemainingTicketsGreaterThanAndDateAfter(int remainingTickets, LocalDateTime date, Pageable pageable);

    @Query("SELECT e FROM Event e WHERE e.remainingTickets <= :threshold AND e.remainingTickets > 0")
    Page<Event> findAlmostSoldOutEvents(@Param("threshold") int threshold, Pageable pageable);
}