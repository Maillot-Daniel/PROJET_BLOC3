package com.olympics.tickets.backend.service;

import com.olympics.tickets.backend.entity.Ticket;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final EmailService emailService;

    // Exemple de méthode pour envoyer les tickets après paiement
    public void sendTicketsToUser(String email, List<Ticket> tickets) {
        emailService.sendTicketsEmail(email, tickets);
    }
}
