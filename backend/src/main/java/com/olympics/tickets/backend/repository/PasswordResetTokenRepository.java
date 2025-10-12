package com.olympics.tickets.backend.repository;

import com.olympics.tickets.backend.entity.OurUsers;
import com.olympics.tickets.backend.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    PasswordResetToken findByToken(String token);
    void deleteByUser(OurUsers user);

    @Modifying
    @Query("DELETE FROM PasswordResetToken t WHERE t.expiryDate <= :now")
    void deleteAllExpiredSince(@Param("now") Date now);
}