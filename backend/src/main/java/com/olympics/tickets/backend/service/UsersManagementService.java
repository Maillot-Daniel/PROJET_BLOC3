package com.olympics.tickets.backend.service;

import com.olympics.tickets.backend.entity.OurUsers;
import com.olympics.tickets.backend.repository.UsersRepository;
import com.olympics.tickets.backend.dto.ReqRes;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

// AJOUTER CES IMPORTS
import com.olympics.tickets.backend.entity.PasswordResetToken;
import com.olympics.tickets.backend.repository.PasswordResetTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import java.util.Date;

@Service
public class UsersManagementService {

    @Autowired
    private UsersRepository usersRepository;

    @Autowired
    private JWTUtils jwtUtils;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // AJOUTER CE CHAMP
    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Value("${frontend.base.url:http://localhost:3000}")
    private String frontendUrl;

    public ReqRes register(ReqRes registrationRequest) {
        ReqRes resp = new ReqRes();
        try {
            OurUsers ourUsers = new OurUsers();
            ourUsers.setEmail(registrationRequest.getEmail());
            ourUsers.setCity(registrationRequest.getCity());
            ourUsers.setRole(registrationRequest.getRole());
            ourUsers.setName(registrationRequest.getName());
            ourUsers.setPassword(passwordEncoder.encode(registrationRequest.getPassword()));

            OurUsers ourUsersResult = usersRepository.save(ourUsers);

            if (ourUsersResult.getId() > 0) {
                resp.setOurUsers(ourUsersResult);
                resp.setMessage("User Saved Successfully");
                resp.setStatusCode(200);
            }
        } catch (Exception e) {
            resp.setStatusCode(500);
            resp.setError(e.getMessage());
        }
        return resp;
    }

