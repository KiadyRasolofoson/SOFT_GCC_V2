import { format } from 'date-fns';

// Gestion du format date
function FormattedDate({ date }) {
    if(date == null) {
        return <span>NULL</span>; 
    }
    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) { 
        return <span>Date invalide</span>; 
    }

    const formattedDate = format(parsedDate, 'dd/MM/yyyy');
    return <span>{formattedDate}</span>;
}

export default FormattedDate;