package com.olympics.tickets.backend.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.io.image.ImageData;
import com.itextpdf.io.image.ImageDataFactory;
import com.olympics.tickets.backend.entity.Event;
import com.olympics.tickets.backend.entity.OurUsers;
import com.olympics.tickets.backend.entity.Ticket;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Component
public class PdfGenerator {

    public byte[] generateTicketPdf(Ticket ticket) throws IOException, WriterException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfDocument pdf = new PdfDocument(new PdfWriter(baos));
        Document document = new Document(pdf);

        document.add(new Paragraph("Billet pour : " + ticket.getEvent().getTitle()));
        document.add(new Paragraph("Nom : " + ticket.getUser().getName()));
        document.add(new Paragraph("Date : " + ticket.getEvent().getDate()));
        document.add(new Paragraph("Quantité : " + ticket.getQuantity()));
        document.add(new Paragraph("Numéro du billet : " + ticket.getTicketNumber()));

        // QR code
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        BitMatrix bitMatrix = qrCodeWriter.encode(ticket.getTicketNumber(), BarcodeFormat.QR_CODE, 150, 150);
        java.awt.image.BufferedImage bufferedImage = MatrixToImageWriter.toBufferedImage(bitMatrix);

        ByteArrayOutputStream qrBaos = new ByteArrayOutputStream();
        javax.imageio.ImageIO.write(bufferedImage, "PNG", qrBaos);
        byte[] qrImageBytes = qrBaos.toByteArray();

        ImageData imageData = ImageDataFactory.create(qrImageBytes);
        Image qrImage = new Image(imageData);
        document.add(qrImage);

        document.close();
        return baos.toByteArray();
    }
}