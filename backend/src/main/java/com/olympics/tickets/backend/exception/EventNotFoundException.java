package com.olympics.tickets.backend.exception;

public class EventNotFoundException extends RuntimeException {

    // Constructeur avec seulement le message
    public EventNotFoundException(String message) {
        super(message);  // Appelle le constructeur de RuntimeException avec le message passé
    }

    // Constructeur avec message et cause (utile pour les erreurs plus complexes)
    public EventNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
