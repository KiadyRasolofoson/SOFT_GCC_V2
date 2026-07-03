
import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

function DateDisplayWithTime({ isoDate }) {
    const parsedDate = new Date(isoDate);

    if (isNaN(parsedDate.getTime())) { // Vérifie si la date est invalide
        return <span>Date invalide</span>;
    }
    if(parsedDate.getTime() === 0) {
        return <span>NULL</span>;
    }
    // Convertir la date ISO au format désiré
    const formattedDate = format(parsedDate, "dd/MM/yyyy 'à' HH'h'mm", { locale: fr });

    return <span>{formattedDate}</span>;
}

export default DateDisplayWithTime;