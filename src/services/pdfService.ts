import { jsPDF } from 'jspdf';
import { OFFICIAL_RULES_SECTIONS, OFFICIAL_RULES_TITLE } from '../data/officialRules';
import { OFFICIAL_CREST_LOGO_DATA_URI } from './pdfLogoData';

export interface PdfDownloadResult {
  success: boolean;
  filename: string;
  pages: number;
}

const PDF_FILENAME = 'Reglamento_Oficial_Pena_Primitiva_Tordueles.pdf';
let cachedRgbaLogoUri: string | null = null;

function convertImageToRgbaDataUri(img: HTMLImageElement): string | null {
  try {
    if (!img.complete || !img.naturalWidth || !img.naturalHeight) return null;
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#0A2540';
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

function preloadOfficialCrestLogo() {
  if (typeof window === 'undefined' || typeof Image === 'undefined') return;
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const converted = convertImageToRgbaDataUri(img);
      if (converted) cachedRgbaLogoUri = converted;
    };
    img.src = './assets/logo.png';
  } catch {
    // Usar respaldo síncrono integrado
  }
}

preloadOfficialCrestLogo();

function getBestSyncLogoDataUri(): string {
  if (cachedRgbaLogoUri) return cachedRgbaLogoUri;

  if (typeof document !== 'undefined') {
    const domLogo = document.querySelector<HTMLImageElement>(
      'img[src*="splash-logo"], img[src*="assets/logo"], img[src*="logo"]'
    );
    if (domLogo) {
      const fromDom = convertImageToRgbaDataUri(domLogo);
      if (fromDom) {
        cachedRgbaLogoUri = fromDom;
        return fromDom;
      }
    }
  }

  return OFFICIAL_CREST_LOGO_DATA_URI;
}

/**
 * Genera físicamente el documento PDF A4 multipágina con el Reglamento Oficial íntegro
 * y dispara la descarga directa al almacenamiento del dispositivo (sin abrir menús de impresión).
 */
export function downloadOfficialRulesPdf(): PdfDownloadResult {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm
  const marginX = 16;
  const contentWidth = pageWidth - marginX * 2;
  const bottomLimit = pageHeight - 18;

  let y = 0;

  // Cabecera corporativa en la página 1 con logotipo oficial destacado
  doc.setFillColor(10, 37, 64); // #0A2540
  doc.rect(0, 0, pageWidth, 38, 'F');

  doc.setFillColor(255, 107, 0); // #FF6B00
  doc.rect(0, 38, pageWidth, 1.8, 'F');

  try {
    const logoUri = getBestSyncLogoDataUri();
    doc.addImage(logoUri, 'PNG', marginX, 5, 28, 28);
  } catch {
    // Continuar con cabecera tipográfica si falla la imagen
  }

  const headerTextX = marginX + 33;

  doc.setTextColor(255, 107, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('DOCUMENTO OFICIAL VINCULANTE', headerTextX, 12.5);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Peña La Primitiva Tordueles', headerTextX, 20.5);

  doc.setTextColor(226, 232, 240);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`${OFFICIAL_RULES_TITLE} · Tordueles (Burgos)`, headerTextX, 28);

  y = 48;

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > bottomLimit) {
      doc.addPage();
      y = 18;
    }
  };

  for (let sIdx = 0; sIdx < OFFICIAL_RULES_SECTIONS.length; sIdx++) {
    const section = OFFICIAL_RULES_SECTIONS[sIdx];

    // Cabecera de artículo (evitar que quede huérfano al final de la página)
    ensureSpace(22);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(10, 37, 64);
    const titleLines = doc.splitTextToSize(
      `${section.articleNumber}. ${section.title}`,
      contentWidth
    );
    doc.text(titleLines, marginX, y);
    y += titleLines.length * 5.6 + 1;

    doc.setDrawColor(255, 107, 0);
    doc.setLineWidth(0.5);
    doc.line(marginX, y, marginX + 26, y);
    y += 5;

    for (let pIdx = 0; pIdx < section.paragraphs.length; pIdx++) {
      const p = section.paragraphs[pIdx];
      const fullParagraph = p.code ? `${p.code} ${p.heading || ''} ${p.text}` : p.text;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);

      const lines = doc.splitTextToSize(fullParagraph, contentWidth);
      const lineHeight = 4.9;

      // Imprimir línea a línea con salto de página limpio si un párrafo largo cruza el borde
      for (let lIdx = 0; lIdx < lines.length; lIdx++) {
        ensureSpace(lineHeight + 2);
        doc.text(lines[lIdx], marginX, y);
        y += lineHeight;
      }

      y += 2.2;

      if (p.subText) {
        const subLines = doc.splitTextToSize(p.subText, contentWidth);
        for (let sLineIdx = 0; sLineIdx < subLines.length; sLineIdx++) {
          ensureSpace(lineHeight + 2);
          doc.text(subLines[sLineIdx], marginX, y);
          y += lineHeight;
        }
        y += 1.8;
      }

      if (p.bullets && p.bullets.length > 0) {
        for (let bIdx = 0; bIdx < p.bullets.length; bIdx++) {
          const bulletText = `•  ${p.bullets[bIdx]}`;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9.5);
          doc.setTextColor(15, 23, 42);

          const bulletLines = doc.splitTextToSize(bulletText, contentWidth - 8);
          const bLineHeight = 4.6;
          ensureSpace(bulletLines.length * bLineHeight + 2);
          doc.text(bulletLines, marginX + 5, y);
          y += bulletLines.length * bLineHeight + 1.5;
        }
        y += 2;
      }
    }

    y += 4;
  }

  // Pie de página en todas las hojas
  const totalPages = doc.getNumberOfPages();
  const dateLabel = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 13, pageWidth - marginX, pageHeight - 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Peña La Primitiva Tordueles · Reglamento Oficial (${dateLabel})`,
      marginX,
      pageHeight - 8
    );
    doc.text(`Página ${page} de ${totalPages}`, pageWidth - marginX, pageHeight - 8, {
      align: 'right',
    });
  }

  // Descarga física directa como Blob PDF (sin menú de impresión)
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = PDF_FILENAME;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    if (link.parentNode) {
      link.parentNode.removeChild(link);
    }
    URL.revokeObjectURL(blobUrl);
  }, 2000);

  return {
    success: true,
    filename: PDF_FILENAME,
    pages: totalPages,
  };
}
