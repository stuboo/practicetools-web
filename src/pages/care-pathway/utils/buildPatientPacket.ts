import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import toast from 'react-hot-toast';
import { Step } from '../types';
import { oabCondition } from '../config/conditions/oab';
import { getTreatmentById } from '../config/treatmentCatalog';

/**
 * Creates a placeholder page for treatments without a PDF handout.
 */
async function createPlaceholderPage(treatmentName: string): Promise<PDFDocument> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const gray = rgb(0.4, 0.4, 0.4);

  page.drawText(treatmentName, { x: 72, y: 680, size: 18, font: helveticaBold, color: gray });
  page.drawText('Education materials for this treatment — discuss with your provider', {
    x: 72, y: 650, size: 12, font: helvetica, color: gray,
  });

  return doc;
}

type StepTreatment = {
  name: string;
  pdfPath: string | null;
};

/**
 * Creates a cover page for the patient education packet.
 */
async function createCoverPage(
  conditionName: string,
  pathwayKey: string | undefined,
  stepTreatments: StepTreatment[],
): Promise<PDFDocument> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const darkGray = rgb(0.2, 0.2, 0.2);
  const medGray = rgb(0.4, 0.4, 0.4);
  const lightGray = rgb(0.6, 0.6, 0.6);
  const accentBlue = rgb(0.2, 0.4, 0.7);

  let y = 680;
  page.drawText('Patient Education Materials', { x: 72, y, size: 24, font: helveticaBold, color: darkGray });
  y -= 8;
  page.drawLine({ start: { x: 72, y }, end: { x: 540, y }, thickness: 2, color: accentBlue });
  y -= 32;
  page.drawText(conditionName, { x: 72, y, size: 14, font: helvetica, color: medGray });
  y -= 24;
  page.drawText(`Prepared: ${new Date().toLocaleDateString()}`, { x: 72, y, size: 11, font: helvetica, color: lightGray });

  if (pathwayKey) {
    y -= 18;
    page.drawText(`Pathway Key: ${pathwayKey}`, { x: 72, y, size: 11, font: helvetica, color: lightGray });
  }

  y -= 40;
  page.drawText('Included Treatments:', { x: 72, y, size: 13, font: helveticaBold, color: darkGray });
  y -= 24;
  for (const { name } of stepTreatments) {
    if (y < 72) break;
    page.drawText(`  •  ${name}`, { x: 80, y, size: 11, font: helvetica, color: medGray });
    y -= 18;
  }

  return doc;
}

/**
 * Builds the patient education PDF packet: cover page + handouts in pathway order.
 * Shared by both the builder view (PatientEducationOutput) and lookup view (PathwayLookup).
 */
export async function buildPatientPacket(
  steps: Step[],
  pathwayKey: string | undefined,
): Promise<Uint8Array> {
  const finalDoc = await PDFDocument.create();

  const stepTreatments: StepTreatment[] = steps.map((step) => {
    const treatment = getTreatmentById(oabCondition, step.treatmentId);
    return {
      name: treatment?.name ?? step.treatmentId,
      pdfPath: treatment?.pdfHandoutPath ?? null,
    };
  });

  // Cover page
  const coverDoc = await createCoverPage(oabCondition.name, pathwayKey, stepTreatments);
  const coverPages = await finalDoc.copyPages(coverDoc, coverDoc.getPageIndices());
  coverPages.forEach((page) => finalDoc.addPage(page));

  // Merge handouts in pathway sequence order
  const warnings: string[] = [];

  for (const { name, pdfPath } of stepTreatments) {
    if (!pdfPath) {
      const placeholderDoc = await createPlaceholderPage(name);
      const pages = await finalDoc.copyPages(placeholderDoc, placeholderDoc.getPageIndices());
      pages.forEach((page) => finalDoc.addPage(page));
      continue;
    }

    try {
      const pdfBytes = await fetch(pdfPath).then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.arrayBuffer();
      });
      const handoutDoc = await PDFDocument.load(pdfBytes);
      const pages = await finalDoc.copyPages(handoutDoc, handoutDoc.getPageIndices());
      pages.forEach((page) => finalDoc.addPage(page));
    } catch (err) {
      console.warn(`Failed to load PDF for ${name}:`, err);
      warnings.push(name);
      const placeholderDoc = await createPlaceholderPage(name);
      const pages = await finalDoc.copyPages(placeholderDoc, placeholderDoc.getPageIndices());
      pages.forEach((page) => finalDoc.addPage(page));
    }
  }

  if (warnings.length > 0) {
    toast.error(
      `Could not load handouts for: ${warnings.join(', ')}. Placeholder pages inserted.`,
      { duration: 5000 },
    );
  }

  return finalDoc.save();
}
