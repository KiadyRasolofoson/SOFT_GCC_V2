import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import logoPath from '../../../assets/images/Logo/softwellogo.png';

/**
 * Génère un Bulletin de Compétences Individuel standardisé.
 *
 * @param {Object} bulletinData - Données structurées du bulletin (BulletinResponse)
 * @param {Function} onProgress - Callback de progression (0-100)
 * @returns {Promise<jsPDF>} Document PDF généré
 */
export const generateBulletinPDF = async (bulletinData, onProgress = () => {}) => {
  const doc = new jsPDF();
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - 2 * margin;

  // Couleurs professionnelles
  const primaryColor = [0, 48, 87];    // Bleu foncé Softwell
  const secondaryColor = [100, 100, 100]; // Gris
  const borderColor = [210, 210, 210];
  const successColor = [39, 174, 96];   // Vert (maîtrisée)
  const warningColor = [243, 156, 18];  // Orange (en cours)
  const dangerColor = [192, 57, 43];    // Rouge (non acquise)
  const lightBg = [248, 249, 250];

  let y = margin;

  // ─── Préchargement du logo ───
  onProgress(5);
  try {
    const img = new Image();
    img.src = logoPath;
    await new Promise((resolve) => {
      if (img.complete) resolve();
      else {
        img.onload = resolve;
        img.onerror = () => { console.warn('Logo non chargé'); resolve(); };
      }
    });
  } catch (e) {
    console.warn('Erreur préchargement logo', e);
  }
  onProgress(10);

  // ─── Fonctions utilitaires ───
  const addFooter = () => {
    const pages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      const fy = doc.internal.pageSize.getHeight() - 15;
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.setLineWidth(0.3);
      doc.line(margin, fy - 5, pageWidth - margin, fy - 5);
      doc.setFontSize(7);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text('Softwell - Bulletin de compétences individuel - Confidentiel', pageWidth / 2, fy, { align: 'center' });
      doc.text(`Page ${i} / ${pages}`, pageWidth - margin, fy, { align: 'right' });
    }
  };

  const checkPageBreak = (needed) => {
    if (y + needed > pageHeight - margin) {
      addFooter();
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  const drawProgressBar = (x, yPos, level, width = 60, height = 6) => {
    let barColor;
    if (level >= 70) barColor = successColor;
    else if (level >= 40) barColor = warningColor;
    else barColor = dangerColor;

    // Fond
    doc.setFillColor(235, 235, 235);
    doc.roundedRect(x, yPos, width, height, 1, 1, 'F');

    // Barre de progression
    const fillWidth = Math.max(4, (level / 100) * width);
    doc.setFillColor(barColor[0], barColor[1], barColor[2]);
    doc.roundedRect(x, yPos, fillWidth, height, 1, 1, 'F');

    // Texte du pourcentage
    doc.setFontSize(7);
    doc.setTextColor(50, 50, 50);
    doc.text(`${Math.round(level)}%`, x + width + 4, yPos + height - 1);
  };

  // ─── 1. EN-TÊTE AVEC LOGO ───
  onProgress(15);
  try {
    doc.addImage(logoPath, 'PNG', margin, y, 30, 12);
  } catch (e) {
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('SOFTWELL', margin, y + 8);
  }

  // Référence et date
  doc.setFontSize(8);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const refStr = `BULL-CPT-${bulletinData.employeeId}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  doc.text(`Réf: ${refStr}`, pageWidth - margin, y + 3, { align: 'right' });
  doc.text(`Date: ${dateStr}`, pageWidth - margin, y + 10, { align: 'right' });

  y += 18;

  // Ligne séparatrice
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;

  // ─── 2. TITRE ───
  doc.setFontSize(18);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont(undefined, 'bold');
  doc.text('BULLETIN DE COMPÉTENCES INDIVIDUEL', pageWidth / 2, y, { align: 'center' });
  y += 12;

  // ─── 3. INFORMATIONS EMPLOYÉ ───
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.roundedRect(margin, y, contentWidth, 32, 2, 2, 'FD');
  y += 8;

  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('INFORMATIONS DE L\'EMPLOYÉ', pageWidth / 2, y, { align: 'center' });
  y += 8;

  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);

  const colLeft = margin + 8;
  const colRight = pageWidth / 2 + 15;

  doc.text(`Nom : ${bulletinData.employeeName || ''} ${bulletinData.employeeFirstName || ''}`, colLeft, y);
  doc.text(`Matricule : ${bulletinData.registrationNumber || 'N/A'}`, colRight, y);
  y += 6;
  doc.text(`Département : ${bulletinData.departmentName || 'Non défini'}`, colLeft, y);

  y += 14;

  // ─── 4. RÉSUMÉ STATISTIQUE ───
  onProgress(25);
  const masteredPct = bulletinData.totalSkills > 0
    ? Math.round((bulletinData.masteredCount / bulletinData.totalSkills) * 100)
    : 0;
  const inProgressPct = bulletinData.totalSkills > 0
    ? Math.round((bulletinData.inProgressCount / bulletinData.totalSkills) * 100)
    : 0;
  const notAcquiredPct = bulletinData.totalSkills > 0
    ? Math.round((bulletinData.notAcquiredCount / bulletinData.totalSkills) * 100)
    : 0;

  // Encadré statistiques
  const statBoxHeight = 45;
  checkPageBreak(statBoxHeight + 10);

  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.roundedRect(margin, y, contentWidth, statBoxHeight, 2, 2, 'FD');

  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('SYNTHÈSE DES COMPÉTENCES', pageWidth / 2, y + 8, { align: 'center' });

  // 3 blocs stats côte à côte
  const blockW = (contentWidth - 40) / 3;
  const blockY = y + 14;
  const labels = [
    { label: 'Maîtrisées', count: bulletinData.masteredCount, pct: masteredPct, color: successColor },
    { label: 'En cours d\'acquisition', count: bulletinData.inProgressCount, pct: inProgressPct, color: warningColor },
    { label: 'Non acquises', count: bulletinData.notAcquiredCount, pct: notAcquiredPct, color: dangerColor },
  ];

  labels.forEach((item, idx) => {
    const bx = margin + 10 + idx * (blockW + 10);
    doc.setFillColor(item.color[0], item.color[1], item.color[2]);
    doc.roundedRect(bx, blockY, blockW, 24, 2, 2, 'F');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text(String(item.count), bx + blockW / 2, blockY + 12, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont(undefined, 'normal');
    doc.text(item.label, bx + blockW / 2, blockY + 20, { align: 'center' });
  });

  y += statBoxHeight + 12;

  // ─── 5. COMPÉTENCES PAR DOMAINE ───
  onProgress(40);
  // L'API retourne en camelCase (domaines) et non PascalCase (Domains)
  const domains = bulletinData.domains || bulletinData.Domains || [];

  if (!domains || domains.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text('Aucune compétence enregistrée pour cet employé.', pageWidth / 2, y, { align: 'center' });
  } else {
    for (let dIdx = 0; dIdx < domains.length; dIdx++) {
      const domain = domains[dIdx];
      const allSkills = domain.skills || [];

      // ── 5a. Titre du domaine ──
      checkPageBreak(30);

      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.roundedRect(margin, y, contentWidth, 10, 1, 1, 'F');
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(255, 255, 255);
      const domainTitle = `${domain.domainName.toUpperCase()} (${allSkills.length} compétence${allSkills.length > 1 ? 's' : ''})`;
      doc.text(domainTitle, margin + 5, y + 7);
      y += 14;

      // ── 5b. Regrouper par classification ──
      const mastered = allSkills.filter(s => s.classification === 'maitrisee');
      const inProgress = allSkills.filter(s => s.classification === 'en_cours');
      const notAcquired = allSkills.filter(s => s.classification === 'non_acquise');

      const sections = [
        { label: 'COMPÉTENCES MAÎTRISÉES', items: mastered, color: successColor },
        { label: 'COMPÉTENCES EN COURS D\'ACQUISITION', items: inProgress, color: warningColor },
        { label: 'COMPÉTENCES NON ACQUISES', items: notAcquired, color: dangerColor },
      ];

      for (const section of sections) {
        if (section.items.length === 0) continue;

        // Titre de section
        checkPageBreak(20);
        doc.setFontSize(8);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(section.color[0], section.color[1], section.color[2]);
        doc.text(`▸ ${section.label} (${section.items.length})`, margin + 3, y);
        y += 6;

        // Tableau des compétences de cette section
        const tableHeaders = [['Compétence', 'Niveau', 'Progression', 'Dernière mise à jour']];
        const tableData = section.items.map(skill => [
          skill.skillName,
          skill.classificationLabel,
          `${Math.round(skill.level)}%`,
          skill.lastUpdated ? new Date(skill.lastUpdated).toLocaleDateString('fr-FR') : 'N/A'
        ]);

        doc.autoTable({
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

        y = doc.autoTable.previous.finalY + 6;
      }

      // Séparateur entre domaines
      y += 4;
    }
  }

  // ─── 6. LÉGENDE ───
  onProgress(80);
  checkPageBreak(30);

  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('LÉGENDE', margin, y);
  y += 5;

  const legendItems = [
    { label: 'Maîtrisée (>= 70%)', color: successColor },
    { label: 'En cours (40% - 69%)', color: warningColor },
    { label: 'Non acquise (< 40%)', color: dangerColor },
  ];

  // Disposition sur 2 lignes pour éviter le débordement
  const legendColWidth = contentWidth / 2;
  legendItems.forEach((item, idx) => {
    const row = idx < 2 ? 0 : 1;
    const col = idx < 2 ? idx : 0;
    const lx = margin + 8 + col * legendColWidth;
    const ly = y + row * 11;
    doc.setFillColor(item.color[0], item.color[1], item.color[2]);
    doc.roundedRect(lx, ly, 7, 7, 1, 1, 'F');
    doc.setFont(undefined, 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text(item.label, lx + 11, ly + 5.5);
  });
  y += (legendItems.length > 2 ? 26 : 16);

  y += 14;

  // ─── 7. SIGNATURES ───
  checkPageBreak(30);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text('Document généré le ' + dateStr, margin, y);
  y += 5;
  doc.text('Ce bulletin reflète l\'état des compétences de l\'employé à la date de génération.', margin, y);

  // Lignes de signature
  y += 20;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  const sigW = 70;
  doc.line(margin, y, margin + sigW, y);
  doc.line(pageWidth - margin - sigW, y, pageWidth - margin, y);
  y += 4;
  doc.setFontSize(7);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text('L\'employé', margin, y);
  doc.text('Le responsable RH', pageWidth - margin - sigW, y);

  // ─── Pied de page sur toutes les pages ───
  addFooter();

  onProgress(100);
  return doc;
};

/**
 * Télécharge le bulletin de compétences au format PDF.
 */
export const downloadBulletinPDF = async (bulletinData, onProgress) => {
  const doc = await generateBulletinPDF(bulletinData, onProgress);
  const fileName = `bulletin_competences_${bulletinData.registrationNumber || bulletinData.employeeId}_${new Date().getTime()}.pdf`;
  doc.save(fileName);
  return fileName;
};

/**
 * Génère une URL de prévisualisation pour le bulletin de compétences.
 */
export const previewBulletinPDF = async (bulletinData, onProgress) => {
  const doc = await generateBulletinPDF(bulletinData, onProgress);
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
};
