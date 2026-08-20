import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BulletinResponse } from '../../core/bulletin-competence.service';

/**
 * Génération du Bulletin de Compétences Individuel (miroir React bulletinCompetencesPdfGenerator.js).
 * Rendu 100% natif jsPDF + autoTable (pas de html2canvas). Couleurs hex/rgb uniquement.
 */
const PRIMARY: [number, number, number] = [0, 48, 87];
const SECONDARY: [number, number, number] = [100, 100, 100];
const BORDER: [number, number, number] = [210, 210, 210];
const SUCCESS: [number, number, number] = [39, 174, 96];
const WARNING: [number, number, number] = [243, 156, 18];
const DANGER: [number, number, number] = [192, 57, 43];
const LIGHT_BG: [number, number, number] = [248, 249, 250];

export function generateBulletinPdf(data: BulletinResponse, onProgress?: (pct: number) => void): jsPDF {
  const doc = new jsPDF();
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - 2 * margin;

  const notify = (pct: number) => onProgress?.(pct);
  notify(10);

  let y = margin;

  const addFooter = () => {
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      const fy = doc.internal.pageSize.getHeight() - 15;
      doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
      doc.setLineWidth(0.3);
      doc.line(margin, fy - 5, pageWidth - margin, fy - 5);
      doc.setFontSize(7);
      doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
      doc.text('Softwell - Bulletin de compétences individuel - Confidentiel', pageWidth / 2, fy, { align: 'center' });
      doc.text(`Page ${i} / ${pages}`, pageWidth - margin, fy, { align: 'right' });
    }
  };

  const checkPageBreak = (needed: number): void => {
    if (y + needed > pageHeight - margin) {
      addFooter();
      doc.addPage();
      y = margin;
    }
  };

  // ─── 1. EN-TÊTE ───
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('SOFTWELL', margin, y + 8);

  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const refStr = `BULL-CPT-${data.employeeId}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  doc.setFontSize(8);
  doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
  doc.text(`Réf: ${refStr}`, pageWidth - margin, y + 3, { align: 'right' });
  doc.text(`Date: ${dateStr}`, pageWidth - margin, y + 10, { align: 'right' });

  y += 18;
  doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;

  // ─── 2. TITRE ───
  doc.setFontSize(18);
  doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('BULLETIN DE COMPÉTENCES INDIVIDUEL', pageWidth / 2, y, { align: 'center' });
  y += 12;

  // ─── 3. INFORMATIONS EMPLOYÉ ───
  doc.setFillColor(LIGHT_BG[0], LIGHT_BG[1], LIGHT_BG[2]);
  doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
  doc.roundedRect(margin, y, contentWidth, 32, 2, 2, 'FD');
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.text("INFORMATIONS DE L'EMPLOYÉ", pageWidth / 2, y, { align: 'center' });
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  const colLeft = margin + 8;
  const colRight = pageWidth / 2 + 15;
  doc.text(`Nom : ${data.employeeName} ${data.employeeFirstName}`, colLeft, y);
  doc.text(`Matricule : ${data.registrationNumber || 'N/A'}`, colRight, y);
  y += 6;
  doc.text(`Département : ${data.departmentName || 'Non défini'}`, colLeft, y);

  y += 14;

  // ─── 4. RÉSUMÉ STATISTIQUE ───
  notify(25);
  const masteredPct = data.totalSkills > 0 ? Math.round((data.masteredCount / data.totalSkills) * 100) : 0;
  const inProgressPct = data.totalSkills > 0 ? Math.round((data.inProgressCount / data.totalSkills) * 100) : 0;
  const notAcquiredPct = data.totalSkills > 0 ? Math.round((data.notAcquiredCount / data.totalSkills) * 100) : 0;

  const statBoxHeight = 45;
  checkPageBreak(statBoxHeight + 10);

  doc.setFillColor(LIGHT_BG[0], LIGHT_BG[1], LIGHT_BG[2]);
  doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
  doc.roundedRect(margin, y, contentWidth, statBoxHeight, 2, 2, 'FD');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.text('SYNTHÈSE DES COMPÉTENCES', pageWidth / 2, y + 8, { align: 'center' });

  const blockW = (contentWidth - 40) / 3;
  const blockY = y + 14;
  const labels = [
    { label: 'Maîtrisées', count: data.masteredCount, color: SUCCESS },
    { label: "En cours d'acquisition", count: data.inProgressCount, color: WARNING },
    { label: 'Non acquises', count: data.notAcquiredCount, color: DANGER },
  ];
  labels.forEach((item, idx) => {
    const bx = margin + 10 + idx * (blockW + 10);
    doc.setFillColor(item.color[0], item.color[1], item.color[2]);
    doc.roundedRect(bx, blockY, blockW, 24, 2, 2, 'F');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(String(item.count), bx + blockW / 2, blockY + 12, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(item.label, bx + blockW / 2, blockY + 20, { align: 'center' });
  });

  y += statBoxHeight + 12;

  // ─── 5. COMPÉTENCES PAR DOMAINE ───
  notify(40);
  const domains = data.domains || [];
  if (!domains.length) {
    doc.setFontSize(10);
    doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
    doc.text('Aucune compétence enregistrée pour cet employé.', pageWidth / 2, y, { align: 'center' });
  } else {
    for (const domain of domains) {
      const allSkills = domain.skills || [];

      checkPageBreak(30);
      doc.setFillColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
      doc.roundedRect(margin, y, contentWidth, 10, 1, 1, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      const domainTitle = `${(domain.domainName || 'Non spécifié').toUpperCase()} (${allSkills.length} compétence${allSkills.length > 1 ? 's' : ''})`;
      doc.text(domainTitle, margin + 5, y + 7);
      y += 14;

      const mastered = allSkills.filter((s) => s.classification === 'maitrisee');
      const inProgress = allSkills.filter((s) => s.classification === 'en_cours');
      const notAcquired = allSkills.filter((s) => s.classification === 'non_acquise');
      const sections = [
        { label: 'COMPÉTENCES MAÎTRISÉES', items: mastered, color: SUCCESS },
        { label: "COMPÉTENCES EN COURS D'ACQUISITION", items: inProgress, color: WARNING },
        { label: 'COMPÉTENCES NON ACQUISES', items: notAcquired, color: DANGER },
      ];

      for (const section of sections) {
        if (section.items.length === 0) continue;

        checkPageBreak(20);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(section.color[0], section.color[1], section.color[2]);
        doc.text(`• ${section.label} (${section.items.length})`, margin + 3, y);
        y += 6;

        const tableHeaders = [['Compétence', 'Niveau', 'Progression', 'Dernière mise à jour']];
        const tableData = section.items.map((skill) => [
          skill.skillName,
          skill.classificationLabel,
          `${Math.round(skill.level)}%`,
          skill.lastUpdated ? new Date(skill.lastUpdated).toLocaleDateString('fr-FR') : 'N/A',
        ]);

        autoTable(doc, {
          head: tableHeaders,
          body: tableData,
          startY: y,
          margin: { left: margin + 3, right: margin + 3 },
          headStyles: {
            fillColor: [section.color[0], section.color[1], section.color[2]],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8,
          },
          bodyStyles: { fontSize: 8 },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          theme: 'grid',
          columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 55 },
            2: { cellWidth: 30, halign: 'center' },
            3: { cellWidth: 45 },
          },
        });
        y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 6;
      }

      y += 4;
    }
  }

  // ─── 6. LÉGENDE ───
  notify(80);
  checkPageBreak(30);

  doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.text('LÉGENDE', margin, y);
  y += 5;

  const legendItems = [
    { label: 'Maîtrisée (>= 70%)', color: SUCCESS },
    { label: 'En cours (40% - 69%)', color: WARNING },
    { label: 'Non acquise (< 40%)', color: DANGER },
  ];
  const legendColWidth = contentWidth / 2;
  legendItems.forEach((item, idx) => {
    const row = idx < 2 ? 0 : 1;
    const col = idx < 2 ? idx : 0;
    const lx = margin + 8 + col * legendColWidth;
    const ly = y + row * 11;
    doc.setFillColor(item.color[0], item.color[1], item.color[2]);
    doc.roundedRect(lx, ly, 7, 7, 1, 1, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text(item.label, lx + 11, ly + 5.5);
  });
  y += legendItems.length > 2 ? 26 : 16;
  y += 14;

  // ─── 7. SIGNATURES ───
  checkPageBreak(30);
  doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
  doc.text('Document généré le ' + dateStr, margin, y);
  y += 5;
  doc.text("Ce bulletin reflète l'état des compétences de l'employé à la date de génération.", margin, y);

  y += 20;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  const sigW = 70;
  doc.line(margin, y, margin + sigW, y);
  doc.line(pageWidth - margin - sigW, y, pageWidth - margin, y);
  y += 4;
  doc.setFontSize(7);
  doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
  doc.text("L'employé", margin, y);
  doc.text('Le responsable RH', pageWidth - margin - sigW, y);

  addFooter();
  notify(100);
  return doc;
}

export function downloadBulletinPdf(data: BulletinResponse, onProgress?: (pct: number) => void): string {
  const doc = generateBulletinPdf(data, onProgress);
  const fileName = `bulletin_competences_${data.registrationNumber || data.employeeId}_${Date.now()}.pdf`;
  doc.save(fileName);
  return fileName;
}

export function previewBulletinPdf(data: BulletinResponse, onProgress?: (pct: number) => void): string {
  const doc = generateBulletinPdf(data, onProgress);
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}