    public ReqRes login(ReqRes loginRequest) {
        ReqRes response = new ReqRes();
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword())
            );

            OurUsers user = usersRepository.findByEmail(loginRequest.getEmail())
                    .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

            Map<String, Object> claims = new HashMap<>();
            claims.put("role", user.getRole());

            String jwt = jwtUtils.generateToken(claims, user);
            String refreshToken = jwtUtils.generateRefreshToken(new HashMap<>(), user);

            response.setStatusCode(200);
            response.setToken(jwt);
            response.setRole(user.getRole());
            response.setRefreshToken(refreshToken);
            response.setExpirationTime("24Hrs");
            response.setMessage("Successfully Logged In");

        } catch (Exception e) {
            response.setStatusCode(500);
            response.setMessage(e.getMessage());
        }
        return response;
    }

    public ReqRes refreshToken(ReqRes refreshTokenRequest) {
        ReqRes response = new ReqRes();
        try {
            String email = jwtUtils.extractUsername(refreshTokenRequest.getToken());
            OurUsers user = usersRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

            if (jwtUtils.isTokenValid(refreshTokenRequest.getToken(), user)) {
                Map<String, Object> claims = new HashMap<>();
                claims.put("role", user.getRole());

                String newToken = jwtUtils.generateToken(claims, user);
                response.setToken(newToken);
                response.setRefreshToken(refreshTokenRequest.getToken());
                response.setExpirationTime("24Hrs");
                response.setStatusCode(200);
                response.setMessage("Successfully Refreshed Token");
            } else {
                response.setStatusCode(401);
                response.setMessage("Invalid refresh token");
            }
        } catch (Exception e) {
            response.setStatusCode(500);
            response.setMessage("Error occurred while refreshing token: " + e.getMessage());
        }
        return response;
    }

    public ReqRes getAllUsers() {
        ReqRes reqRes = new ReqRes();
        try {
            List<OurUsers> result = usersRepository.findAll();
            if (!result.isEmpty()) {
                reqRes.setOurUsersList(result);
                reqRes.setStatusCode(200);
                reqRes.setMessage("Users fetched successfully");
            } else {
                reqRes.setStatusCode(404);
                reqRes.setMessage("No users found");
            }
        } catch (Exception e) {
            reqRes.setStatusCode(500);
            reqRes.setMessage("Error occurred: " + e.getMessage());
        }
        return reqRes;
    }

    public ReqRes getUsersById(Long id) {
        ReqRes reqRes = new ReqRes();
        try {
            OurUsers userById = usersRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("User Not Found"));
            reqRes.setOurUsers(userById);
            reqRes.setStatusCode(200);
            reqRes.setMessage("User with ID '" + id + "' found successfully");
        } catch (Exception e) {
            reqRes.setStatusCode(500);
            reqRes.setMessage("Error occurred: " + e.getMessage());
        }
        return reqRes;
    }

    public ReqRes deleteUser(Long userId) {
        ReqRes reqRes = new ReqRes();
        try {
            Optional<OurUsers> usersOptional = usersRepository.findById(userId);
            if (usersOptional.isPresent()) {
                usersRepository.deleteById(userId);
                reqRes.setStatusCode(200);
                reqRes.setMessage("User deleted successfully");
            } else {
                reqRes.setStatusCode(404);
                reqRes.setMessage("User not found for deletion");
            }
        } catch (Exception e) {
            reqRes.setStatusCode(500);
            reqRes.setMessage("Error occurred while deleting user: " + e.getMessage());
        }
        return reqRes;
    }

    public ReqRes updateUser(Long userId, OurUsers updateUser) {
        ReqRes reqRes = new ReqRes();
        try {
            OurUsers existingUser = usersRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found for update"));

            existingUser.setEmail(updateUser.getEmail());
            existingUser.setName(updateUser.getName());
            existingUser.setCity(updateUser.getCity());
            existingUser.setRole(updateUser.getRole());

            if (updateUser.getPassword() != null && !updateUser.getPassword().isEmpty()) {
                existingUser.setPassword(passwordEncoder.encode(updateUser.getPassword()));
            }

            OurUsers savedUser = usersRepository.save(existingUser);
            reqRes.setOurUsers(savedUser);
            reqRes.setStatusCode(200);
            reqRes.setMessage("User updated successfully");

        } catch (Exception e) {
            reqRes.setStatusCode(500);
            reqRes.setMessage("Error occurred while updating user: " + e.getMessage());
        }
        return reqRes;
    }

    public ReqRes getMyInfo(String email) {
        ReqRes reqRes = new ReqRes();
        try {
            OurUsers user = usersRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            reqRes.setOurUsers(user);
            reqRes.setStatusCode(200);
            reqRes.setMessage("User found successfully");
        } catch (Exception e) {
            reqRes.setStatusCode(500);
            reqRes.setMessage("Error occurred while getting user info: " + e.getMessage());
        }
        return reqRes;
    }

    // ==================== MÉTHODES RÉINITIALISATION MOT DE PASSE ====================

    public ReqRes requestPasswordReset(ReqRes request) {
        ReqRes response = new ReqRes();
        try {
            OurUsers user = usersRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec cet email"));

            // Supprimer les tokens existants
            passwordResetTokenRepository.deleteByUser(user);

            // Générer nouveau token
            String token = java.util.UUID.randomUUID().toString();
            PasswordResetToken resetToken = new PasswordResetToken(token, user);
            passwordResetTokenRepository.save(resetToken);

            // Envoyer "email" (log console pour le moment)
            sendPasswordResetEmail(user, token);

            response.setStatusCode(200);
            response.setMessage("Lien de réinitialisation généré - Voir les logs du serveur");

        } catch (Exception e) {
            response.setStatusCode(500);
            response.setMessage(e.getMessage());
        }
        return response;
    }

    public ReqRes resetPassword(ReqRes request) {
        ReqRes response = new ReqRes();
        try {
            PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken());

            if (resetToken == null) {
                throw new RuntimeException("Token invalide");
            }

            if (resetToken.getExpiryDate().before(new Date())) {
                passwordResetTokenRepository.delete(resetToken);
                throw new RuntimeException("Token expiré");
            }

            OurUsers user = resetToken.getUser();
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            usersRepository.save(user);

            // Supprimer le token utilisé
            passwordResetTokenRepository.delete(resetToken);

            response.setStatusCode(200);
            response.setMessage("Mot de passe réinitialisé avec succès");

        } catch (Exception e) {
            response.setStatusCode(500);
            response.setMessage(e.getMessage());
        }
        return response;
    }

    public ReqRes validateResetToken(String token) {
        ReqRes response = new ReqRes();
        try {
            PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token);

            if (resetToken == null) {
                throw new RuntimeException("Token invalide");
            }

            if (resetToken.getExpiryDate().before(new Date())) {
                passwordResetTokenRepository.delete(resetToken);
                throw new RuntimeException("Token expiré");
            }

            response.setStatusCode(200);
            response.setMessage("Token valide");

        } catch (Exception e) {
            response.setStatusCode(400);
            response.setMessage(e.getMessage());
        }
        return response;
    }

    private void sendPasswordResetEmail(OurUsers user, String token) {
        try {
            String resetUrl = frontendUrl + "/reset-password?token=" + token;

            // SOLUTION TEMPORAIRE : Afficher dans les logs
            System.out.println("=== LIEN RÉINITIALISATION MOT DE PASSE ===");
            System.out.println("Pour: " + user.getEmail());
            System.out.println("Lien: " + resetUrl);
            System.out.println("Token (pour test direct): " + token);
            System.out.println("=========================================");

        } catch (Exception e) {
            System.out.println("Erreur génération lien reset: " + e.getMessage());
        }
    }
}