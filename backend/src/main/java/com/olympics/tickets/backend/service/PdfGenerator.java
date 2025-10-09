import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.qrcode.QRCodeWriter;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.io.image.ImageDataFactory;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Component
public class PdfGenerator {

    public byte[] generateTicketPdf(Ticket ticket, Event event, OurUsers user) throws IOException, WriterException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfDocument pdf = new PdfDocument(new PdfWriter(baos));
        Document document = new Document(pdf);

        document.add(new Paragraph("Billet pour : " + event.getTitle()));
        document.add(new Paragraph("Nom : " + user.getName()));
        document.add(new Paragraph("Date : " + event.getDate()));
        document.add(new Paragraph("Quantité : " + ticket.getQuantity()));
        document.add(new Paragraph("Numéro du billet : " + ticket.getTicketNumber()));

        // QR code
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        var bitMatrix = qrCodeWriter.encode(ticket.getTicketNumber(), BarcodeFormat.QR_CODE, 150, 150);
        Image qrImage = new Image(ImageDataFactory.create(MatrixToImageWriter.toBufferedImage(bitMatrix), null));
        document.add(qrImage);

        document.close();
        return baos.toByteArray();
    }
}
