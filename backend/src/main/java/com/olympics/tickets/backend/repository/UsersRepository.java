package com.olympics.tickets.backend.repository;

import com.olympics.tickets.backend.entity.OurUsers;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsersRepository extends JpaRepository<OurUsers, Long> {
    Optional<OurUsers> findByEmail(String email);
}