import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { urlApi } from './utils';

function PaginatedList({url, pageNumber, pageSize, columns}) {
    const [data, setData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10); // Nombre d'éléments par page
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => {
        fetchData(currentPage, pageSize);
    }, [currentPage, pageSize]);

    const fetchData = async (pageNumber, pageSize) => {
        try {
            const response = await axios.get(`${urlApi(url)}?pageNumber=${pageNumber}&pageSize=${pageSize}`);
            setData(response.data.Data);
            setTotalPages(response.data.TotalPages);
        } catch (error) {
            console.error('Erreur lors de la récupération des données :', error);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    return (
        <div>
            <ul>
                {data.map((item) => (
                    <li key={item.id}>{item.name}</li>
                ))}
            </ul>
            <div className="pagination">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                    Précédent
                </button>
                <span>Page {currentPage} de {totalPages}</span>
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                    Suivant
                </button>
            </div>
        </div>
    );
}


export default PaginatedList;
