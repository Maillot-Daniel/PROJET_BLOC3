package com.olympics.tickets.backend.service;

import com.olympics.tickets.backend.dto.EventSalesDTO;
import com.olympics.tickets.backend.entity.Order;
import com.olympics.tickets.backend.entity.OrderItem;
import com.olympics.tickets.backend.entity.OurUsers;
import com.olympics.tickets.backend.repository.OrderRepository;
import com.olympics.tickets.backend.repository.OrderItemRepository;
import com.olympics.tickets.backend.repository.UsersRepository;
import com.stripe.model.checkout.Session;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UsersRepository usersRepository;

    @Transactional
    public Order createOrderFromStripeSession(Session session, List<Map<String, Object>> cartItems) {
        log.info("🛒 Création de commande depuis Stripe: {}", session.getId());

        try {
            String customerEmail = session.getCustomerEmail();
            Optional<OurUsers> userOptional = usersRepository.findByEmail(customerEmail);

            if (userOptional.isEmpty()) {
                throw new RuntimeException("Utilisateur non trouvé: " + customerEmail);
            }
            OurUsers user = userOptional.get();

            Order order = Order.builder()
                    .user(user)
                    .totalPrice(BigDecimal.valueOf(session.getAmountTotal() / 100.0))
                    .createdAt(LocalDateTime.now())
                    .status("PAID")
                    .orderNumber("CMD-" + System.currentTimeMillis() + "-" + new Random().nextInt(1000))
                    .stripeSessionId(session.getId())
                    .customerEmail(customerEmail)
                    .build();

            Order savedOrder = orderRepository.save(order);
            createOrderItems(savedOrder.getId(), cartItems);

            log.info("✅ Commande créée: {} - {} articles - {}€",
                    savedOrder.getOrderNumber(), cartItems.size(), savedOrder.getTotalPrice());

            return savedOrder;

        } catch (Exception e) {
            log.error("❌ Erreur création commande: {}", e.getMessage());
            throw new RuntimeException("Erreur lors de la création de la commande", e);
        }
    }

    private void createOrderItems(Long orderId, List<Map<String, Object>> cartItems) {
        List<OrderItem> orderItems = new ArrayList<>();

        for (Map<String, Object> item : cartItems) {
            try {
                BigDecimal unitPrice = new BigDecimal(item.get("priceUnit").toString());
                Integer quantity = (Integer) item.get("quantity");
                BigDecimal totalPrice = unitPrice.multiply(BigDecimal.valueOf(quantity));

                OrderItem orderItem = OrderItem.builder()
                        .orderId(orderId)
                        .eventTitle((String) item.get("eventTitle"))
                        .offerTypeName((String) item.get("offerTypeName"))
                        .quantity(quantity)
                        .unitPrice(unitPrice)
                        .totalPrice(totalPrice)
                        .eventId(getLongValue(item.get("eventId")))
                        .offerTypeId(getLongValue(item.get("offerTypeId")))
                        .build();

                orderItems.add(orderItem);

            } catch (Exception e) {
                log.error("❌ Erreur création OrderItem: {}", e.getMessage());
            }
        }

        orderItemRepository.saveAll(orderItems);
        log.info("✅ {} OrderItems créés pour la commande {}", orderItems.size(), orderId);
    }

    private Long getLongValue(Object value) {
        if (value == null) return null;
        if (value instanceof Long) return (Long) value;
        if (value instanceof Integer) return ((Integer) value).longValue();
        if (value instanceof String) return Long.valueOf((String) value);
        return Long.valueOf(value.toString());
    }

    public Map<String, Object> getSalesStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalOrders", orderRepository.countPaidOrders());
        stats.put("totalRevenue", orderRepository.getTotalRevenue());
        stats.put("todayOrders", orderRepository.countPaidOrdersSince(LocalDateTime.now().minusDays(1)));
        return stats;
    }

    public List<EventSalesDTO> getSalesByOfferType() {
        List<Object[]> results = orderRepository.getSalesByOfferType();
        List<EventSalesDTO> sales = new ArrayList<>();

        for (Object[] result : results) {
            String offerTypeName = (String) result[0];
            Long count = ((Number) result[1]).longValue();
            Double revenue = ((BigDecimal) result[2]).doubleValue();

            sales.add(new EventSalesDTO(
                    null,
                    offerTypeName,
                    "Offre: " + offerTypeName,
                    count,
                    revenue,
                    revenue / count
            ));
        }

        return sales;
    }

    public List<Order> getRecentOrders(int limit) {
        List<Order> orders = orderRepository.findByStatusOrderByCreatedAtDesc("PAID");
        return orders.stream().limit(limit).collect(Collectors.toList());
    }
}