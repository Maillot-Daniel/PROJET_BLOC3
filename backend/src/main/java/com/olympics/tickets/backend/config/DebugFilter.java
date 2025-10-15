package com.olympics.tickets.backend.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@Order(1) // ✅ EXÉCUTÉ EN PREMIER
@Slf4j
public class DebugFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        String path = httpRequest.getRequestURI();
        String method = httpRequest.getMethod();

        // ✅ LOG TOUTES LES REQUÊTES
        if (path.contains("/public/") || path.contains("/stripe") || path.contains("/webhook")) {
            log.info("🎯 REQUÊTE WEBHOOK DÉTECTÉE - Méthode: {}, Chemin: {}", method, path);

            // ✅ LOG TOUS LES HEADERS
            httpRequest.getHeaderNames().asIterator().forEachRemaining(headerName -> {
                String headerValue = httpRequest.getHeader(headerName);
                if (headerValue != null && !headerValue.isEmpty()) {
                    log.info("   📨 {}: {}", headerName,
                            headerName.equals("Stripe-Signature") ?
                                    headerValue.substring(0, Math.min(20, headerValue.length())) + "..." :
                                    headerValue);
                }
            });
        }

        chain.doFilter(request, response);
    }
}