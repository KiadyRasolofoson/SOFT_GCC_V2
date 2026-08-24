import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5189/api') + '/EvaluationType';

const EvaluationTypeService = {
    getEvaluationTypes: () => {
        return axios.get(API_URL);
    },

    getEvaluationType: (id) => {
        return axios.get(`${API_URL}/${id}`);
    },

    createEvaluationType: (evaluationType) => {
        return axios.post(API_URL, evaluationType);
    },

    updateEvaluationType: (id, evaluationType) => {
        return axios.put(`${API_URL}/${id}`, evaluationType);
    },

    deleteEvaluationType: (id) => {
        return axios.delete(`${API_URL}/${id}`);
    }
};

export default EvaluationTypeService; 