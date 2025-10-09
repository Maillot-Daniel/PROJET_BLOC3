@Transactional
public void processSuccessfulPayment(Session session) throws Exception {
    String customerEmail = session.getCustomerEmail();
    String sessionId = session.getId();

    // TODO: Récupérer les infos du panier liées au sessionId ou stockées en base
    // Exemple fictif : getCartItemsFromSessionId(sessionId)
    List<CartItem> cartItems = getCartItemsFromSessionId(sessionId);

    for (CartItem item : cartItems) {
        Event event = item.getEvent();
        OurUsers user = usersRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));

        if (event.getRemainingTickets() < item.getQuantity()) {
            throw new IllegalStateException("Stock insuffisant pour l'événement : " + event.getTitle());
        }

        // Décrémente le stock
        event.setRemainingTickets(event.getRemainingTickets() - item.getQuantity());
        eventRepository.save(event);

        // Crée le ticket
        Ticket ticket = Ticket.builder()
                .ticketNumber(UUID.randomUUID().toString())
                .event(event)
                .user(user)
                .quantity(item.getQuantity())
                .offerType(item.getOfferType())
                .purchaseDate(LocalDateTime.now())
                .validated(true)
                .price(item.getUnitPrice())
                .build();

        ticketRepository.save(ticket);

        // Génère PDF avec QR code et envoie email
        byte[] pdfBytes = pdfGenerator.generateTicketPdf(ticket, event, user);
        emailService.sendEmailWithAttachment(customerEmail,
                "Vos billets - " + event.getTitle(),
                "Merci pour votre achat ! Vos billets sont en pièce jointe.",
                pdfBytes,
                "billets_" + ticket.getTicketNumber() + ".pdf");
    }
}
