package com.olympics.tickets.backend.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;
import java.util.function.Function;

@Component
public class JWTUtils {

    private final SecretKey key;

    // Expiration token d'accès : 24 heures
    private static final long ACCESS_TOKEN_EXPIRATION = 60 * 60 * 1000; // 15 minutes

    // Expiration refresh token : 7 jours
    private static final long REFRESH_TOKEN_EXPIRATION = 7 * 24 * 60 * 60 * 1000; // 7 jours

    // Utilisation d'une variable d'environnement pour la clé secrète
    @Value("${jwt.secret:default-fallback-secret-key-minimum-32-characters-long}")
    private String secretKey;

    public JWTUtils(@Value("${jwt.secret:default-fallback-secret-key-minimum-32-characters-long}") String secretKey) {
        // Validation de la longueur de la clé
        if (secretKey == null || secretKey.length() < 32) {
            throw new IllegalArgumentException("JWT secret key must be at least 32 characters long");
        }

        byte[] keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        this.key = Keys.hmacShaKeyFor(keyBytes);
    }

    // Génération du token d'accès
    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return buildToken(extraClaims, userDetails, ACCESS_TOKEN_EXPIRATION);
    }

    // Génération du refresh token (avec expiration plus longue)
    public String generateRefreshToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return buildToken(extraClaims, userDetails, REFRESH_TOKEN_EXPIRATION);
    }

    // Méthode générique pour construire les tokens
    private String buildToken(Map<String, Object> extraClaims, UserDetails userDetails, long expiration) {
        return Jwts.builder()
                .claims(extraClaims) // Nouvelle API JJWT 0.12.x
                .subject(userDetails.getUsername())
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(key)
                .compact();
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String extractRole(String token) {
        return extractClaim(token, claims -> claims.get("role", String.class));
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public Date extractIssuedAt(String token) {
        return extractClaim(token, Claims::getIssuedAt);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (Exception e) {
            throw new RuntimeException("Invalid JWT token: " + e.getMessage());
        }
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username != null &&
                username.equals(userDetails.getUsername()) &&
                !isTokenExpired(token));
    }

    public boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    // Vérification supplémentaire de la validité du token
    public boolean validateTokenStructure(String token) {
        try {
            extractAllClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    // Temps restant avant expiration (en millisecondes)
    public long getRemainingTime(String token) {
        Date expiration = extractExpiration(token);
        return expiration.getTime() - System.currentTimeMillis();
    }

    // Vérification si le token va bientôt expirer (moins de 5 minutes)
    public boolean isTokenAboutToExpire(String token) {
        return getRemainingTime(token) < (5 * 60 * 1000); // 5 minutes
    }
}