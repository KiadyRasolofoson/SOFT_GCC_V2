
import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

function DateDisplay({ isoDate }) {
    const parsedDate = new Date(isoDate);

    if (isNaN(parsedDate.getTime())) { // Vérifie si la date est invalide
        return <span>Date invalide</span>; // Ou un autre message
    }
    // Convertir la date ISO au format désiré
    const formattedDate = format(parsedDate, "'Le' dd MMMM yyyy 'à' HH'h'mm", { locale: fr });

    return <span>{formattedDate}</span>;
}

export default DateDisplay;