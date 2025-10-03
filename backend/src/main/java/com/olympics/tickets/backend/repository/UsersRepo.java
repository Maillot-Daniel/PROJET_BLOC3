package com.olympics.tickets.backend.repository;

import com.olympics.tickets.backend.entity.OurUsers;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsersRepo extends JpaRepository<OurUsers, Long> {

    Optional<OurUsers> findByEmail(String email);
}