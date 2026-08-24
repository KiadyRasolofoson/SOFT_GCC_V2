export const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
  
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

export const isValidInterviewDate = (dateString) => {
    return dateString !== null && dateString !== '' && dateString.trim() !== '';
  };
  

// src/utils.jsx
export const compareDates = (dateString, today) => {
  // 1. Vérifier si dateString ou today est null ou undefined
  if (!dateString || !today) {
    console.error("dateString or today is null or undefined");
    return false; // Retourne false ou une valeur par défaut selon votre logique
  }

  // 2. Extraire la partie date (sans l'heure) de dateString
  const [datePart] = dateString.split('T');

  // 3. Créer des objets Date pour les comparer
  const dateWithoutTime = new Date(datePart);
  const todayDate = new Date(today);

  // 4. Vérifier si les dates sont valides
  if (isNaN(dateWithoutTime.getTime()) || isNaN(todayDate.getTime())) {
    console.error("Invalid date format");
    return false; // Retourne false si les dates ne sont pas valides
  }

  // 5. Ignorer l'heure en réinitialisant les heures, minutes, secondes et millisecondes
  dateWithoutTime.setHours(0, 0, 0, 0);
  todayDate.setHours(0, 0, 0, 0);

  // 6. Comparer les dates en utilisant leur timestamp
  return dateWithoutTime.getTime() === todayDate.getTime();
};

  
  
  