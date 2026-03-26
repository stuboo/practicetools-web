import { useState } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { FileText, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { oabCondition } from '../config/conditions/oab';
import { getTreatmentById } from '../config/treatmentCatalog';
import type { PathwayState } from '../index';

type PatientEducationOutputProps = {
  state: PathwayState;
};

/**
 * Creates a cover page for the patient education packet using pdf-lib.
 * Generates a clean, professional cover with pathway info and treatment list.
 */
async function createCoverPage(
  state: PathwayState,
  treatmentNames: string[],
): Promise<PDFDocument> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]); // Letter size
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const darkGray = rgb(0.2, 0.2, 0.2);
  const medGray = rgb(0.4, 0.4, 0.4);
  const lightGray = rgb(0.6, 0.6, 0.6);
  const accentBlue = rgb(0.2, 0.4, 0.7);

  let y = 680;

  // Title
  page.drawText('Patient Education Materials', {
    x: 72,
    y,
    size: 24,
    font: helveticaBold,
    color: darkGray,
  });

  y -= 8;
  // Accent line
  page.drawLine({
    start: { x: 72, y },
    end: { x: 540, y },
    thickness: 2,
    color: accentBlue,
  });

  // Condition
  y -= 32;
  page.drawText(oabCondition.name, {
    x: 72,
    y,
    size: 14,
    font: helvetica,
    color: medGray,
  });

  // Date
  y -= 24;
  page.drawText(`Prepared: ${new Date().toLocaleDateString()}`, {
    x: 72,
    y,
    size: 11,
    font: helvetica,
    color: lightGray,
  });

  // Key (if saved)
  if (state.key) {
    y -= 18;
    page.drawText(`Pathway Key: ${state.key}`, {
      x: 72,
      y,
      size: 11,
      font: helvetica,
      color: lightGray,
    });
  }

  // Included treatments header
  y -= 40;
  page.drawText('Included Treatments:', {
    x: 72,
    y,
    size: 13,
    font: helveticaBold,
    color: darkGray,
  });

  // Treatment list
  y -= 24;
  for (const name of treatmentNames) {
    if (y < 72) break; // Don't overflow the page
    page.drawText(`  •  ${name}`, {
      x: 80,
      y,
      size: 11,
      font: helvetica,
      color: medGray,
    });
    y -= 18;
  }

  return doc;
}

/**
 * Creates a placeholder page for treatments without a PDF handout.
 */
async function createPlaceholderPage(
  treatmentName: string,
): Promise<PDFDocument> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const gray = rgb(0.4, 0.4, 0.4);

  page.drawText(treatmentName, {
    x: 72,
    y: 680,
    size: 18,
    font: helveticaBold,
    color: gray,
  });

  page.drawText('Education materials for this treatment — discuss with your provider', {
    x: 72,
    y: 650,
    size: 12,
    font: helvetica,
    color: gray,
  });

  return doc;
}

/**
 * Builds the patient education PDF packet: cover page + handouts in pathway order.
 */
async function buildPatientPacket(state: PathwayState): Promise<Uint8Array> {
  const finalDoc = await PDFDocument.create();

  // Gather treatment info in step order
  const stepTreatments = state.steps.map((step) => {
    const treatment = getTreatmentById(oabCondition, step.treatmentId);
    return {
      name: treatment?.name ?? step.treatmentId,
      pdfPath: treatment?.pdfHandoutPath ?? null,
    };
  });

  // Create and merge cover page
  const coverDoc = await createCoverPage(
    state,
    stepTreatments.map((t) => t.name),
  );
  const coverPages = await finalDoc.copyPages(coverDoc, coverDoc.getPageIndices());
  coverPages.forEach((page) => finalDoc.addPage(page));

  // Merge handouts in pathway sequence order
  const warnings: string[] = [];

  for (const { name, pdfPath } of stepTreatments) {
    if (!pdfPath) {
      // No PDF linked — insert placeholder
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
      // Insert placeholder for failed load
      const placeholderDoc = await createPlaceholderPage(name);
      const pages = await finalDoc.copyPages(placeholderDoc, placeholderDoc.getPageIndices());
      pages.forEach((page) => finalDoc.addPage(page));
    }
  }

  // Show toast warnings for failed PDFs
  if (warnings.length > 0) {
    toast.error(
      `Could not load handouts for: ${warnings.join(', ')}. Placeholder pages inserted.`,
      { duration: 5000 },
    );
  }

  return finalDoc.save();
}

export function PatientEducationOutput({ state }: PatientEducationOutputProps) {
  const [building, setBuilding] = useState(false);

  const disabled = state.steps.length === 0;
  const key = state.key || 'draft';

  async function handleBuild() {
    setBuilding(true);
    try {
      const pdfBytes = await buildPatientPacket(state);
      saveAs(
        new Blob([pdfBytes], { type: 'application/pdf' }),
        `patient-education-${key}.pdf`,
      );
    } catch (err) {
      console.error('Failed to build patient packet:', err);
      toast.error('Failed to build patient packet. Please try again.');
    } finally {
      setBuilding(false);
    }
  }

  // Treatment list for display
  const treatments = state.steps
    .map((step) => getTreatmentById(oabCondition, step.treatmentId))
    .filter(Boolean);

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-700">Patient Education</h3>
          {!disabled && (
            <span className="text-xs text-gray-400">
              {treatments.length} handout{treatments.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <button
          onClick={handleBuild}
          disabled={disabled || building}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-colors ${
            disabled || building
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {building ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Building...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Build Patient Packet
            </>
          )}
        </button>
      </div>
    </div>
  );
}
