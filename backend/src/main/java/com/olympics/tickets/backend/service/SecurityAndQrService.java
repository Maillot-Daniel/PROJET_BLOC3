package com.olympics.tickets.backend.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.qrcode.QRCodeWriter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.UUID;

@Service
@Slf4j
public class SecurityAndQrService {

    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final int QR_CODE_SIZE = 350;
    private static final int RANDOM_KEY_BYTES = 32;

    @Value("${ticket.signature.secret:defaultSecretKeyChangeInProduction}")
    private String signatureSecret;

    @Value("${app.qr-code.output-dir:/tmp/qrcodes}")
    private String qrCodeOutputDir;

    /**
     * Génère une clé aléatoire sécurisée
     */
    public String generateRandomKey() {
        try {
            byte[] randomBytes = new byte[RANDOM_KEY_BYTES];
            SecureRandom secureRandom = new SecureRandom();
            secureRandom.nextBytes(randomBytes);
            return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
        } catch (Exception e) {
            log.error("Erreur lors de la génération de clé aléatoire", e);
            throw new RuntimeException("Erreur génération clé sécurisée", e);
        }
    }

    /**
     * Crée une signature HMAC-SHA256
     */
    public String createSignature(String data) {
        if (data == null || data.trim().isEmpty()) {
            throw new IllegalArgumentException("Les données à signer ne peuvent pas être vides");
        }

        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            SecretKeySpec secretKeySpec = new SecretKeySpec(signatureSecret.getBytes(), HMAC_ALGORITHM);
            mac.init(secretKeySpec);
            byte[] signatureBytes = mac.doFinal(data.getBytes());
            return Base64.getUrlEncoder().withoutPadding().encodeToString(signatureBytes);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            log.error("Erreur lors de la création de la signature HMAC", e);
            throw new RuntimeException("Erreur création signature", e);
        }
    }

    /**
     * Vérifie une signature HMAC
     */
    public boolean verifySignature(String data, String signature) {
        if (data == null || signature == null) {
            return false;
        }
        String expectedSignature = createSignature(data);
        return expectedSignature.equals(signature);
    }

    /**
     * Génère un QR code et retourne le chemin du fichier
     */
    public String generateQrCodeFile(String text) {
        try {
            // Créer le répertoire de sortie si nécessaire
            Path outputDir = Path.of(qrCodeOutputDir);
            if (!Files.exists(outputDir)) {
                Files.createDirectories(outputDir);
            }

            // Générer le QR code
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            var bitMatrix = qrCodeWriter.encode(text, BarcodeFormat.QR_CODE, QR_CODE_SIZE, QR_CODE_SIZE);

            String filename = "ticket_qr_" + System.currentTimeMillis() + "_" +
                    generateRandomKey().substring(0, 8) + ".png";
            Path filePath = outputDir.resolve(filename);

            MatrixToImageWriter.writeToPath(bitMatrix, "PNG", filePath);

            log.info("QR code généré: {}", filePath);
            return filePath.toString();

        } catch (WriterException | IOException e) {
            log.error("Erreur lors de la génération du QR code", e);
            throw new RuntimeException("Erreur génération QR code", e);
        }
    }

    /**
     * Génère un QR code en tant que byte array (pour API)
     */
    public byte[] generateQrCodeBytes(String text) {
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            var bitMatrix = qrCodeWriter.encode(text, BarcodeFormat.QR_CODE, QR_CODE_SIZE, QR_CODE_SIZE);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);

            return outputStream.toByteArray();

        } catch (WriterException | IOException e) {
            log.error("Erreur lors de la génération du QR code en bytes", e);
            throw new RuntimeException("Erreur génération QR code bytes", e);
        }
    }

    /**
     * Nettoie les anciens fichiers QR code
     */
    public void cleanupOldQrCodes(int daysOld) {
        try {
            Path qrDir = Path.of(qrCodeOutputDir);
            if (Files.exists(qrDir)) {
                Files.list(qrDir)
                        .filter(path -> {
                            try {
                                return Files.getLastModifiedTime(path).toInstant()
                                        .isBefore(java.time.Instant.now().minusSeconds(daysOld * 24 * 60 * 60));
                            } catch (IOException e) {
                                return false;
                            }
                        })
                        .forEach(path -> {
                            try {
                                Files.delete(path);
                                log.info("Fichier QR code supprimé: {}", path);
                            } catch (IOException e) {
                                log.warn("Impossible de supprimer le fichier QR code: {}", path, e);
                            }
                        });
            }
        } catch (IOException e) {
            log.warn("Erreur lors du nettoyage des QR codes", e);
        }
    }

    // ==========================================================
    // === Ajout pour la génération secondaryKey + QR Data URL ===
    // ==========================================================

    public static class SecondaryKeyAndQr {
        public final String secondaryKey;
        public final String qrDataUrl;

        public SecondaryKeyAndQr(String secondaryKey, String qrDataUrl) {
            this.secondaryKey = secondaryKey;
            this.qrDataUrl = qrDataUrl;
        }
    }

    /**
     * Génère une secondaryKey et un QR code (en base64 Data URL) à partir d'une primaryKey.
     */
    public SecondaryKeyAndQr generateSecondaryKeyAndQr(String primaryKey) {
        try {
            // 1) Générer secondaryKey
            String secondaryKey = UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();

            // 2) Concaténation pour obtenir la clef finale
            String finalKey = primaryKey + secondaryKey;

            // 3) Générer QR code en mémoire
            byte[] png = generateQrCodeBytes(finalKey);
            String base64 = Base64.getEncoder().encodeToString(png);
            String dataUrl = "data:image/png;base64," + base64;

            log.info("Secondary key générée pour clé primaire {} : {}", primaryKey, secondaryKey);
            return new SecondaryKeyAndQr(secondaryKey, dataUrl);

        } catch (Exception e) {
            log.error("Erreur lors de la génération de la secondaryKey + QR", e);
            throw new RuntimeException("Erreur génération secondaryKey/QR", e);
        }
    }
}
