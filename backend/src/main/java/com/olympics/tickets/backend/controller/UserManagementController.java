package com.olympics.tickets.backend.controller;

import com.olympics.tickets.backend.entity.OurUsers;
import com.olympics.tickets.backend.service.UsersManagementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.olympics.tickets.backend.dto.ReqRes;

@RestController
public class UserManagementController {
    @Autowired
    private UsersManagementService usersManagementService;

    @PostMapping("/auth/register")
    public ResponseEntity<ReqRes> register(@RequestBody ReqRes reg) {
        return ResponseEntity.ok(usersManagementService.register(reg));
    }

    @PostMapping("/auth/login")
    public ResponseEntity<ReqRes> login(@RequestBody ReqRes req) {
        return ResponseEntity.ok(usersManagementService.login(req));
    }

    @PostMapping("/auth/refresh")
    public ResponseEntity<ReqRes> refreshToken(@RequestBody ReqRes req) {
        return ResponseEntity.ok(usersManagementService.refreshToken(req));
    }

    // ============ NOUVEAUX ENDPOINTS MOT DE PASSE ============

    @PostMapping("/auth/password-reset-request")
    public ResponseEntity<ReqRes> requestPasswordReset(@RequestBody ReqRes request) {
        return ResponseEntity.ok(usersManagementService.requestPasswordReset(request));
    }

    @PostMapping("/auth/reset-password")
    public ResponseEntity<ReqRes> resetPassword(@RequestBody ReqRes request) {
        return ResponseEntity.ok(usersManagementService.resetPassword(request));
    }

    @GetMapping("/auth/validate-reset-token")
    public ResponseEntity<ReqRes> validateResetToken(@RequestParam String token) {
        return ResponseEntity.ok(usersManagementService.validateResetToken(token));
    }

    @PostMapping("/auth/change-password")
    public ResponseEntity<ReqRes> changePassword(@RequestBody ReqRes request) {
        return ResponseEntity.ok(usersManagementService.changePassword(request));
    }

    // ============ FIN DES NOUVEAUX ENDPOINTS ============

    @GetMapping("/admin/get-all-users")
    public ResponseEntity<ReqRes> getAllUsers() {
        return ResponseEntity.ok(usersManagementService.getAllUsers());
    }

    @GetMapping("/admin/get-users/{userId}")
    public ResponseEntity<ReqRes> getUserById(@PathVariable Long userId) {
        return ResponseEntity.ok(usersManagementService.getUsersById(userId));
    }

    @PutMapping("/admin/update/{userId}")
    public ResponseEntity<ReqRes> updateUser(@PathVariable Long userId, @RequestBody OurUsers reqres) {
        return ResponseEntity.ok(usersManagementService.updateUser(userId, reqres));
    }

    @GetMapping("/adminuser/get-profile")
    public ResponseEntity<ReqRes> getMyProfile() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String email = authentication.getName();

            System.out.println(" GET PROFILE - Email authentifié: " + email);
            System.out.println(" GET PROFILE - Authentification: " + authentication);
            System.out.println(" GET PROFILE - Authorities: " + authentication.getAuthorities());

            ReqRes response = usersManagementService.getMyInfo(email);

            System.out.println(" GET PROFILE - Statut: " + response.getStatusCode());
            System.out.println(" GET PROFILE - Message: " + response.getMessage());
            System.out.println(" GET PROFILE - Données utilisateur: " + response.getOurUsers());

            if (response.getOurUsers() != null) {
                System.out.println(" GET PROFILE - Utilisateur trouvé: " + response.getOurUsers().getEmail());
            } else {
                System.out.println(" GET PROFILE - Aucun utilisateur trouvé pour: " + email);
            }

            return ResponseEntity.status(response.getStatusCode()).body(response);

        } catch (Exception e) {
            System.out.println(" GET PROFILE - Erreur: " + e.getMessage());
            e.printStackTrace();

            ReqRes errorResponse = new ReqRes();
            errorResponse.setStatusCode(500);
            errorResponse.setMessage("Erreur serveur: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @DeleteMapping("/admin/delete/{userId}")
    public ResponseEntity<ReqRes> deleteUser(@PathVariable Long userId) {
        return ResponseEntity.ok(usersManagementService.deleteUser(userId));
    }
}