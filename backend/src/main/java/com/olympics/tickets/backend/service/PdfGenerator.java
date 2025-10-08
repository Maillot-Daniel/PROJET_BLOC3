package com.olympics.tickets.backend.service;

import com.olympics.tickets.backend.entity.Event;
import com.olympics.tickets.backend.entity.OurUsers;
import com.olympics.tickets.backend.entity.Ticket;
import org.springframework.stereotype.Component;

@Component
public class PdfGenerator {

    // Exemple simple : retourne un tableau vide pour compiler
    // À remplacer par ton vrai générateur PDF (iText, Apache PDFBox, etc.)
    public byte[] generateTicketPdf(Ticket ticket, Event event, OurUsers user) {
        // Implémentation réelle pour créer le PDF du ticket
        return new byte[0];
    }
}
