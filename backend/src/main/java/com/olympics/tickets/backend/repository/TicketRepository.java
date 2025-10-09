package com.olympics.tickets.backend.repository;

import com.olympics.tickets.backend.entity.OurUsers;
import com.olympics.tickets.backend.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    List<Ticket> findByUser(OurUsers user);
}