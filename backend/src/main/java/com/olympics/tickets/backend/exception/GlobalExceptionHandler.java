package com.olympics.tickets.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ControllerAdvice;

@ControllerAdvice // Cette annotation indique que la classe gère les exceptions globalement
public class GlobalExceptionHandler {

    // Gère l'exception EventNotFoundException de manière personnalisée
    @ExceptionHandler(EventNotFoundException.class)
    public ResponseEntity<String> handleEventNotFoundException(EventNotFoundException ex) {
        // Retourne une réponse HTTP 404 Not Found avec le message d'erreur
        return new ResponseEntity<>(ex.getMessage(), HttpStatus.NOT_FOUND);
    }

    // Gère toutes les exceptions génériques (Exception)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleGenericException(Exception ex) {
        // Retourne une réponse HTTP 500 Internal Server Error avec un message générique
        return new ResponseEntity<>("An unexpected error occurred: " + ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // Gère les erreurs de type IllegalArgumentException (exemple : pour les vérifications des entrées utilisateur)
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleIllegalArgumentException(IllegalArgumentException ex) {
        // Retourne une réponse HTTP 400 Bad Request avec le message d'erreur
        return new ResponseEntity<>(ex.getMessage(), HttpStatus.BAD_REQUEST);
    }

    // Vous pouvez ajouter d'autres gestionnaires d'exceptions si nécessaire
}
