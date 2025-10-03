package com.olympics.tickets.backend.service;

import com.olympics.tickets.backend.entity.*;
import com.olympics.tickets.backend.repository.*;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.annotation.PostConstruct;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final CartRepository cartRepository;
    private final TicketRepository ticketRepository;
    private final UsersRepo userRepository;
    private final EventRepository eventRepository;
    private final EmailService emailService;

    @Value("${stripe.secret-key}")
    private String stripeApiKey;

    @Value("${frontend.success-url}")
    private String successUrl;

    @Value("${frontend.cancel-url}")
    private String cancelUrl;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeApiKey;
    }

    public String createCheckoutSession(Long cartId) throws StripeException {
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new RuntimeException("Panier non trouvé"));

        SessionCreateParams.Builder paramsBuilder = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(successUrl + "?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(cancelUrl)
                .setClientReferenceId(cartId.toString())
                .setCustomerEmail(cart.getUser().getEmail());

        for (CartItem item : cart.getItems()) {
            paramsBuilder.addLineItem(
                    SessionCreateParams.LineItem.builder()
                            .setQuantity((long) item.getQuantity())
                            .setPriceData(
                                    SessionCreateParams.LineItem.PriceData.builder()
                                            .setCurrency("eur")
                                            .setUnitAmount(item.getUnitPrice().multiply(BigDecimal.valueOf(100)).longValue())
                                            .setProductData(
                                                    SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                            .setName(buildProductName(item))
                                                            .build())
                                            .build())
                            .build());
        }

        Session session = Session.create(paramsBuilder.build());
        return session.getId();
    }

    private String buildProductName(CartItem item) {
        return item.getEvent().getTitle() + " (" + item.getOfferType().getName() + ")";
    }

    @Transactional
    public void handlePaymentSuccess(String sessionId) throws StripeException {
        Session session = Session.retrieve(sessionId);
        Long cartId = Long.parseLong(session.getClientReferenceId());

        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new RuntimeException("Panier non trouvé"));

        List<Ticket> tickets = new ArrayList<>();
        for (CartItem item : cart.getItems()) {
            Event event = item.getEvent();
            OfferType offerType = item.getOfferType();
            Integer quantity = item.getQuantity();

            for (int i = 0; i < quantity; i++) {
                Ticket ticket = new Ticket();
                ticket.setUser(cart.getUser());
                ticket.setEvent(event);
                ticket.setOfferType(offerType);
                ticket.setQuantity(1);
                ticket.setPrice(item.getUnitPrice());
                ticket.setTicketNumber(UUID.randomUUID().toString());
                ticket.setQrCodeUrl(generateQrCode(ticket.getTicketNumber()));
                ticket.setPurchaseDate(LocalDateTime.now());
                ticket.setValidated(false);

                tickets.add(ticket);
            }

            event.setRemainingTickets(event.getRemainingTickets() - quantity);
            eventRepository.save(event);
        }

        ticketRepository.saveAll(tickets);
        cart.setActive(false);
        cartRepository.save(cart);
        emailService.sendTicketsEmail(cart.getUser().getEmail(), tickets);
    }

    private String generateQrCode(String data) {
        return "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + data;
    }
}