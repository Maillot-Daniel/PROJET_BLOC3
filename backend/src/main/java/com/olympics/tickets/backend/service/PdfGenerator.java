package com.olympics.tickets.backend.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.itextpdf.io.image.ImageData;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.olympics.tickets.backend.entity.Ticket;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Component
public class PdfGenerator {

    /**
     * Génère un PDF pour un ticket avec QR code
     */
    public byte[] generateTicketPdf(Ticket ticket) throws IOException, WriterException {
        if (ticket == null) {
            throw new IllegalArgumentException("Ticket ne peut pas être null");
        }

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfDocument pdf = new PdfDocument(new PdfWriter(baos));
            try (Document document = new Document(pdf)) {

                // Informations du ticket
                String eventTitle = ticket.getEvent() != null ? ticket.getEvent().getTitle() : "Événement inconnu";
                String userName = ticket.getUser() != null ? ticket.getUser().getName() : "Nom inconnu";
                String eventDate = ticket.getEvent() != null && ticket.getEvent().getDate() != null ?
                        ticket.getEvent().getDate().toString() : "Date inconnue";

                document.add(new Paragraph("Billet pour : " + eventTitle));
                document.add(new Paragraph("Nom : " + userName));
                document.add(new Paragraph("Date : " + eventDate));
                document.add(new Paragraph("Quantité : " + ticket.getQuantity()));
                document.add(new Paragraph("Numéro du billet : " + ticket.getTicketNumber()));

                // QR code avec données sécurisées : primaryKey|signature
                String qrData = ticket.getPrimaryKey() + "|" + ticket.getSignature();
                QRCodeWriter qrCodeWriter = new QRCodeWriter();
                BitMatrix bitMatrix = qrCodeWriter.encode(qrData, BarcodeFormat.QR_CODE, 150, 150);
                java.awt.image.BufferedImage bufferedImage = MatrixToImageWriter.toBufferedImage(bitMatrix);

                try (ByteArrayOutputStream qrBaos = new ByteArrayOutputStream()) {
                    javax.imageio.ImageIO.write(bufferedImage, "PNG", qrBaos);
                    ImageData imageData = ImageDataFactory.create(qrBaos.toByteArray());
                    Image qrImage = new Image(imageData);
                    document.add(qrImage);
                }
            }

            return baos.toByteArray();
        }
    }
}
