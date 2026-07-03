import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Importer le logo Softwell
import logoPath from '../../../assets/images/Logo/softwellogo.png';

/**
 * Fonction commune pour générer le contenu du PDF
 * @param {jsPDF} doc - Document PDF
 * @param {Object} evaluationData - Données de l'évaluation
 * @param {Object} employeeData - Données de l'employé
 * @param {Object} questionsData - Données des questions avec texte complet
 * @param {Number} average - Note moyenne
 * @param {Object} validationData - Données de validation
 * @param {Array} trainingSuggestions - Suggestions de formation
 */
const generatePDFContent = async (
  doc,
  evaluationData,
  employeeData,
  questionsData,
  average,
  validationData,
  trainingSuggestions = []
) => {
  // Couleurs principales (tons sobres professionnels)
  const primaryColor = [0, 48, 87]; // Bleu foncé
  const secondaryColor = [128, 128, 128]; // Gris
  const borderColor = [220, 220, 220]; // Gris clair
  
  console.log('Données reçues dans generatePDFContent:', {
    evaluationData, 
    questionsData
  });
  
  // Paramètres du document
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = margin;

  try {
    // Ajouter le logo Softwell en haut à gauche avec gestion d'erreur
    try {
      // Créer une image pour vérifier que le logo est chargeable
      const img = new Image();
      img.src = logoPath;
      
      // Fonction pour ajouter l'image au PDF une fois chargée
      const addLogoToPdf = () => {
        try {
          doc.addImage(logoPath, 'PNG', margin, y, 35, 15);
          console.log("Logo ajouté avec succès au PDF");
        } catch (logoError) {
          console.error("Erreur lors de l'ajout du logo au PDF:", logoError);
          // Ajouter un texte à la place du logo
          doc.setFontSize(12);
          doc.setTextColor(0, 0, 0);
          doc.text("SOFTWELL", margin, y + 10);
        }
      };
      
      // Si l'image est déjà en cache/chargée
      if (img.complete) {
        addLogoToPdf();
      } else {
        // Sinon attendre le chargement
        img.onload = addLogoToPdf;
        // En cas d'erreur de chargement
        img.onerror = () => {
          console.error("Erreur de chargement du logo");
          // Ajouter un texte à la place du logo
          doc.setFontSize(12);
          doc.setTextColor(0, 0, 0);
          doc.text("SOFTWELL", margin, y + 10);
        };
      }
    } catch (logoError) {
      console.error("Erreur lors du chargement du logo:", logoError);
      // Ajouter un texte à la place du logo
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text("SOFTWELL", margin, y + 10);
    }
    
    // Ajouter un en-tête en haut à droite
    doc.setFontSize(10);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(`Réf: EVAL-${evaluationData.evaluationId}`, pageWidth - margin, y, { align: 'right' });
    doc.text(`Date: ${evaluationData.date}`, pageWidth - margin, y + 5, { align: 'right' });
    
    y += 25;

    // Ligne de séparation
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    
    y += 10;
    
    // Titre du document avec type d'évaluation
  doc.setFontSize(16);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`FICHE D'ÉVALUATION DES COMPÉTENCES`, pageWidth / 2, y, { align: 'center' });
    
  y += 10;
  
    // Type d'évaluation
  doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`Type: ${evaluationData.type || 'Non spécifié'}`, pageWidth / 2, y, { align: 'center' });
    
    y += 15;

    // Section informations de l'employé dans un encadré
    doc.setFillColor(248, 248, 248); // Fond gris très clair
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.roundedRect(margin, y, pageWidth - (2 * margin), 40, 2, 2, 'FD');
    
    y += 10;
    
    // Informations de l'employé sur deux colonnes
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0); // Noir
    doc.setFont(undefined, 'bold');
    doc.text('INFORMATIONS DE L\'EMPLOYÉ', pageWidth / 2, y, { align: 'center' });
    
    y += 10;
    
    doc.setFont(undefined, 'normal');
    const col1 = margin + 5;
    const col2 = pageWidth / 2 + 10;
    
    doc.text(`Nom et prénom: ${employeeData.firstName} ${employeeData.lastName}`, col1, y);
    doc.text(`Département: ${employeeData.department}`, col2, y);
    
  y += 7;
    
    doc.text(`Poste: ${employeeData.position}`, col1, y);
    
  y += 15;
  
    // Section Note moyenne et appréciation
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(margin, y, pageWidth - (2 * margin), 25, 2, 2, 'FD');
    
    y += 13;
    
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont(undefined, 'bold');
    doc.text('ÉVALUATION GLOBALE', margin + 5, y);
    
    // Afficher la note moyenne avec une couleur basée sur la valeur
    let scoreColor;
    if (average >= 4) scoreColor = [39, 174, 96]; // Vert
    else if (average >= 3) scoreColor = [41, 128, 185]; // Bleu
    else if (average >= 2) scoreColor = [243, 156, 18]; // Orange
    else scoreColor = [192, 57, 43]; // Rouge
    
    const scoreText = `Note moyenne: ${average}/5`;
    const scoreWidth = doc.getTextWidth(scoreText);
    
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.text(scoreText, pageWidth - margin - scoreWidth, y);
    
    y += 8;
    
    // Ajout de l'appréciation
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    doc.text(`Appréciation: ${evaluationData.appreciation || 'Non définie'}`, margin + 5, y);
    
  y += 15;
  
    // Tableau des notations avec le texte complet des questions
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('DÉTAIL DES ÉVALUATIONS', margin, y);
    
    y += 7;
    
    // Limiter le nombre de questions à afficher pour plus de lisibilité
    const MAX_QUESTIONS = 15;
    let questionsEntries = Object.entries(questionsData);
    let isQuestionsLimited = false;
    
    if (questionsEntries.length > MAX_QUESTIONS) {
      questionsEntries = questionsEntries.slice(0, MAX_QUESTIONS);
      isQuestionsLimited = true;
    }
    
    // Tableau des questions
    const headers = [['Question', 'Compétence', 'Note', 'Commentaire']];
    const data = questionsEntries.map(([questionId, question]) => {
      console.log(`Traitement de la question ${questionId}:`, question);
      
      // Vérification et traitement des données pour éviter les erreurs d'affichage
      const questionText = question.text || 'Texte non disponible';
      
      // Récupérer le nom de la compétence
      const competence = question.competenceName || `Compétence ${question.competenceLineId}` || 'Non spécifiée';
      
      const note = question.note !== undefined ? `${question.note}/5` : '0/5';
      
      // Le commentaire a déjà une valeur par défaut définie dans Step3.jsx
      const commentText = question.comment || 'Pas de commentaire';
      
      return [
        // Tronquer le texte de la question si trop long
        questionText.length > 60 ? questionText.substring(0, 57) + '...' : questionText,
        competence,
        note,
        // Tronquer le commentaire si trop long
        commentText.length > 40 ? commentText.substring(0, 37) + '...' : commentText
      ];
    });
  
  doc.autoTable({
    head: headers,
    body: data,
    startY: y,
      margin: { left: margin, right: margin },
      headStyles: { 
        fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      theme: 'grid',
      columnStyles: {
        0: { cellWidth: 80 }, // Question
        1: { cellWidth: 40 }, // Compétence
        2: { cellWidth: 20 }, // Note
        3: { cellWidth: 'auto' }  // Commentaire
      }
    });
    
    y = doc.autoTable.previous.finalY + 5;
    
    if (isQuestionsLimited) {
      doc.setFontSize(9);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text(`* Limité aux ${MAX_QUESTIONS} premières questions par souci de lisibilité.`, margin, y);
      y += 10;
    }
    
    // Section Validation
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont(undefined, 'bold');
    doc.text('VALIDATION', margin, y);
    
    y += 7;
    
    // Tableau de validation
    const validationHeaders = [['Approbation', 'Statut', 'Date']];
    const validationTableData = [
      ['Chef de service', validationData.serviceApproved ? 'Approuvé' : 'Non approuvé', validationData.serviceDate || ''],
      ['Direction générale', validationData.dgApproved ? 'Approuvé' : 'Non approuvé', validationData.dgDate || '']
    ];
    
    doc.autoTable({
      head: validationHeaders,
      body: validationTableData,
      startY: y,
      margin: { left: margin, right: margin },
      headStyles: { 
        fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      theme: 'grid'
    });
    
    y = doc.autoTable.previous.finalY + 10;
    
    // Suggestions de formation (si présentes et si il reste de la place)
    if (trainingSuggestions && trainingSuggestions.length > 0) {
      // Vérifier s'il reste assez d'espace sur la page
      if (y > doc.internal.pageSize.getHeight() - 60) {
        doc.addPage();
        y = margin;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont(undefined, 'bold');
      doc.text('SUGGESTIONS DE FORMATION', margin, y);
      
      y += 7;
      
      // Limiter le nombre de suggestions pour plus de lisibilité
      const MAX_SUGGESTIONS = 5;
      let suggestionsToShow = trainingSuggestions;
      let isSuggestionsLimited = false;
      
      if (trainingSuggestions.length > MAX_SUGGESTIONS) {
        suggestionsToShow = trainingSuggestions.slice(0, MAX_SUGGESTIONS);
        isSuggestionsLimited = true;
      }
      
      const suggestionHeaders = [['Question', 'Formation recommandée']];
      const suggestionData = suggestionsToShow.map(suggestion => [
        suggestion.question || '',
        suggestion.training
      ]);
      
      doc.autoTable({
        head: suggestionHeaders,
        body: suggestionData,
        startY: y,
        margin: { left: margin, right: margin },
        headStyles: { 
          fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        theme: 'grid'
      });
      
      y = doc.autoTable.previous.finalY + 5;
      
      if (isSuggestionsLimited) {
        doc.setFontSize(9);
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.text(`* Limité aux ${MAX_SUGGESTIONS} premières suggestions par souci de lisibilité.`, margin, y);
      }
    }
    
    // Pied de page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Ligne de séparation
      const footerY = doc.internal.pageSize.getHeight() - 15;
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.setLineWidth(0.5);
      doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
      
      // Texte de pied de page
      doc.setFontSize(8);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text(`Softwell - Rapport d'évaluation des compétences - Confidentiel`, pageWidth / 2, footerY, { align: 'center' });
      doc.text(`Page ${i} / ${pageCount}`, pageWidth - margin, footerY, { align: 'right' });
    }
  } catch (error) {
    console.error("Erreur lors de la génération du contenu du PDF:", error);
  }
};

/**
 * Génère et télécharge un PDF d'évaluation.
 * @param {Object} evaluationData - Données de l'évaluation
 * @param {Object} employeeData - Données de l'employé
 * @param {Object} questionsData - Données des questions avec texte complet
 * @param {Number} average - Note moyenne
 * @param {Object} validationData - Données de validation
 * @param {Array} trainingSuggestions - Suggestions de formation
 * @returns {String} Nom du fichier généré
 */
export const downloadEvaluationPDF = async (
  evaluationData,
  employeeData,
  questionsData,
  average,
  validationData,
  trainingSuggestions = []
) => {
  // Créer un nouveau document PDF
  const doc = new jsPDF();
  
  // Précharger l'image du logo pour s'assurer qu'elle est disponible
  try {
    const img = new Image();
    img.src = logoPath;
    
    // Attendre que l'image soit chargée avant de générer le PDF
    await new Promise((resolve) => {
      if (img.complete) {
        resolve();
      } else {
        img.onload = resolve;
        img.onerror = () => {
          console.warn("Impossible de charger le logo, le PDF sera généré sans logo");
          resolve(); // Continuer même si le logo ne peut pas être chargé
        };
      }
    });
  } catch (error) {
    console.warn("Erreur lors du préchargement du logo:", error);
  }
  
  // Générer le contenu du PDF
  await generatePDFContent(doc, evaluationData, employeeData, questionsData, average, validationData, trainingSuggestions);
  
  // Enregistrer et télécharger le PDF
  const fileName = `evaluation_${evaluationData.evaluationId}_${new Date().getTime()}.pdf`;
  
  try {
    // Méthode 1: Utiliser la méthode save() standard
    doc.save(fileName);
    console.log("PDF téléchargé avec la méthode standard");
  } catch (error) {
    console.error("Erreur avec la méthode standard:", error);
    
    try {
      // Méthode 2: Téléchargement manuel via un lien
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = fileName;
      
      // Simuler un clic pour déclencher le téléchargement
      document.body.appendChild(downloadLink);
      downloadLink.click();
      
      // Nettoyer
      setTimeout(() => {
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);
      }, 100);
      
      console.log("PDF téléchargé avec la méthode alternative");
    } catch (alternativeError) {
      console.error("Échec des deux méthodes de téléchargement:", alternativeError);
      alert("Erreur lors du téléchargement du PDF. Veuillez réessayer.");
    }
  }
  
  return fileName;
};

/**
 * Génère une URL pour prévisualiser un PDF d'évaluation
 */
export const previewEvaluationPDF = async (
  evaluationData,
  employeeData,
  questionsData,
  average,
  validationData,
  trainingSuggestions = []
) => {
  // Créer un nouveau document PDF identique à celui du téléchargement
  const doc = new jsPDF();
  
  // Précharger l'image du logo pour s'assurer qu'elle est disponible
  try {
    const img = new Image();
    img.src = logoPath;
    
    // Attendre que l'image soit chargée avant de générer le PDF
    await new Promise((resolve) => {
      if (img.complete) {
        resolve();
      } else {
        img.onload = resolve;
        img.onerror = () => {
          console.warn("Impossible de charger le logo pour la prévisualisation, le PDF sera généré sans logo");
          resolve(); // Continuer même si le logo ne peut pas être chargé
        };
      }
    });
  } catch (error) {
    console.warn("Erreur lors du préchargement du logo pour la prévisualisation:", error);
  }
  
  // Générer le contenu du PDF
  await generatePDFContent(doc, evaluationData, employeeData, questionsData, average, validationData, trainingSuggestions);
  
  // Générer un blob du PDF et créer une URL pour la prévisualisation
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}; 