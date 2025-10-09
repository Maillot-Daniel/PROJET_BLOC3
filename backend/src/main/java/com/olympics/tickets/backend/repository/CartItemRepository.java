package com.olympics.tickets.backend.repository;

import com.olympics.tickets.backend.entity.CartItem;
import com.olympics.tickets.backend.entity.OurUsers;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findByUser(OurUsers user);
}