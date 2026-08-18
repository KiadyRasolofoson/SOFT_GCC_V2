import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { EvaluationDetails, NotationValidation, ratingLabel, SelectedQuestion, TrainingSuggestion } from './evaluation.models';

export interface EvaluationPdfData {
  evaluation: EvaluationDetails;
  questions: SelectedQuestion[];
  ratings: Record<number, number>;
  comments: Record<number, string>;
  average: number;
  validation: NotationValidation;
  suggestions: TrainingSuggestion[];
  strengths: string;
  weaknesses: string;
  generalEvaluation: string;
}

const NAVY: [number, number, number] = [15, 23, 42];
const ACCENT: [number, number, number] = [99, 102, 241];
const SLATE: [number, number, number] = [100, 116, 139];
const LINE: [number, number, number] = [226, 232, 240];

export function buildEvaluationPdf(data: EvaluationPdfData): jsPDF {
  const doc = new jsPDF();
  const margin = 18;
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = margin;

  doc.setFontSize(10);
  doc.setTextColor(...SLATE);
  doc.text('SOFT GCC — Compétences & Carrières', margin, y);
  doc.text(`Réf. EVAL-${data.evaluation.evaluationId}`, pageWidth - margin, y, { align: 'right' });
  y += 6;
  doc.text(new Date().toLocaleDateString('fr-FR'), pageWidth - margin, y, { align: 'right' });
  y += 8;

  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;

  doc.setFontSize(16);
  doc.setTextColor(...NAVY);
  doc.text('Fiche d’évaluation des compétences', pageWidth / 2, y, { align: 'center' });
  y += 8;
  doc.setFontSize(11);
  doc.setTextColor(...ACCENT);
  doc.text(data.evaluation.title || 'Évaluation', pageWidth / 2, y, { align: 'center' });
  y += 12;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...LINE);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 28, 2, 2, 'FD');
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text(`Employé : ${data.evaluation.employeeName}`, margin + 6, y + 8);
  doc.text(`Poste : ${data.evaluation.position || '—'}`, margin + 6, y + 16);
  doc.text(`Département : ${data.evaluation.department || '—'}`, margin + 6, y + 24);
  doc.text(`Note moyenne : ${data.average.toFixed(2)} / 5  (${ratingLabel(data.average)})`, pageWidth / 2 + 8, y + 16);
  y += 38;

  const rows = data.questions.map((question, index) => [
    String(index + 1),
    question.questionText || `Question ${question.questionId}`,
    question.competenceName || '—',
    `${data.ratings[question.questionId] ?? 0} / 5`,
    data.comments[question.questionId] || '—',
  ]);

  autoTable(doc, {
    startY: y,
    head: [['#', 'Question', 'Compétence', 'Note', 'Commentaire']],
    body: rows,
    styles: { fontSize: 8, textColor: NAVY, cellPadding: 3 },
    headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 70 },
      2: { cellWidth: 32 },
      3: { cellWidth: 18 },
    },
    margin: { left: margin, right: margin },
  });

  y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 12;

  const ensureSpace = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = margin;
    }
  };

  ensureSpace(40);
  doc.setFontSize(12);
  doc.setTextColor(...NAVY);
  doc.text('Appréciation', margin, y);
  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(...SLATE);
  const remarks = [
    `Points forts : ${data.strengths || '—'}`,
    `Axes d’amélioration : ${data.weaknesses || '—'}`,
    `Commentaire général : ${data.generalEvaluation || '—'}`,
  ];
  for (const line of remarks) {
    const wrapped = doc.splitTextToSize(line, pageWidth - margin * 2);
    ensureSpace(wrapped.length * 5 + 4);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 5 + 4;
  }

  if (data.suggestions.length) {
    ensureSpace(20);
    doc.setFontSize(12);
    doc.setTextColor(...NAVY);
    doc.text('Suggestions de formation', margin, y);
    y += 6;
    autoTable(doc, {
      startY: y,
      head: [['Question', 'Formation', 'Détails']],
      body: data.suggestions.map((item) => [item.question, item.training, item.details]),
      styles: { fontSize: 8, textColor: NAVY },
      headStyles: { fillColor: ACCENT, textColor: [255, 255, 255] },
      margin: { left: margin, right: margin },
    });
    y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 12;
  }

  ensureSpace(28);
  doc.setFontSize(12);
  doc.setTextColor(...NAVY);
  doc.text('Validation', margin, y);
  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(...SLATE);
  const expert = data.validation.serviceApproved
    ? `Validé le ${formatDate(data.validation.serviceDate)}`
    : 'Non validé';
  const hierarchy = data.validation.dgApproved
    ? `Prise de connaissance le ${formatDate(data.validation.dgDate)}`
    : 'Non renseignée';
  doc.text(`Évaluateur expert : ${expert}`, margin, y);
  y += 6;
  doc.text(`Hiérarchie : ${hierarchy}`, margin, y);

  return doc;
}

export function evaluationPdfBlob(data: EvaluationPdfData): Blob {
  return buildEvaluationPdf(data).output('blob');
}

export function downloadEvaluationPdf(data: EvaluationPdfData): void {
  const fileName = `evaluation_${data.evaluation.evaluationId}_${Date.now()}.pdf`;
  buildEvaluationPdf(data).save(fileName);
}

function formatDate(value: string): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('fr-FR');
}
