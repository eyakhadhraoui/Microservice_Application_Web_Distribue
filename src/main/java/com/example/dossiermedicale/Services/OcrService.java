package com.example.dossiermedicale.Services;

import com.example.dossiermedicale.dto.OcrResponse;
import net.sourceforge.tess4j.Tesseract;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.InputStream;
import java.util.Locale;

/**
 * Service OCR pour extraire le texte d'une image ou d'un PDF (scan de suivi).
 * Nécessite Tesseract installé sur la machine (et tessdata pour les langues).
 * En cas d'erreur native (ex: Invalid memory access), l'OCR est désactivé proprement.
 */
@Service
public class OcrService {

    private static final Logger log = LoggerFactory.getLogger(OcrService.class);

    /** Désactivé par défaut. Mettre à true uniquement après installation de Tesseract. */
    @Value("${app.ocr.enabled:false}")
    private boolean ocrEnabled;

    /** Langues OCR (fra = français, eng = anglais). Tesseract doit avoir les packs installés. */
    @Value("${app.ocr.lang:eng}")
    private String ocrLang;

    /**
     * Chemin vers le dossier Tesseract (contenant tessdata). Obligatoire sur Windows si Tesseract
     * n'est pas dans le PATH. Ex: C:/Program Files/Tesseract-OCR
     */
    @Value("${app.ocr.datapath:}")
    private String ocrDatapath;

    /** Après une erreur native (ex: Invalid memory access), on ne rappelle plus Tesseract. */
    private volatile boolean ocrUnavailable = false;

    /**
     * Extrait le texte d'un fichier image (jpg, png, etc.) ou PDF.
     * Pour les PDF, chaque page est rendue en image puis passée à l'OCR.
     * En cas d'erreur (ex. Tesseract non installé), retourne error pour affichage à l'utilisateur.
     */
    public OcrResponse extractText(MultipartFile file) {
        if (!ocrEnabled) {
            return new OcrResponse("", "OCR non disponible sur ce serveur. Saisissez les notes à la main.");
        }
        if (ocrUnavailable) {
            return new OcrResponse("", "OCR non disponible sur ce serveur. Saisissez les notes à la main.");
        }
        if (file == null || file.isEmpty()) {
            return new OcrResponse("", null);
        }
        String name = file.getOriginalFilename();
        if (name == null) name = "";
        String lower = name.toLowerCase(Locale.ROOT);

        try {
            String text;
            if (lower.endsWith(".pdf")) {
                text = extractTextFromPdf(file.getInputStream());
            } else {
                text = extractTextFromImage(file.getInputStream());
            }
            return new OcrResponse(text != null ? text : "", null);
        } catch (Throwable t) {
            ocrUnavailable = true;
            log.error("Erreur OCR pour {} : {} (cause: {}). OCR désactivé pour cette session.", name, t.getMessage(), t.getClass().getSimpleName());
            return new OcrResponse("", "OCR non disponible sur ce serveur. Saisissez les notes à la main.");
        }
    }

    private Tesseract createTesseract() {
        Tesseract tesseract = new Tesseract();
        tesseract.setLanguage(ocrLang);
        if (ocrDatapath != null && !ocrDatapath.isBlank()) {
            tesseract.setDatapath(ocrDatapath.trim());
        }
        return tesseract;
    }

    private String extractTextFromImage(InputStream inputStream) throws Throwable {
        BufferedImage image = ImageIO.read(inputStream);
        if (image == null) {
            log.warn("Impossible de lire l'image pour l'OCR");
            return "";
        }
        Tesseract tesseract = createTesseract();
        return tesseract.doOCR(image).trim();
    }

    private String extractTextFromPdf(InputStream pdfInputStream) throws Throwable {
        StringBuilder fullText = new StringBuilder();
        try (PDDocument document = Loader.loadPDF(pdfInputStream.readAllBytes())) {
            PDFRenderer renderer = new PDFRenderer(document);
            int pages = document.getNumberOfPages();
            Tesseract tesseract = createTesseract();
            for (int p = 0; p < pages; p++) {
                BufferedImage image = renderer.renderImageWithDPI(p, 200, ImageType.RGB);
                String pageText = tesseract.doOCR(image).trim();
                if (!pageText.isEmpty()) {
                    if (fullText.length() > 0) fullText.append("\n\n");
                    fullText.append(pageText);
                }
            }
        }
        return fullText.toString().trim();
    }
}
