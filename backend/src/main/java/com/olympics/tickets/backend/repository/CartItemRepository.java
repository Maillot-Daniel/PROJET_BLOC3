package com.olympics.tickets.backend.repository;

import com.olympics.tickets.backend.entity.CartItem;
import com.olympics.tickets.backend.entity.OurUsers;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findByUser(OurUsers user);
}
