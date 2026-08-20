import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/** Jeton unique (UUID sans tirets, format attendu par le backend `Certificate/Save`). */
export function newToken(): string {
  return crypto.randomUUID().replaceAll('-', '');
}

/**
 * Génère le PDF A4 de l'attestation à partir de l'élément d'aperçu.
 * Rendu via html2canvas à largeur fixe puis placement sur UNE page (découpe
 * verticale propre si le contenu dépasse la page).
 */
export async function generateAttestationPdf(element: HTMLElement): Promise<Blob> {
  const targetWidthPx = 900;
  const scale = targetWidthPx / element.offsetWidth;

  const canvas = await html2canvas(element, {
    scale,
    backgroundColor: '#FFFFFF',
    useCORS: true,
    width: element.offsetWidth,
    windowWidth: document.documentElement.clientWidth,
  });

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 12;
  const contentW = pageW - margin * 2;
  const contentH = pageH - margin * 2;
  const imgW = contentW;
  const imgH = (canvas.height * imgW) / canvas.width;
  const pxPerMm = canvas.width / imgW;

  if (imgH <= contentH) {
    // Le document tient sur une seule page A4.
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.98), 'JPEG', margin, margin, imgW, imgH);
  } else {
    // Découpe verticale sur plusieurs pages, sans perte de contenu.
    let offsetMm = 0;
    let first = true;
    while (offsetMm < imgH) {
      const h = Math.min(contentH, imgH - offsetMm);
      const slice = document.createElement('canvas');
      slice.width = canvas.width;
      slice.height = Math.ceil(h * pxPerMm);
      const ctx = slice.getContext('2d')!;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(canvas, 0, -offsetMm * pxPerMm);
      if (!first) {
        pdf.addPage();
      }
      pdf.addImage(slice.toDataURL('image/jpeg', 0.98), 'JPEG', margin, margin, imgW, h);
      offsetMm += h;
      first = false;
    }
  }

  return pdf.output('blob');
}

export function pdfToFile(blob: Blob, reference: string): File {
  return new File([blob], `Attestation_${reference}.pdf`, { type: 'application/pdf' });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function toBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
