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

import java.util.Arrays;

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
                // ✅ DÉSACTIVER COMPLÈTEMENT CSRF (CRITIQUE)
                .csrf(AbstractHttpConfigurer::disable)

                // ✅ DÉSACTIVER AUSSI frameOptions POUR STRIPE
                .headers(headers -> headers
                        .frameOptions(frame -> frame.disable())
                )

                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        // 🚨 TOUJOURS EN PREMIER - WEBHOOK STRIPE
                        .requestMatchers("/api/stripe/webhook", "/api/stripe/webhook/").permitAll()

                        // 1. OPTIONS requests (CORS preflight)
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // 2. Authentication endpoints
                        .requestMatchers(
                                "/auth/login",
                                "/auth/register",
                                "/auth/refresh-token",
                                "/auth/password-reset-request",
                                "/auth/reset-password",
                                "/auth/validate-reset-token",
                                "/auth/change-password",
                                "/auth/**"
                        ).permitAll()

                        // 3. Documentation Swagger
                        .requestMatchers(
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/swagger-resources/**",
                                "/webjars/**"
                        ).permitAll()

                        // 4. Endpoints de test et publics
                        .requestMatchers(
                                "/api/test",
                                "/api/db-test",
                                "/public/**"
                        ).permitAll()

                        // 5. Resources publiques en lecture (GET)
                        .requestMatchers(HttpMethod.GET, "/api/offer_types/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/events/**").permitAll()

                        // 6. Administration - Opérations CRUD
                        .requestMatchers(HttpMethod.POST, "/api/offer_types/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/offer_types/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/offer_types/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/events/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/events/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/events/**").hasRole("ADMIN")

                        // 7. Routes admin
                        .requestMatchers("/admin/**").hasRole("ADMIN")

                        // 8. Routes authentifiées (utilisateurs normaux)
                        .requestMatchers("/api/cart/**", "/api/pay/**", "/api/tickets/**").authenticated()
                        .requestMatchers("/adminuser/**").authenticated()

                        // 9. Toutes les autres routes nécessitent une authentification
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // Configuration CORS (garder la vôtre)
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList(
                "http://localhost:*",
                "http://127.0.0.1:*",
                "https://projet-bloc-3.vercel.app",
                "https://*.vercel.app",
                "https://projet-bloc3.onrender.com"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"));
        configuration.setAllowedHeaders(Arrays.asList(
                "Authorization",
                "Content-Type",
                "Stripe-Signature", // ✅ IMPORTANT pour Stripe
                "X-Requested-With",
                "Accept",
                "Cache-Control",
                "Origin"
        ));
        configuration.setExposedHeaders(Arrays.asList(
                "Authorization",
                "Content-Disposition",
                "X-Total-Count"
        ));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(ourUserDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}