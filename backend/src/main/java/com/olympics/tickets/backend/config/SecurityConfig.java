package com.olympics.tickets.backend.config;

import com.olympics.tickets.backend.service.OurUserDetailsService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final OurUserDetailsService ourUserDetailsService;
    private final JWTAuthFilter jwtAuthFilter;

    public SecurityConfig(OurUserDetailsService ourUserDetailsService,
                          JWTAuthFilter jwtAuthFilter) {
        this.ourUserDetailsService = ourUserDetailsService;
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Désactiver CSRF pour les APIs REST
            .csrf(AbstractHttpConfigurer::disable)

            // Activer la configuration CORS
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // Configuration des autorisations
            .authorizeHttpRequests(auth -> auth

                // Autoriser les requêtes "préflight" CORS
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // Endpoints publics (login, docs, etc.)
                .requestMatchers(
                    "/auth/**",
                    "/public/**",
                    "/v3/api-docs/**",
                    "/swagger-ui/**",
                    "/swagger-ui.html"
                ).permitAll()

                // Événements : lecture publique, gestion admin
                .requestMatchers(HttpMethod.GET, "/api/events/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/events/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/events/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/events/**").hasRole("ADMIN")

                // Routes admin
                .requestMatchers("/admin/**").hasRole("ADMIN")

                // Toutes les autres requêtes nécessitent un token JWT
                .anyRequest().authenticated()
            )

            // Pas de session, API stateless
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // Ajouter les filtres d'authentification
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Configuration CORS globale
     * Autorise le frontend local + domaines Vercel à accéder à l'API.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // 🔹 Autoriser toutes les origines pendant le dev (localhost + vercel)
        configuration.setAllowedOriginPatterns(List.of(
            "http://localhost:*",
            "https://*.vercel.app"
        ));

        // 🔹 Méthodes HTTP autorisées
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));

        // 🔹 En-têtes autorisés
        configuration.setAllowedHeaders(List.of("*"));

        // 🔹 En-têtes exposés au frontend
        configuration.setExposedHeaders(List.of("Authorization"));

        // 🔹 Si tu utilises des cookies (sinon tu peux mettre false)
        configuration.setAllowCredentials(true);

        // 🔹 Durée de cache des règles CORS (1h)
        configuration.setMaxAge(3600L);

        // 🔹 Appliquer la configuration à tous les endpoints
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }

    // Provider d'authentification basé sur UserDetailsService + BCrypt
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(ourUserDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    // Encoder de mots de passe
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Gestionnaire d’authentification (pour l’injection dans d’autres services)
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
