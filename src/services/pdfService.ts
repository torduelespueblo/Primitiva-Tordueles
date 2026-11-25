import { jsPDF } from 'jspdf';
import { getOfficialRulesSections, OFFICIAL_RULES_TITLE } from '../data/officialRules';
import { OFFICIAL_CREST_LOGO_DATA_URI } from './pdfLogoData';
import { Player } from '../types/lottery';

export interface PdfDownloadResult {
  success: boolean;
  filename: string;
  pages: number;
}

const PDF_FILENAME = 'Reglamento_Oficial_Pena_Primitiva_Tordueles.pdf';
let cachedRgbaLogoUri: string | null = null;

function convertImageToTransparentSilhouette(img: HTMLImageElement): string | null {
  try {
    if (!img.complete || !img.naturalWidth || !img.naturalHeight) return null;
    const size = 300;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);
    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;

    // Eliminar fondo blanco/claro y convertir la silueta a color corporativo #0A2540
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      const brightness = (r + g + b) / 3;
      if (brightness > 230 || a < 25) {
        data[i + 3] = 0; // Transparente total para el fondo
      } else {
        data[i] = 10;   // R (#0A2540)
        data[i + 1] = 37; // G
        data[i + 2] = 64; // B
        data[i + 3] = Math.min(255, a * 1.3); // Opacidad del trazo
      }
    }

    ctx.putImageData(imgData, 0, 0);
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
      const converted = convertImageToTransparentSilhouette(img);
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
      const fromDom = convertImageToTransparentSilhouette(domLogo);
      if (fromDom) {
        cachedRgbaLogoUri = fromDom;
        return fromDom;
      }
    }
  }

  return OFFICIAL_CREST_LOGO_DATA_URI;
}

function drawWatermark(doc: jsPDF, pageWidth: number, pageHeight: number) {
  try {
    const logoUri = getBestSyncLogoDataUri();
    const gStateClass = (doc as any).GState;
    if (gStateClass) {
      (doc as any).setGState(new gStateClass({ opacity: 0.05 }));
    }
    const imgSize = 138; // Aumentado a 138 mm para ocupar una zona amplia y central
    const imgX = (pageWidth - imgSize) / 2;
    const imgY = (pageHeight - imgSize) / 2;
    doc.addImage(logoUri, 'PNG', imgX, imgY, imgSize, imgSize);
    if (gStateClass) {
      (doc as any).setGState(new gStateClass({ opacity: 1.0 }));
    }
  } catch {
    // Continuar sin marca de agua si falla
  }
}

/**
 * Genera físicamente el documento PDF A4 multipágina con el Reglamento Oficial íntegro
 * (con ciclo dinámico y marca de agua corporativa transparente de gran tamaño en el centro de cada hoja)
 * y dispara la descarga directa al almacenamiento del dispositivo.
 */
export function downloadOfficialRulesPdf(cycleLength: number = 10): PdfDownloadResult {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm
  const marginX = 17;
  const contentWidth = pageWidth - marginX * 2;
  const bottomLimit = pageHeight - 18;

  let y = 0;

  // Dibujar marca de agua en la página 1
  drawWatermark(doc, pageWidth, pageHeight);

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
      drawWatermark(doc, pageWidth, pageHeight);
      y = 19;
    }
  };

  const rulesSections = getOfficialRulesSections(cycleLength);

  for (let sIdx = 0; sIdx < rulesSections.length; sIdx++) {
    const section = rulesSections[sIdx];

    // Separación visual y salto de página inteligente para evitar títulos huérfanos
    if (sIdx > 0) {
      ensureSpace(30);
      if (y > 24) {
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.35);
        doc.line(marginX, y + 0.5, pageWidth - marginX, y + 0.5);
        y += 6;
      }
    } else {
      ensureSpace(26);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13.5);
    doc.setTextColor(10, 37, 64);
    const titleLines = doc.splitTextToSize(
      `${section.articleNumber}. ${section.title}`,
      contentWidth
    );
    doc.text(titleLines, marginX, y);
    y += titleLines.length * 6.0 + 1.5;

    doc.setDrawColor(255, 107, 0);
    doc.setLineWidth(0.7);
    doc.line(marginX, y, marginX + 28, y);
    y += 5.0;

    for (let pIdx = 0; pIdx < section.paragraphs.length; pIdx++) {
      const p = section.paragraphs[pIdx];
      const bodyFontSize = 11.5;
      const lineHeight = 5.45;

      if (p.code) {
        const headingLabel = `${p.code} ${p.heading || ''}`.trim();
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(bodyFontSize);
        const headingLines = doc.splitTextToSize(headingLabel, contentWidth);

        // Asegurar que el título del apartado vaya acompañado al menos de las 2 primeras líneas
        ensureSpace(headingLines.length * lineHeight + lineHeight * 2 + 2);

        doc.setTextColor(10, 37, 64);
        doc.text(headingLines, marginX, y);
        y += headingLines.length * lineHeight + 0.6;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(bodyFontSize);
        doc.setTextColor(30, 41, 59);
        const textLines = doc.splitTextToSize(p.text, contentWidth);
        for (let lIdx = 0; lIdx < textLines.length; lIdx++) {
          ensureSpace(lineHeight + 1.2);
          doc.text(textLines[lIdx], marginX, y);
          y += lineHeight;
        }
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(bodyFontSize);
        doc.setTextColor(30, 41, 59);
        const textLines = doc.splitTextToSize(p.text, contentWidth);
        for (let lIdx = 0; lIdx < textLines.length; lIdx++) {
          ensureSpace(lineHeight + 1.2);
          doc.text(textLines[lIdx], marginX, y);
          y += lineHeight;
        }
      }

      y += 2.8;

      if (p.subText) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(51, 65, 85);
        const subLines = doc.splitTextToSize(p.subText, contentWidth);
        ensureSpace(subLines.length * 5.2 + 2);
        doc.text(subLines, marginX, y);
        y += subLines.length * 5.2 + 2.0;
      }

      if (p.bullets && p.bullets.length > 0) {
        for (let bIdx = 0; bIdx < p.bullets.length; bIdx++) {
          const bulletText = p.bullets[bIdx];
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10.8);

          const bulletLines = doc.splitTextToSize(bulletText, contentWidth - 8);
          const bLineHeight = 5.1;
          ensureSpace(bulletLines.length * bLineHeight + 2.0);

          doc.setFillColor(255, 107, 0);
          doc.circle(marginX + 3.2, y - 1.3, 0.9, 'F');

          doc.setTextColor(15, 23, 42);
          doc.text(bulletLines, marginX + 8, y);
          y += bulletLines.length * bLineHeight + 2.0;
        }
        y += 1.8;
      }
    }

    y += 2.5;
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

