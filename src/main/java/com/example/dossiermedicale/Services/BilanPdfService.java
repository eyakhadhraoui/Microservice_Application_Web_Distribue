package com.example.dossiermedicale.Services;

import com.example.dossiermedicale.Entities.RapportBi;
import com.example.dossiermedicale.Entities.ResultatLaboratoire;
import com.example.dossiermedicale.Entities.TestLaboratoire;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.format.DateTimeFormatter;

/**
 * Génère le PDF d'un rapport de bilan avec mise en page professionnelle :
 * en-tête KidneyCare, bloc d'informations (dossier, test, résultat), sections structurées, signature, pied de page.
 */
@Service
@Slf4j
public class BilanPdfService {

    private static final String BILANS_DIR = "uploads/bilans";
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATETIME_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm");

    /** Couleur principale KidneyCare (teal) */
    private static final Color COLOR_PRIMARY = new Color(13, 148, 136);
    private static final Color COLOR_HEADER_BG = new Color(240, 253, 250); // teal 50
    private static final Color COLOR_SECTION_HEADER = new Color(204, 251, 241); // teal 100
    private static final Color COLOR_BORDER = new Color(204, 251, 241);

    public String generateAndSave(RapportBi rapport) {
        if (rapport == null || rapport.getIdRapportBilan() == null) {
            return null;
        }
        try {
            Path dir = Paths.get(BILANS_DIR).toAbsolutePath().normalize();
            Files.createDirectories(dir);
            String fileName = "rapport-" + rapport.getIdRapportBilan() + ".pdf";
            Path filePath = dir.resolve(fileName);

            try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
                buildPdf(rapport, baos);
                Files.write(filePath, baos.toByteArray());
            }
            String relativePath = BILANS_DIR + "/" + fileName;
            log.info("PDF bilan généré: {}", relativePath);
            return relativePath;
        } catch (Exception e) {
            log.warn("Échec génération PDF bilan pour rapport {}: {}", rapport.getIdRapportBilan(), e.getMessage());
            return null;
        }
    }

    private void buildPdf(RapportBi rapport, ByteArrayOutputStream out) throws Exception {
        Document document = new Document(PageSize.A4, 36, 36, 50, 45);
        PdfWriter writer = PdfWriter.getInstance(document, out);
        document.open();

        // Métadonnées du document
        document.addTitle("Rapport de bilan — KidneyCare");
        document.addSubject("Rapport de bilan néphrologie pédiatrique");
        document.addCreator("KidneyCare");

        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
        titleFont.setColor(COLOR_PRIMARY);
        Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA, 11);
        subtitleFont.setColor(Color.GRAY);
        Font headingFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
        headingFont.setColor(COLOR_PRIMARY);
        Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 11);
        Font smallFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
        smallFont.setColor(Color.DARK_GRAY);

        // ----- En-tête -----
        PdfPTable headerTable = new PdfPTable(1);
        headerTable.setWidthPercentage(100f);
        headerTable.setSpacingAfter(16f);
        headerTable.getDefaultCell().setBackgroundColor(COLOR_HEADER_BG);
        headerTable.getDefaultCell().setBorder(Rectangle.NO_BORDER);
        headerTable.getDefaultCell().setBorderWidth(0f);
        headerTable.getDefaultCell().setPadding(14f);
        headerTable.addCell(new Phrase("Rapport de bilan — KidneyCare", titleFont));
        headerTable.addCell(new Phrase("Système de suivi néphrologique pédiatrique", subtitleFont));
        document.add(headerTable);

        // ----- Bloc informations (dossier, test, résultat) -----
        ResultatLaboratoire resultat = rapport.getResultatLaboratoire();
        if (resultat == null && rapport.getResultats() != null && !rapport.getResultats().isEmpty()) {
            resultat = rapport.getResultats().get(0);
        }
        TestLaboratoire test = resultat != null ? resultat.getTestLaboratoire() : null;
        String nomTest = test != null ? (test.getNomTest() != null ? test.getNomTest() : test.getCodeTest()) : "—";
        String dateResultatStr = formatDateResultat(resultat);
        String valeurResultat = formatValeurResultat(resultat);
        String dossierId = rapport.getDossierMedical() != null
                ? String.valueOf(rapport.getDossierMedical().getIdDossierMedical()) : "—";
        String dateRapportStr = rapport.getDateRapport() != null ? rapport.getDateRapport().format(DATE_FORMAT) : "—";

        PdfPTable infoTable = new PdfPTable(2);
        infoTable.setWidthPercentage(100f);
        infoTable.setSpacingAfter(20f);
        infoTable.setWidths(new float[]{1f, 2f});
        infoTable.getDefaultCell().setPadding(8f);
        infoTable.getDefaultCell().setBorderColor(COLOR_BORDER);
        addInfoRow(infoTable, "Dossier médical", "N° " + dossierId, smallFont, normalFont);
        addInfoRow(infoTable, "Test", nomTest, smallFont, normalFont);
        addInfoRow(infoTable, "Date du résultat", dateResultatStr, smallFont, normalFont);
        addInfoRow(infoTable, "Valeur / Résultat", valeurResultat, smallFont, normalFont);
        addInfoRow(infoTable, "Date du rapport", dateRapportStr, smallFont, normalFont);
        document.add(infoTable);

        // ----- Sections Contenu, Conclusion, Recommandations -----
        addSectionBox(document, "Contenu", rapport.getContenu(), headingFont, normalFont);
        addSectionBox(document, "Conclusion", rapport.getConclusion(), headingFont, normalFont);
        addSectionBox(document, "Recommandations", rapport.getRecommandations(), headingFont, normalFont);

        // ----- Bloc signature -----
        if (rapport.getNomMedecin() != null && !rapport.getNomMedecin().isBlank()) {
            document.add(new Paragraph(" "));
            PdfPTable sigTable = new PdfPTable(1);
            sigTable.setWidthPercentage(100f);
            sigTable.setSpacingAfter(12f);
            PdfPCell sigCell = new PdfPCell();
            sigCell.setBorder(Rectangle.TOP);
            sigCell.setBorderColor(COLOR_BORDER);
            sigCell.setPaddingTop(12f);
            sigCell.setPadding(8f);
            sigCell.addElement(new Paragraph("Signature", smallFont));
            sigCell.addElement(new Paragraph(rapport.getNomMedecin(), normalFont));
            if (rapport.getDateSignature() != null) {
                sigCell.addElement(new Paragraph("Le " + rapport.getDateSignature().format(DATETIME_FORMAT), smallFont));
            }
            sigTable.addCell(sigCell);
            document.add(sigTable);
        }

        // ----- Pied de page -----
        document.add(new Paragraph(" "));
        Paragraph footer = new Paragraph(
                "Document généré le " + java.time.LocalDateTime.now().format(DATETIME_FORMAT) + " — KidneyCare",
                smallFont);
        footer.setAlignment(Element.ALIGN_CENTER);
        document.add(footer);

        document.close();
    }

    private String formatDateResultat(ResultatLaboratoire resultat) {
        if (resultat == null) return "—";
        if (resultat.getDateRendu() != null) return resultat.getDateRendu().format(DATE_FORMAT);
        if (resultat.getDatePrelevement() != null) return resultat.getDatePrelevement().format(DATE_FORMAT);
        if (resultat.getDateResultat() != null) return resultat.getDateResultat().format(DATE_FORMAT);
        return "—";
    }

    private String formatValeurResultat(ResultatLaboratoire resultat) {
        if (resultat == null) return "—";
        if (resultat.getValeurNumerique() != null) return resultat.getValeurNumerique() + (resultat.getUnite() != null ? " " + resultat.getUnite() : "");
        if (resultat.getValeurTexte() != null && !resultat.getValeurTexte().isBlank()) return resultat.getValeurTexte();
        if (resultat.getValeurResultat() != null) return resultat.getValeurResultat();
        return "—";
    }

    private void addInfoRow(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, labelFont));
        labelCell.setBackgroundColor(COLOR_SECTION_HEADER);
        labelCell.setPadding(8f);
        labelCell.setBorderColor(COLOR_BORDER);
        table.addCell(labelCell);
        PdfPCell valueCell = new PdfPCell(new Phrase(value != null ? value : "—", valueFont));
        valueCell.setPadding(8f);
        valueCell.setBorderColor(COLOR_BORDER);
        table.addCell(valueCell);
    }

    private void addSectionBox(Document document, String title, String text, Font headingFont, Font normalFont) throws DocumentException {
        if (text == null || text.isBlank()) return;

        PdfPTable table = new PdfPTable(1);
        table.setWidthPercentage(100f);
        table.setSpacingAfter(14f);
        table.getDefaultCell().setBorder(Rectangle.NO_BORDER);

        PdfPCell headerCell = new PdfPCell(new Phrase(title, headingFont));
        headerCell.setBackgroundColor(COLOR_SECTION_HEADER);
        headerCell.setPadding(10f);
        headerCell.setBorderColor(COLOR_BORDER);
        headerCell.setBorderWidthBottom(0.5f);
        table.addCell(headerCell);

        PdfPCell bodyCell = new PdfPCell();
        bodyCell.setPadding(10f);
        bodyCell.setBorderColor(COLOR_BORDER);
        bodyCell.setBorderWidthTop(0f);
        String[] paragraphs = text.split("\\n");
        for (String para : paragraphs) {
            String trimmed = para.trim();
            if (!trimmed.isEmpty()) {
                bodyCell.addElement(new Paragraph(trimmed, normalFont));
                bodyCell.addElement(new Paragraph(" "));
            }
        }
        table.addCell(bodyCell);
        document.add(table);
    }
}