export function downloadPlayerListPdf(
  listType: 'TITULAR' | 'SUPLENTE' | 'BAJA' | 'ALL',
  players: Player[],
  cycleNumber: number = 1
): PdfDownloadResult {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 15;
  const contentWidth = pageWidth - marginX * 2;
  const bottomLimit = pageHeight - 20;

  let y = 0;

  drawWatermark(doc, pageWidth, pageHeight);

  // Cabecera corporativa
  doc.setFillColor(10, 37, 64); // #0A2540
  doc.rect(0, 0, pageWidth, 38, 'F');

  doc.setFillColor(255, 107, 0); // #FF6B00
  doc.rect(0, 38, pageWidth, 1.8, 'F');

  try {
    const logoUri = getBestSyncLogoDataUri();
    doc.addImage(logoUri, 'PNG', marginX, 5, 28, 28);
  } catch {}

  const headerTextX = marginX + 33;
  doc.setTextColor(255, 107, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('DOCUMENTO OFICIAL DE ADMINISTRACIÓN', headerTextX, 12.5);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('Peña La Primitiva Tordueles', headerTextX, 20.5);

  const titleMap = {
    TITULAR: `Listado Oficial de Socios Titulares (Ciclo ${cycleNumber})`,
    SUPLENTE: 'Listado Oficial de Lista de Espera / Suplentes',
    BAJA: 'Listado Histórico de Bajas Definitivas',
    ALL: `Listado General Completo de Socios (Ciclo ${cycleNumber})`,
  };

  doc.setTextColor(226, 232, 240);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`${titleMap[listType]} · Tordueles (Burgos)`, headerTextX, 28);

  y = 48;

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > bottomLimit) {
      doc.addPage();
      drawWatermark(doc, pageWidth, pageHeight);
      y = 19;
    }
  };

  const filtered = players.filter(p => listType === 'ALL' || p.status === listType);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(10, 37, 64);
  doc.text(`Total Registros: ${filtered.length}`, marginX, y);
  y += 7;

  // Tabla cabecera
  doc.setFillColor(244, 246, 249);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.rect(marginX, y, contentWidth, 8, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(10, 37, 64);
  doc.text('N.º', marginX + 3, y + 5.5);
  doc.text('Nombre y Apellidos', marginX + 15, y + 5.5);
  doc.text('Teléfono', marginX + 85, y + 5.5);
  doc.text('Categoría', marginX + 115, y + 5.5);
  doc.text('Estado Pago', marginX + 145, y + 5.5);

  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);

  filtered.forEach((p, index) => {
    ensureSpace(8);

    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(marginX, y - 4, contentWidth, 7, 'F');
    }

    doc.setTextColor(30, 41, 59);
    doc.text(String(index + 1), marginX + 3, y);
    doc.text(String(p.name || 'Sin nombre').substring(0, 38), marginX + 15, y);
    doc.text(String(p.phone || '-'), marginX + 85, y);
    doc.text(String(p.status || '-'), marginX + 115, y);
    doc.text(String(p.paymentStatusLabel || (p.currentCyclePaid ? 'Pagado' : 'Pendiente')), marginX + 145, y);

    y += 7;
  });

  if (filtered.length === 0) {
    ensureSpace(15);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text('No hay registros en esta categoría actualmente.', marginX + 5, y);
  }

  const totalPages = doc.getNumberOfPages();
  const dateLabel = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const filenameMap = {
    TITULAR: 'Socios_Titulares_Pena_Tordueles.pdf',
    SUPLENTE: 'Lista_Suplentes_Pena_Tordueles.pdf',
    BAJA: 'Bajas_Definitivas_Pena_Tordueles.pdf',
    ALL: 'Listado_General_Socios_Tordueles.pdf',
  };

  const filename = filenameMap[listType];

  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 13, pageWidth - marginX, pageHeight - 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Peña La Primitiva Tordueles · Listado de Administración (${dateLabel})`,
      marginX,
      pageHeight - 8
    );
    doc.text(`Página ${page} de ${totalPages}`, pageWidth - marginX, pageHeight - 8, {
      align: 'right',
    });
  }

  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    if (link.parentNode) link.parentNode.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  }, 2000);

  return {
    success: true,
    filename,
    pages: totalPages,
  };
}
